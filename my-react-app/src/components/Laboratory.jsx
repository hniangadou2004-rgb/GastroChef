import { useGame } from "../context/GameContext";
import { useState } from "react";

function Laboratory() {
  const { ingredients, loadingIngredients, discoverRecipe } = useGame();

  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (loadingIngredients) return <p>Chargement du labo...</p>;

  const toggleIngredient = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExperiment = async () => {
    if (selected.length === 0) {
      setMessage("❌ Sélectionne au moins un ingrédient");
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
        setMessage(`❌ ${data.message || "Erreur laboratoire"}`);
        return;
      }

      if (data.recipe) {
        discoverRecipe(data.recipe);
        setMessage(`🎉 Recette découverte : ${data.recipe.name}`);
      } else {
        setMessage("❌ Échec de l'expérience");
      }

      setSelected([]);
    } catch (err) {
      setMessage("❌ Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 p-4 shadow">
      <h2 className="card-title">🧪 Laboratoire</h2>

      {/* INGREDIENTS */}
      <div className="flex flex-wrap gap-2 mt-2">
        {ingredients.map((ing) => (
          <button
            key={ing._id}
            className={`btn btn-outline ${
              selected.includes(ing._id) ? "btn-primary" : ""
            }`}
            onClick={() => toggleIngredient(ing._id)}
          >
            {ing.name}
          </button>
        ))}
      </div>

      {/* BOUTON EXPERIENCE */}
      <div className="mt-4">
        <button
          className={`btn btn-success ${loading ? "loading" : ""}`}
          onClick={handleExperiment}
          disabled={loading}
        >
          Tester l'expérience
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <p
          className={`mt-2 text-sm ${
            message.startsWith("🎉") ? "text-success" : "text-error"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default Laboratory;
