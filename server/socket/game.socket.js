const jwt = require("jsonwebtoken");

const Save = require("../models/Save");
const Recipe = require("../models/Recipe");
const Transaction = require("../models/Transaction");

const activeUserSessions = new Map();

module.exports = (io) => {
    io.use((socket, next) => {
        try {
            const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

            if (!rawToken) {
                return next(new Error("Missing token."));
            }

            const token = rawToken.replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = decoded;

            return next();
        } catch (error) {
            return next(new Error("Invalid token."));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.user.id;

        socket.currentOrder = null;
        socket.orderTimeout = null;
        socket.isPaused = false;
        socket.orderPickCounter = 0;

        const previousSession = activeUserSessions.get(userId);

        if (previousSession?.socketId && previousSession.socketId !== socket.id) {
            const previousSocket = io.sockets.sockets.get(previousSession.socketId);

            if (previousSocket) {
                previousSocket.emit("economyUpdate", {
                    message: "Session ended because a new connection was opened."
                });
                previousSocket.disconnect(true);
            }
        }

        await Save.findOneAndUpdate(
            {
                user: userId
            },
            {
                $setOnInsert: {
                    restaurantName: socket.user.restaurantName || "My Restaurant",
                    learnedRecipes: []
                }
            },
            {
                upsert: true,
                new: true
            }
        );

        const bootSave = await Save.findOne({ user: userId });
        socket.satisfaction = bootSave?.satisfaction ?? 20;

        const clearCurrentOrderTimeout = () => {
            if (socket.orderTimeout) {
                clearTimeout(socket.orderTimeout);
                socket.orderTimeout = null;
            }
        };

        const emitSnapshot = async () => {
            const latestSave = await Save.findOne({ user: userId });

            socket.emit("economyUpdate", {
                treasury: latestSave?.treasury ?? 100,
                satisfaction: latestSave?.satisfaction ?? socket.satisfaction
            });
        };

        const resetSaveToInitialState = async () => {
            clearCurrentOrderTimeout();
            socket.currentOrder = null;

            const initialState = {
                learnedRecipes: [],
                inventory: {},
                treasury: 100,
                satisfaction: 20
            };

            const resetSave = await Save.findOneAndUpdate(
                {
                    user: userId
                },
                {
                    $set: initialState
                },
                {
                    new: true
                }
            );

            await Transaction.deleteMany({ user: userId });
            socket.satisfaction = 20;

            socket.emit("economyUpdate", {
                treasury: resetSave?.treasury ?? 100,
                satisfaction: resetSave?.satisfaction ?? 20
            });
        };

        const applyOrderFailure = async (order, message) => {
            socket.satisfaction -= 10;
            socket.currentOrder = null;

            const updatedSave = await Save.findOneAndUpdate(
                {
                    user: userId
                },
                {
                    $set: {
                        satisfaction: socket.satisfaction
                    }
                },
                {
                    new: true
                }
            );

            socket.emit("orderFailed", {
                satisfaction: socket.satisfaction,
                treasury: updatedSave?.treasury,
                message
            });

            const treasuryAfterFailure = Number(updatedSave?.treasury ?? 0);

            if (socket.satisfaction < 0 || treasuryAfterFailure < 0) {
                await resetSaveToInitialState();
                socket.emit("gameOver");
            }
        };

        const pickRecipeForOrder = async () => {
            const currentSave = await Save.findOne({ user: userId }).select("learnedRecipes");
            const learnedRecipeIds = (currentSave?.learnedRecipes || []).map((id) => id.toString());

            const allRecipes = await Recipe.find().select("name salePrice ingredients");

            if (!allRecipes.length) {
                return null;
            }

            const knownRecipes = allRecipes.filter((recipe) => learnedRecipeIds.includes(recipe._id.toString()));
            const unknownRecipes = allRecipes.filter((recipe) => !learnedRecipeIds.includes(recipe._id.toString()));

            if (knownRecipes.length > 0 && unknownRecipes.length > 0) {
                const shouldPickKnown = socket.orderPickCounter % 4 !== 3;
                socket.orderPickCounter += 1;

                if (shouldPickKnown) {
                    return knownRecipes[Math.floor(Math.random() * knownRecipes.length)];
                }

                return unknownRecipes[Math.floor(Math.random() * unknownRecipes.length)];
            }

            if (knownRecipes.length > 0) {
                return knownRecipes[Math.floor(Math.random() * knownRecipes.length)];
            }

            if (unknownRecipes.length > 0) {
                return unknownRecipes[Math.floor(Math.random() * unknownRecipes.length)];
            }

            return null;
        };

        const sendOrder = async () => {
            if (socket.isPaused || socket.disconnected) {
                return;
            }

            clearCurrentOrderTimeout();

            const recipe = await pickRecipeForOrder();

            if (!recipe) {
                return;
            }

            const order = {
                id: Date.now(),
                recipeId: recipe._id.toString(),
                recipe: recipe.name,
                salePrice: Number(recipe.salePrice || 10),
                expiresAt: Date.now() + 10000
            };

            socket.currentOrder = order;
            socket.emit("newOrder", order);

            socket.orderTimeout = setTimeout(async () => {
                if (socket.currentOrder?.id !== order.id || socket.isPaused || socket.disconnected) {
                    return;
                }

                await applyOrderFailure(order, "Order was not served in time.");
            }, 10000);
        };

        const interval = setInterval(sendOrder, 12000);

        const cleanupSession = () => {
            clearCurrentOrderTimeout();
            clearInterval(interval);

            if (activeUserSessions.get(userId)?.socketId === socket.id) {
                activeUserSessions.delete(userId);
            }
        };

        activeUserSessions.set(userId, {
            socketId: socket.id,
            cleanupSession
        });

        await sendOrder();

        socket.on("pauseOrders", () => {
            socket.isPaused = true;
            clearCurrentOrderTimeout();
            socket.currentOrder = null;
        });

        socket.on("resumeOrders", async () => {
            socket.isPaused = false;
            await sendOrder();
        });

        socket.on("serveOrder", async () => {
            try {
                if (!socket.currentOrder) {
                    socket.emit("orderFailed", {
                        message: "No active order to serve."
                    });
                    return;
                }

                const orderInProgress = socket.currentOrder;
                clearCurrentOrderTimeout();

                const recipe = await Recipe.findById(orderInProgress.recipeId).populate("ingredients.ingredient", "name price");

                if (!recipe) {
                    socket.currentOrder = null;
                    socket.emit("orderFailed", {
                        message: "Recipe not found."
                    });
                    return;
                }

                const saveDoc = await Save.findOne({ user: userId });
                const inventory = saveDoc.inventory || new Map();

                const missing = recipe.ingredients.find((item) => {
                    const ingredientId = item.ingredient?._id?.toString();
                    const stockQty = Number(inventory.get(ingredientId) || 0);
                    return stockQty < (item.quantity || 1);
                });

                if (missing) {
                    socket.emit("orderFailed", {
                        satisfaction: socket.satisfaction,
                        treasury: saveDoc.treasury,
                        message: "Not enough stock to serve this dish."
                    });

                    socket.currentOrder = orderInProgress;
                    socket.orderTimeout = setTimeout(async () => {
                        if (socket.currentOrder?.id !== orderInProgress.id || socket.isPaused || socket.disconnected) {
                            return;
                        }

                        await applyOrderFailure(orderInProgress, "Order was not served in time.");
                    }, Math.max(0, orderInProgress.expiresAt - Date.now()));

                    return;
                }

                const decrement = {};
                let ingredientCost = 0;

                recipe.ingredients.forEach((item) => {
                    const ingredientId = item.ingredient._id.toString();
                    decrement[`inventory.${ingredientId}`] = -(item.quantity || 1);
                    ingredientCost += (item.ingredient.price || 0) * (item.quantity || 1);
                });

                socket.satisfaction += 1;
                socket.currentOrder = null;

                const salePrice = Number(recipe.salePrice || 10);

                const updatedSave = await Save.findOneAndUpdate(
                    {
                        user: userId
                    },
                    {
                        $inc: {
                            ...decrement,
                            treasury: salePrice
                        },
                        $set: {
                            satisfaction: socket.satisfaction
                        }
                    },
                    {
                        new: true
                    }
                );

                await Transaction.create({
                    user: userId,
                    type: "ORDER_SERVED",
                    category: "income",
                    amount: salePrice,
                    metadata: {
                        recipeId: recipe._id,
                        recipeName: recipe.name,
                        salePrice,
                        ingredientCost
                    }
                });

                socket.emit("orderSuccess", {
                    satisfaction: socket.satisfaction,
                    treasury: updatedSave?.treasury,
                    amount: salePrice
                });

                if (socket.satisfaction < 0 || Number(updatedSave?.treasury ?? 0) < 0) {
                    await resetSaveToInitialState();
                    socket.emit("gameOver");
                    return;
                }

                await emitSnapshot();
            } catch (error) {
                socket.emit("orderFailed", {
                    message: "Service error."
                });
            }
        });

        socket.on("disconnect", cleanupSession);
    });
};
