import { useEffect, useState } from "react";
import { socket } from "../services/socket.js";
import { useGame } from "../context/GameContext";

function ServicePanel() {
  const { satisfaction, setSatisfaction, knownRecipes, updateEconomyFromSocket } = useGame();
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    socket.auth = { token: token ? `Bearer ${token}` : "" };
    socket.connect();

    socket.on("newOrder", setOrder);
    socket.on("orderSuccess", (data) => {
      setSatisfaction(data.satisfaction);
      updateEconomyFromSocket(data);
      setOrder(null);
      setMessage(`✅ Plat servi (+${data.amount || 0}💰)`);
    });
    socket.on("orderFailed", (data) => {
      if (typeof data?.satisfaction === "number") setSatisfaction(data.satisfaction);
      updateEconomyFromSocket(data || {});
      setOrder(null);
      setMessage(data?.message ? `❌ ${data.message}` : "❌ Commande échouée");
    });
    socket.on("economyUpdate", updateEconomyFromSocket);
    socket.on("gameOver", () => alert("💀 Game Over !"));

    return () => {
      socket.off("newOrder", setOrder);
      socket.off("orderSuccess");
      socket.off("orderFailed");
      socket.off("economyUpdate", updateEconomyFromSocket);
      socket.off("gameOver");
      socket.disconnect();
    };
  }, []);
  

  const knownRecipeNames = knownRecipes.map((recipe) => recipe?.name).filter(Boolean);
  const canServe = order && knownRecipeNames.includes(order.recipe);

  const serve = () => {
    if (canServe) {
      setMessage("");
      socket.emit("serveOrder");
    }
  };

  return (
    <div className="card bg-base-100 shadow p-4">
      <h2 className="text-lg font-bold">🔥 Service en cours</h2>
      {order ? (
        <>
          <p className="mt-2">Commande : {order.recipe}</p>
          <button className="btn btn-success mt-4" disabled={!canServe} onClick={serve}>
            Servir ({order.salePrice}💰)
          </button>
          {!canServe && <p className="text-error text-sm mt-2">Recette inconnue</p>}
        </>
      ) : (
        <p>En attente de commande...</p>
      )}
      <div className="mt-2 badge badge-primary">Satisfaction : {satisfaction}</div>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}

export default ServicePanel;
