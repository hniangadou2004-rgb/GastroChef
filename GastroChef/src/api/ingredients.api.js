export async function fetchIngredients() {
    const res = await fetch("http://localhost:5000/api/ingredients");

    if (!res.ok) {
        throw new Error("Failed to load ingredients.");
    }

    return res.json();
}
