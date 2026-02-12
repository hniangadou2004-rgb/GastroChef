const express = require("express");

const Ingredient = require("../models/Ingredient");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const ingredients = await Ingredient.find();
        return res.json(ingredients);
    } catch (error) {
        return res.status(500).json({ message: "Failed to load ingredients." });
    }
});

module.exports = router;
