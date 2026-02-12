import { useState } from "react";

import { useGame } from "../context/GameContext";

function Laboratory() {
    const { ingredients, loadingIngredients, discoverRecipe, loadEconomy, loadSave } = useGame();

    const [selected, setSelected] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    if (loadingIngredients) {
        return <p>Loading laboratory...</p>;
    }

    const toggleIngredient = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleExperiment = async () => {
        if (selected.length === 0) {
            setMessage("❌ Select at least one ingredient.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:5000/api/lab/experiment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ingredients: selected })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(`❌ ${data.message || "Lab error."}`);
                return;
            }

            if (data.recipe) {
                await loadSave();
                discoverRecipe(data.recipe);
                setMessage(`🎉 New recipe discovered: ${data.recipe.name}`);
            } else {
                setMessage("❌ Experiment failed.");
            }

            await loadEconomy();
            setSelected([]);
        } catch (error) {
            setMessage("❌ Server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card bg-base-100 p-4 shadow">
            <h2 className="card-title">🧪 Laboratory</h2>

            <div className="flex flex-wrap gap-2 mt-2">
                {ingredients.map((ing) => (
                    <button
                        key={ing._id}
                        className={`btn btn-outline ${selected.includes(ing._id) ? "btn-primary" : ""}`}
                        onClick={() => toggleIngredient(ing._id)}
                    >
                        {ing.name}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <button className={`btn btn-success ${loading ? "loading" : ""}`} onClick={handleExperiment} disabled={loading}>
                    Run experiment
                </button>
            </div>

            {message && <p className={`mt-2 text-sm ${message.startsWith("🎉") ? "text-success" : "text-error"}`}>{message}</p>}
        </div>
    );
}

export default Laboratory;
