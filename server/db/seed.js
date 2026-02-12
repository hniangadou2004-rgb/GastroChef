require("dotenv").config();

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("MongoDB connected");
}).catch((error) => {
    console.error("Error MongoDB", error);

    process.exit(1);
});

const IngredientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        price: { type: Number, default: 1 }
    }
);

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
    { name: "Tomate", price: 2 },
    { name: "Fromage", price: 3 },
    { name: "Pâte", price: 2 },
    { name: "Pain", price: 2 },
    { name: "Steak", price: 5 },
    { name: "Jambon", price: 4 },
    { name: "Pâtes", price: 2 },
    { name: "Viande", price: 5 },
    { name: "Laitue", price: 2 },
    { name: "Poulet", price: 5 },
    { name: "Croutons", price: 2 },
    { name: "Galette", price: 2 },
    { name: "Sauce", price: 1 },
    { name: "Oignon", price: 1 },
    { name: "Fromage Bleu", price: 4 },
    { name: "Mozzarella", price: 4 },
    { name: "Parmesan", price: 4 },
    { name: "Nouilles", price: 3 },
    { name: "Bouillon", price: 3 },
    { name: "Oeuf", price: 2 },
    { name: "Porc", price: 5 },
    { name: "Herbes", price: 1 },
    { name: "Légume Mystère", price: 6 }
];

const recipesData = [
    { name: "Pizza Margherita", salePrice: 18, ingredients: ["Tomate", "Fromage", "Pâte"] },
    { name: "Burger Classique", salePrice: 21, ingredients: ["Pain", "Steak", "Fromage"] },
    { name: "Croque Monsieur", salePrice: 17, ingredients: ["Pain", "Fromage", "Jambon"] },
    { name: "Pasta Bolognese", salePrice: 20, ingredients: ["Pâtes", "Tomate", "Viande"] },
    { name: "Salade César", salePrice: 19, ingredients: ["Laitue", "Poulet", "Croutons", "Fromage"] },
    { name: "Tacos Boeuf", salePrice: 20, ingredients: ["Galette", "Viande", "Fromage", "Sauce"] },
    { name: "Burger Gourmet", salePrice: 25, ingredients: ["Pain", "Steak", "Fromage", "Oignon", "Sauce"] },
    {
        name: "Pizza 4 Fromages",
        salePrice: 26,
        ingredients: ["Pâte", "Fromage", "Fromage Bleu", "Mozzarella", "Parmesan"]
    },
    { name: "Ramen", salePrice: 24, ingredients: ["Nouilles", "Bouillon", "Oeuf", "Porc"] },
    { name: "Soupe de l'Émeraude", salePrice: 28, ingredients: ["Bouillon", "Herbes", "Légume Mystère"] }
];

const hasDuplicateIngredient = (ingredients) => new Set(ingredients).size !== ingredients.length;

const seedDatabase = async () => {
    try {
        await Ingredient.deleteMany();
        await Recipe.deleteMany();

        const ingredients = await Ingredient.insertMany(ingredientsData);
        const ingredientMap = Object.fromEntries(ingredients.map((ing) => [ing.name, ing._id]));

        const recipesToInsert = recipesData.map((recipe) => {
            if (hasDuplicateIngredient(recipe.ingredients)) {
                throw new Error(`Recette invalide (doublon ingrédient): ${recipe.name}`);
            }

            const missingIngredients = recipe.ingredients.filter((name) => !ingredientMap[name]);
            if (missingIngredients.length > 0) {
                throw new Error(
                    `Recette invalide (${recipe.name}), ingrédients manquants: ${missingIngredients.join(", ")}`
                );
            }

            return {
                name: recipe.name,
                salePrice: recipe.salePrice,
                ingredients: recipe.ingredients.map((ingName) => ({
                    ingredient: ingredientMap[ingName],
                    quantity: 1
                }))
            };
        });

        await Recipe.insertMany(recipesToInsert);
        console.log("✅ Seed terminé avec succès !");
        process.exit();
    } catch (err) {
        console.error("❌ Erreur pendant le seed", err);
        process.exit(1);
    }
};

seedDatabase();