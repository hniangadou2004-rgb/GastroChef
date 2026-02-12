import { useMemo, useState } from "react";

import { useGame } from "../context/GameContext";

function Marketplace() {
    const { ingredientStock, loadingIngredients, buyIngredient } = useGame();

    const [message, setMessage] = useState("");
    const [quantities, setQuantities] = useState({});

    const sortedIngredients = useMemo(() => {
        return [...ingredientStock].sort((a, b) => a.name.localeCompare(b.name, "en"));
    }, [ingredientStock]);

    if (loadingIngredients) {
        return <p>Loading market...</p>;
    }

    const getQty = (id) => Math.max(1, Number(quantities[id] || 1));

    const handleQtyChange = (ingredientId, value) => {
        setQuantities((prev) => ({
            ...prev,
            [ingredientId]: value
        }));
    };

    const handleBuy = async (ingredientId, ingredientName) => {
        const quantity = getQty(ingredientId);

        try {
            await buyIngredient(ingredientId, quantity);
            setMessage(`✅ ${ingredientName} bought x${quantity}`);
        } catch (error) {
            setMessage(`❌ ${error.message}`);
        }
    };

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title">🛒 Market</h2>
                    <span className="badge badge-primary">Quick buy</span>
                </div>

                <div className="h-72 overflow-y-scroll pr-1">
                    <ul className="space-y-2">
                        {sortedIngredients.map((ing) => (
                            <li key={ing._id} className="rounded-lg bg-base-200 p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">{ing.name}</p>
                                        <p className="text-xs opacity-70">Unit price: {ing.price} 💰</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={getQty(ing._id)}
                                            onChange={(e) => handleQtyChange(ing._id, e.target.value)}
                                            className="input input-bordered input-sm w-20"
                                        />
                                        <button className="btn btn-sm btn-accent" onClick={() => handleBuy(ing._id, ing.name)}>
                                            Buy
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {message && <p className="text-sm mt-2">{message}</p>}
            </div>
        </div>
    );
}

export default Marketplace;
