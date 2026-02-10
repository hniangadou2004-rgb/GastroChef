const jwt = require("jsonwebtoken");
const Save = require("../models/Save");
const Recipe = require("../models/Recipe");
const Ingredient = require("../models/Ingredient");
const Transaction = require("../models/Transaction");

const ORDER_TIMEOUT_PENALTY = 8;

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!rawToken) return next(new Error("Token manquant"));
      const token = rawToken.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error("Token invalide"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    await Save.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { restaurantName: socket.user.restaurantName || "Mon Restaurant", learnedRecipes: [] } },
      { upsert: true, new: true }
    );

    const bootSave = await Save.findOne({ user: userId });
    socket.satisfaction = bootSave?.satisfaction ?? 20;

    const emitSnapshot = async () => {
      const latestSave = await Save.findOne({ user: userId });
      socket.emit("economyUpdate", {
        treasury: latestSave?.treasury ?? 0,
        satisfaction: latestSave?.satisfaction ?? socket.satisfaction
      });
    };

    const sendOrder = async () => {
      const currentSave = await Save.findOne({ user: userId }).select("learnedRecipes");
      const learnedRecipeIds = currentSave?.learnedRecipes || [];
      const candidateRecipes = learnedRecipeIds.length
        ? await Recipe.find({ _id: { $in: learnedRecipeIds } }).select("name salePrice ingredients")
        : await Recipe.find().limit(10).select("name salePrice ingredients");

      if (!candidateRecipes.length) return;

      const recipe = candidateRecipes[Math.floor(Math.random() * candidateRecipes.length)];
      const order = {
        id: Date.now(),
        recipeId: recipe._id.toString(),
        recipe: recipe.name,
        salePrice: recipe.salePrice,
        expiresAt: Date.now() + 10000
      };

      socket.currentOrder = order;
      socket.emit("newOrder", order);

      setTimeout(async () => {
        if (socket.currentOrder?.id !== order.id) return;

        socket.satisfaction -= 10;

        const updatedSave = await Save.findOneAndUpdate(
          { user: userId },
          { $inc: { treasury: -ORDER_TIMEOUT_PENALTY }, $set: { satisfaction: socket.satisfaction } },
          { new: true }
        );

        await Transaction.create({
          user: userId,
          type: "ORDER_TIMEOUT",
          category: "expense",
          amount: -ORDER_TIMEOUT_PENALTY,
          metadata: { recipeName: order.recipe }
        });

        socket.emit("orderFailed", {
          satisfaction: socket.satisfaction,
          treasury: updatedSave?.treasury
        });

        if (socket.satisfaction < 0) socket.emit("gameOver");
      }, 10000);
    };

    const interval = setInterval(sendOrder, 12000);
    await sendOrder();

    socket.on("serveOrder", async () => {
      try {
        if (!socket.currentOrder) return;

        const recipe = await Recipe.findById(socket.currentOrder.recipeId)
          .populate("ingredients.ingredient", "name price");
        if (!recipe) return;

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
            message: "Stock insuffisant pour servir ce plat"
          });
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

        const updatedSave = await Save.findOneAndUpdate(
          { user: userId },
          {
            $inc: { ...decrement, treasury: recipe.salePrice },
            $set: { satisfaction: socket.satisfaction }
          },
          { new: true }
        );

        await Transaction.create({
          user: userId,
          type: "ORDER_SERVED",
          category: "income",
          amount: recipe.salePrice,
          metadata: {
            recipeId: recipe._id,
            recipeName: recipe.name,
            salePrice: recipe.salePrice,
            ingredientCost
          }
        });

        socket.emit("orderSuccess", {
          satisfaction: socket.satisfaction,
          treasury: updatedSave?.treasury,
          amount: recipe.salePrice
        });

        await emitSnapshot();
      } catch (err) {
        console.error(err);
        socket.emit("orderFailed", { message: "Erreur service" });
      }
    });

    socket.on("disconnect", () => clearInterval(interval));
  });
};
