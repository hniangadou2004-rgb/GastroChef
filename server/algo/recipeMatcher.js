const RECIPES = [
  {
    name: "Pizza Margherita",
    ingredients: ["Tomate", "Fromage", "Pâte"]
  },
  {
    name: "Salade Caprese",
    ingredients: ["Tomate", "Fromage"]
  }
];

const matchRecipe = (ingredients) => {
  const sortedInput = ingredients.sort().join(",");

  return RECIPES.find(
    (r) => r.ingredients.sort().join(",") === sortedInput
  );
};

module.exports = matchRecipe;
