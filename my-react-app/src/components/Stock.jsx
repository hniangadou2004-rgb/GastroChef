import { useMemo } from "react";
import { useGame } from "../context/GameContext";

function Stock() {
  const { ingredientStock } = useGame();

  const sortedStock = useMemo(
    () => [...ingredientStock].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [ingredientStock]
  );

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">📦 Stock</h2>
          <span className="badge badge-ghost">{sortedStock.length} items</span>
        </div>

        <div className="max-h-72 overflow-y-auto pr-1">
          <ul className="space-y-2">
            {sortedStock.map((item) => (
              <li key={item._id} className="flex justify-between items-center rounded-lg bg-base-200 px-3 py-2 text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="badge badge-outline">{item.name}: {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Stock;
