import { useGame } from "../context/GameContext";

function Stock() {
  const { ingredientStock } = useGame();

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">📦 Stock</h2>

        <div className="flex gap-2 flex-wrap">
          {ingredientStock.map((item) => (
            <div key={item._id} className="badge badge-outline">
              {item.name} x{item.quantity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Stock;
