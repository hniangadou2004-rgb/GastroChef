const express = require("express");
const router = express.Router();
const Ingredient = require("../models/Ingredient");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ message: "Erreur chargement ingrédients" });
  }
});

module.exports = router;
