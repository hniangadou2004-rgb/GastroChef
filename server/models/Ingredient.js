const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, default: 1 },
});

module.exports = mongoose.model("Ingredient", IngredientSchema);
