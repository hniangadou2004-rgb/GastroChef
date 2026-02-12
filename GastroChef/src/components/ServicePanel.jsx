import { useEffect, useMemo, useRef, useState } from "react";

import { useGame } from "../context/GameContext";
import { socket } from "../services/socket.js";

const SERVICE_COOLDOWN_MS = 2000;
const SUCCESS_MESSAGE_MS = 3000;

function ServicePanel() {
    const { knownRecipes, updateEconomyFromSocket, ingredientStock } = useGame();
    const updateEconomyFromSocketRef = useRef(updateEconomyFromSocket);

    const [order, setOrder] = useState(null);
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [now, setNow] = useState(Date.now());

    const knownRecipeMap = useMemo(() => {
        const byName = new Map();
        const byId = new Map();

        knownRecipes.forEach((recipe) => {
            if (recipe?._id) {
                byId.set(recipe._id.toString(), recipe);
            }

            if (recipe?.name) {
                byName.set(recipe.name, recipe);
            }
        });

        return { byName, byId };
    }, [knownRecipes]);

    const stockById = useMemo(() => {
        const map = {};
        ingredientStock.forEach((item) => {
            map[item._id] = Number(item.quantity || 0);
        });
        return map;
    }, [ingredientStock]);

    const currentKnownRecipe = order
        ? knownRecipeMap.byId.get(order.recipeId) || knownRecipeMap.byName.get(order.recipe)
        : null;

    const hasRecipe = Boolean(currentKnownRecipe);

    const hasEnoughIngredients = useMemo(() => {
        if (!currentKnownRecipe?.ingredients) {
            return false;
        }

        return currentKnownRecipe.ingredients.every((item) => {
            const ingredientField = item?.ingredient;
            const ingredientId =
                typeof ingredientField === "string"
                    ? ingredientField
                    : ingredientField?._id?.toString?.();

            const neededQty = Number(item?.quantity || 1);

            if (!ingredientId) {
                return false;
            }

            return Number(stockById[ingredientId] || 0) >= neededQty;
        });
    }, [currentKnownRecipe, stockById]);

    const isCooldown = now < cooldownUntil;
    const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

    useEffect(() => {
        if (!isCooldown) {
            return undefined;
        }

        const timer = setInterval(() => setNow(Date.now()), 200);

        return () => clearInterval(timer);
    }, [isCooldown]);

    useEffect(() => {
        if (!successMessage) {
            return undefined;
        }

        const timer = setTimeout(() => setSuccessMessage(""), SUCCESS_MESSAGE_MS);

        return () => clearTimeout(timer);
    }, [successMessage]);

    useEffect(() => {
        updateEconomyFromSocketRef.current = updateEconomyFromSocket;
    }, [updateEconomyFromSocket]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        socket.auth = { token: token ? `Bearer ${token}` : "" };
        socket.connect();

        const handleVisibility = () => {
            if (document.hidden) {
                socket.emit("pauseOrders");
            } else {
                socket.emit("resumeOrders");
            }
        };

        const handleNewOrder = (nextOrder) => {
            setOrder(nextOrder);
            setMessage("");
        };

        const handleOrderSuccess = (data) => {
            updateEconomyFromSocketRef.current(data);
            setOrder(null);
            setMessage("");
            setSuccessMessage("✅ Customer served successfully.");
            setCooldownUntil(Date.now() + SERVICE_COOLDOWN_MS);
            setNow(Date.now());
        };

        const handleOrderFailed = (data) => {
            updateEconomyFromSocketRef.current(data || {});
            const isStockIssue = typeof data?.message === "string" && data.message.toLowerCase().includes("stock");

            if (!isStockIssue) {
                setOrder(null);
            }

            setMessage(data?.message ? `❌ ${data.message}` : "❌ Order failed.");

            if (typeof data?.satisfaction === "number" && data.satisfaction < 0) {
                handleGameOver();
            }
        };

        const handleEconomyUpdate = (payload) => {
            updateEconomyFromSocketRef.current(payload || {});
        };

        const handleGameOver = () => {
            socket.emit("pauseOrders");
            setOrder(null);
            setMessage("");
            setSuccessMessage("");
            setCooldownUntil(0);
            setNow(Date.now());

            alert("💀 Game Over!");

            socket.off("newOrder", handleNewOrder);
            socket.off("orderSuccess", handleOrderSuccess);
            socket.off("orderFailed", handleOrderFailed);
            socket.off("economyUpdate", handleEconomyUpdate);
            socket.off("gameOver", handleGameOver);
            socket.disconnect();
            window.location.reload();
        };

        document.addEventListener("visibilitychange", handleVisibility);

        socket.on("newOrder", handleNewOrder);
        socket.on("orderSuccess", handleOrderSuccess);
        socket.on("orderFailed", handleOrderFailed);
        socket.on("economyUpdate", handleEconomyUpdate);
        socket.on("gameOver", handleGameOver);

        if (document.hidden) {
            socket.emit("pauseOrders");
        } else {
            socket.emit("resumeOrders");
        }

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            socket.emit("pauseOrders");
            socket.off("newOrder", handleNewOrder);
            socket.off("orderSuccess", handleOrderSuccess);
            socket.off("orderFailed", handleOrderFailed);
            socket.off("economyUpdate", handleEconomyUpdate);
            socket.off("gameOver", handleGameOver);
            socket.disconnect();
        };
    }, []);

    const disabledReason = (() => {
        if (!order) return "no_order";
        if (isCooldown) return "cooldown";
        if (!socket.connected) return "disconnected";
        if (!hasRecipe) return "unknown_recipe";
        if (!hasEnoughIngredients) return "missing_ingredients";
        return null;
    })();

    const canServe = disabledReason === null;

    const serve = () => {
        setSuccessMessage("");

        if (!order) return setMessage("ℹ️ No active order.");
        if (isCooldown) return setMessage(`⏳ Cooldown active (${cooldownSeconds}s).`);
        if (!socket.connected) return setMessage("❌ Server connection lost. Please retry.");
        if (!hasRecipe) return setMessage("❌ You have not learned this dish yet.");
        if (!hasEnoughIngredients) return setMessage("❌ Not enough ingredients to serve this dish.");

        socket.emit("serveOrder");
        setMessage("⏳ Serving in progress...");
        setCooldownUntil(Date.now() + SERVICE_COOLDOWN_MS);
        setNow(Date.now());
    };

    const buttonClass = (() => {
        if (disabledReason === "missing_ingredients") return "btn btn-error mt-4 cursor-not-allowed";
        if (disabledReason === "unknown_recipe") return "btn mt-4 bg-transparent border border-white text-white cursor-not-allowed";
        if (disabledReason) return "btn btn-neutral mt-4 cursor-not-allowed";
        return "btn btn-success mt-4";
    })();

    return (
        <div className="card bg-base-100 shadow p-4">
            <h2 className="text-lg font-bold">🔥 Active Service</h2>
            {order ? (
                <>
                    <p className="mt-2">Order: {order.recipe}</p>
                    <button className={buttonClass} onClick={serve} disabled={!canServe}>
                        Serve ({order.salePrice}💰)
                    </button>
                    {!hasRecipe && <p className="text-error text-sm mt-2">Dish not learned.</p>}
                    {hasRecipe && !hasEnoughIngredients && <p className="text-error text-sm mt-2">Not enough ingredients.</p>}
                </>
            ) : (
                <p>Waiting for order...</p>
            )}

            {message && <p className="text-sm mt-2">{message}</p>}
            {successMessage && <p className="text-success text-sm mt-2">{successMessage}</p>}
        </div>
    );
}

export default ServicePanel;
