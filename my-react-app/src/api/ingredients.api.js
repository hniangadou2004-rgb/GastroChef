export const fetchIngredients = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/ingredients", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Impossible de charger les ingrédients");
  }

  return res.json();
};
