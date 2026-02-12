import { useGame } from "../context/GameContext";

function RecipeBook() {
    const { knownRecipes } = useGame();

    return (
        <div className="card bg-base-100 p-4 shadow mt-4">
            <h2 className="card-title">📖 Recipe Book</h2>
            {knownRecipes.length === 0 ? (
                <p>No recipe discovered yet.</p>
            ) : (
                <ul className="list-disc pl-5 mt-2">
                    {knownRecipes.map((recipe) => (
                        <li key={recipe._id}>{recipe.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default RecipeBook;
