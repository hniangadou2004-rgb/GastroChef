const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const Save = require("../models/Save");
const authMiddleware = require("../middleware/auth.middleware");
const mongoose = require("mongoose");

router.post("/experiment", authMiddleware, async (req, res) => {
  const { ingredients } = req.body; // tableau de string _id

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: "Ingrédients invalides" });
  }

  try {
    const selectedIds = ingredients.map((id) => id.toString());

    // récupérer toutes les recettes
    const allRecipes = await Recipe.find().populate("ingredients.ingredient");

    // Chercher une recette correspondante
    const recipe = allRecipes.find((r) => {
      const recipeIds = r.ingredients.map((i) => i.ingredient._id.toString());
      // vérifier que chaque ingrédient de la recette est dans la sélection
      return recipeIds.every((id) => selectedIds.includes(id)) &&
             selectedIds.length === recipeIds.length; // optionnel : empêcher sélection extra
    });

    if (!recipe) {
      return res.json({ recipe: null });
    }

    // Sauvegarde dans Save si pas déjà découverte
    const save = await Save.findOne({ user: req.user.id });
    if (!save.learnedRecipes.includes(recipe._id)) {
      save.learnedRecipes.push(recipe._id);
      await save.save();
    }

    return res.json({ recipe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
