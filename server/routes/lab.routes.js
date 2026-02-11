const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const Save = require("../models/Save");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/experiment", authMiddleware, async (req, res) => {
  const { ingredients } = req.body;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: "Ingrédients invalides" });
  }

  try {
    const selectedIds = ingredients.map((id) => id.toString());

    const allRecipes = await Recipe.find().populate("ingredients.ingredient", "_id");

    const recipe = allRecipes.find((r) => {
      const recipeIds = r.ingredients
        .map((i) => i.ingredient?._id?.toString())
        .filter(Boolean);

      if (recipeIds.length !== r.ingredients.length) {
        return false;
      }

      const hasAllRequiredIngredients = recipeIds.every((id) =>
        selectedIds.includes(id)
      );
      const sameIngredientCount = recipeIds.length === selectedIds.length;

      return hasAllRequiredIngredients && sameIngredientCount;
    });

    if (!recipe) {
      return res.json({ recipe: null });
    }

    const save = await Save.findOneAndUpdate(
      { user: req.user.id },
      {
        $setOnInsert: {
          restaurantName: req.user.restaurantName || "Mon Restaurant",
          learnedRecipes: []
        }
      },
      { upsert: true, new: true }
    );

    const learnedRecipes = Array.isArray(save.learnedRecipes)
      ? save.learnedRecipes
      : [];

    const alreadyLearned = learnedRecipes.some(
      (recipeId) => recipeId.toString() === recipe._id.toString()
    );

    if (!alreadyLearned) {
      save.learnedRecipes = [...learnedRecipes, recipe._id];
      await save.save();
    }

    return res.json({ recipe: { _id: recipe._id, name: recipe.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur laboratoire" });
  }
});

module.exports = router;
