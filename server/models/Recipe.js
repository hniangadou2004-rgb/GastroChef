const mongoose = require("mongoose");

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

module.exports = mongoose.model("Recipe", RecipeSchema);
