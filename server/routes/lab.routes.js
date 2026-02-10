const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const Save = require("../models/Save");
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/lab/experiment
router.post("/experiment", authMiddleware, async (req, res) => {
  const { ingredients } = req.body; // tableau de _id

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: "Ingrédients invalides" });
  }

  try {
    const selectedIds = ingredients.map((id) => id.toString());

    // 1️⃣ récupérer toutes les recettes avec les ingrédients peuplés
    const allRecipes = await Recipe.find().populate("ingredients.ingredient", "name");

    // 2️⃣ trouver une recette correspondant EXACTEMENT aux ingrédients sélectionnés
    const recipe = allRecipes.find((r) => {
      const recipeIds = r.ingredients
        .map((i) => i.ingredient?._id?.toString())
        .filter(Boolean);

      const hasAllRequiredIngredients = recipeIds.every((id) =>
        selectedIds.includes(id)
      );

      const sameIngredientCount = recipeIds.length === selectedIds.length;

      return hasAllRequiredIngredients && sameIngredientCount;
    });

    if (!recipe) {
      return res.json({ recipe: null });
    }

    // 3️⃣ récupérer ou créer la save du joueur
    let save = await Save.findOne({ user: req.user.id });
    if (!save) {
      save = await Save.create({
        user: req.user.id,
        restaurantName: req.user.restaurantName || "Mon Restaurant",
        learnedRecipes: []
      });
    }

    // 4️⃣ ajouter la recette si elle n’est pas déjà apprise
    const alreadyLearned = save.learnedRecipes.some(
      (rId) => rId.toString() === recipe._id.toString()
    );

    if (!alreadyLearned) {
      save.learnedRecipes.push(recipe._id);
      await save.save();
    }

    // 5️⃣ retourner la recette découverte
    return res.json({ recipe: { _id: recipe._id, name: recipe.name } });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur laboratoire" });
  }
});

module.exports = router;
