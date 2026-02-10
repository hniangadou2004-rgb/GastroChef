import { useState } from "react";
import { useGame } from "../context/GameContext";

function Marketplace() {
  const { ingredientStock, loadingIngredients, buyIngredient } = useGame();
  const [message, setMessage] = useState("");

  if (loadingIngredients) return <p>Chargement du marché...</p>;

  const handleBuy = async (ingredientId, ingredientName) => {
    try {
      await buyIngredient(ingredientId, 1);
      setMessage(`✅ ${ingredientName} acheté`);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="card bg-base-100 p-4 shadow">
      <h2 className="card-title">🛒 Marketplace</h2>

      <ul className="mt-2 space-y-2">
        {ingredientStock.map((ing) => (
          <li key={ing._id} className="flex justify-between items-center gap-2">
            <span>{ing.name} (Stock: {ing.quantity})</span>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary">{ing.price} 💰</span>
              <button className="btn btn-xs btn-accent" onClick={() => handleBuy(ing._id, ing.name)}>
                Acheter +1
              </button>
            </div>
          </li>
        ))}
      </ul>

      {message && <p className="text-sm mt-3">{message}</p>}
    </div>
  );
}

export default Marketplace;
