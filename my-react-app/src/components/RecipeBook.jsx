import { useGame } from "../context/GameContext.jsx";

function RecipeBook() {
  const { knownRecipes } = useGame();




  return (
    <div className="card p-4 bg-base-100 shadow">
      <h2 className="card-title">📖 Livre de recettes</h2>

      {knownRecipes.length === 0 ? (
        <p>Aucune recette découverte…</p>
      ) : (
        <ul>
          {knownRecipes.map((r) => (
            <li key={r._id}>{r.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecipeBook;
