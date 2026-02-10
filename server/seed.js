require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/GastroChef")
  .then(() => console.log("🟢 MongoDB connecté"))
  .catch((err) => {
    console.error("❌ Erreur MongoDB", err);
    process.exit(1);
  });

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, default: 1 }
});

const RecipeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  salePrice: { type: Number, default: 10 },
  ingredients: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient" },
      quantity: { type: Number, default: 1 }
    }
  ]
});

const Ingredient = mongoose.model("Ingredient", IngredientSchema);
const Recipe = mongoose.model("Recipe", RecipeSchema);

const ingredientsData = [
  { name: "Tomate", price: 1 },
  { name: "Fromage", price: 2 },
  { name: "Pâte", price: 1 },
  { name: "Pain", price: 1 },
  { name: "Steak", price: 3 },
  { name: "Jambon", price: 2 },
  { name: "Pâtes", price: 2 },
  { name: "Viande", price: 3 },
  { name: "Laitue", price: 1 },
  { name: "Poulet", price: 3 },
  { name: "Croutons", price: 1 },
  { name: "Galette", price: 1 },
  { name: "Sauce", price: 1 },
  { name: "Oignon", price: 1 },
  { name: "Fromage Bleu", price: 2 },
  { name: "Mozzarella", price: 2 },
  { name: "Parmesan", price: 2 },
  { name: "Nouilles", price: 2 },
  { name: "Bouillon", price: 2 },
  { name: "Oeuf", price: 1 },
  { name: "Porc", price: 3 },
  { name: "Herbes", price: 1 },
  { name: "Légume Mystère", price: 4 }
];

const recipesData = [
  { name: "Pizza Margherita", ingredients: ["Tomate", "Fromage", "Pâte"] },
  { name: "Burger Classique", ingredients: ["Pain", "Steak", "Fromage"] },
  { name: "Croque Monsieur", ingredients: ["Pain", "Fromage", "Jambon"] },
  { name: "Pasta Bolognese", ingredients: ["Pâtes", "Tomate", "Viande"] },
  { name: "Salade César", ingredients: ["Laitue", "Poulet", "Croutons", "Fromage"] },
  { name: "Tacos Boeuf", ingredients: ["Galette", "Viande", "Fromage", "Sauce"] },
  { name: "Burger Gourmet", ingredients: ["Pain", "Steak", "Fromage", "Oignon", "Sauce"] },
  {
    name: "Pizza 4 Fromages",
    ingredients: ["Pâte", "Fromage", "Fromage Bleu", "Mozzarella", "Parmesan"]
  },
  { name: "Ramen", ingredients: ["Nouilles", "Bouillon", "Oeuf", "Porc"] },
  { name: "Soupe de l'Émeraude", ingredients: ["Bouillon", "Herbes", "Légume Mystère"] }
];

const hasDuplicateIngredient = (ingredients) => new Set(ingredients).size !== ingredients.length;

const seedDatabase = async () => {
  try {
    // 🔹 Vider les collections
    await Ingredient.deleteMany();
    await Recipe.deleteMany();

    // 🔹 Insérer les ingrédients
    const ingredients = await Ingredient.insertMany(ingredientsData);
    const ingredientMap = Object.fromEntries(ingredients.map((ing) => [ing.name, ing._id]));

    // 🔹 Préparer et valider les recettes
    const recipesToInsert = recipesData.map((recipe) => {
      if (hasDuplicateIngredient(recipe.ingredients)) {
        throw new Error(`Recette invalide (doublon ingrédient): ${recipe.name}`);
      }
      const missing = recipe.ingredients.filter((name) => !ingredientMap[name]);
      if (missing.length > 0) {
        throw new Error(
          `Recette invalide (${recipe.name}), ingrédients manquants: ${missing.join(", ")}`
        );
      }
      return {
        name: recipe.name,
        salePrice: recipe.salePrice ?? 10,
        ingredients: recipe.ingredients.map((name) => ({
          ingredient: ingredientMap[name],
          quantity: 1
        }))
      };
    });

    // 🔹 Insérer les recettes
    await Recipe.insertMany(recipesToInsert);

    console.log("✅ Seed terminé avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur pendant le seed:", err);
    process.exit(1);
  }
};

seedDatabase();
