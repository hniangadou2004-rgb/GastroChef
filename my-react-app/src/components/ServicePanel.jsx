import { useEffect, useMemo, useState } from "react";
import { socket } from "../services/socket.js";
import { useGame } from "../context/GameContext";

const SERVICE_COOLDOWN_MS = 2000;
const SUCCESS_MESSAGE_MS = 3000;

function ServicePanel() {
  const {
    knownRecipes,
    updateEconomyFromSocket,
    ingredientStock
  } = useGame();

  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const knownRecipeMap = useMemo(() => {
    const map = new Map();
    knownRecipes.forEach((recipe) => {
      if (recipe?.name) map.set(recipe.name, recipe);
    });
    return map;
  }, [knownRecipes]);

  const stockById = useMemo(() => {
    const map = {};
    ingredientStock.forEach((item) => {
      map[item._id] = Number(item.quantity || 0);
    });
    return map;
  }, [ingredientStock]);

  const currentKnownRecipe = order ? knownRecipeMap.get(order.recipe) : null;
  const hasRecipe = Boolean(currentKnownRecipe);

  const hasEnoughIngredients = useMemo(() => {
    if (!currentKnownRecipe?.ingredients) return false;

    return currentKnownRecipe.ingredients.every((item) => {
      const ingredientId = item?.ingredient?.toString?.() || item?.ingredient?._id?.toString?.();
      const neededQty = Number(item?.quantity || 1);
      if (!ingredientId) return false;
      return Number(stockById[ingredientId] || 0) >= neededQty;
    });
  }, [currentKnownRecipe, stockById]);

  const isCooldown = now < cooldownUntil;
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  useEffect(() => {
    if (!isCooldown) return undefined;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => clearInterval(timer);
  }, [isCooldown]);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, SUCCESS_MESSAGE_MS);

    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    socket.auth = { token: token ? `Bearer ${token}` : "" };
    socket.connect();

    socket.on("newOrder", (nextOrder) => {
      setOrder(nextOrder);
      setMessage("");
    });

    socket.on("orderSuccess", (data) => {
      updateEconomyFromSocket(data);
      setOrder(null);
      setMessage("");
      setSuccessMessage("✅ Client servi avec succès !");
      setCooldownUntil(Date.now() + SERVICE_COOLDOWN_MS);
      setNow(Date.now());
    });

    socket.on("orderFailed", (data) => {
      updateEconomyFromSocket(data || {});
      setOrder(null);
      setMessage(data?.message ? `❌ ${data.message}` : "❌ Commande échouée");
    });

    socket.on("economyUpdate", updateEconomyFromSocket);
    socket.on("gameOver", () => alert("💀 Game Over !"));

    return () => {
      socket.off("newOrder");
      socket.off("orderSuccess");
      socket.off("orderFailed");
      socket.off("economyUpdate", updateEconomyFromSocket);
      socket.off("gameOver");
      socket.disconnect();
    };
  }, [updateEconomyFromSocket]);

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

    if (!order) {
      setMessage("ℹ️ Aucune commande en cours");
      return;
    }

    if (isCooldown) {
      setMessage(`⏳ Cooldown actif (${cooldownSeconds}s)`);
      return;
    }

    if (!socket.connected) {
      setMessage("❌ Connexion serveur perdue, réessaie dans quelques secondes");
      return;
    }

    if (!hasRecipe) {
      setMessage("❌ Tu n'as pas encore appris ce plat");
      return;
    }

    if (!hasEnoughIngredients) {
      setMessage("❌ Pas assez d'ingrédients pour servir ce plat");
      return;
    }

    socket.emit("serveOrder");
    setMessage("⏳ Service en cours...");
    setCooldownUntil(Date.now() + SERVICE_COOLDOWN_MS);
    setNow(Date.now());
  };

  const buttonClass = (() => {
    if (disabledReason === "missing_ingredients") {
      return "btn btn-error mt-4 cursor-not-allowed";
    }

    if (disabledReason === "unknown_recipe") {
      return "btn mt-4 bg-transparent border border-white text-white cursor-not-allowed";
    }

    if (disabledReason) {
      return "btn btn-neutral mt-4 cursor-not-allowed";
    }

    return "btn btn-success mt-4";
  })();

  return (
    <div className="card bg-base-100 shadow p-4">
      <h2 className="text-lg font-bold">🔥 Service en cours</h2>
      {order ? (
        <>
          <p className="mt-2">Commande : {order.recipe}</p>
          <button className={buttonClass} onClick={serve} disabled={!canServe}>
            Servir ({order.salePrice}💰)
          </button>
          {!hasRecipe && <p className="text-error text-sm mt-2">Plat non appris.</p>}
          {hasRecipe && !hasEnoughIngredients && (
            <p className="text-error text-sm mt-2">Ingrédients insuffisants.</p>
          )}
        </>
      ) : (
        <p>En attente de commande...</p>
      )}

      {message && <p className="text-sm mt-2">{message}</p>}
      {successMessage && <p className="text-success text-sm mt-2">{successMessage}</p>}
    </div>
  );
}

export default ServicePanel;
