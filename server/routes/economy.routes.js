const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const Save = require("../models/Save");
const Ingredient = require("../models/Ingredient");
const Recipe = require("../models/Recipe");
const Transaction = require("../models/Transaction");

const ensureSave = async (userId, restaurantName) => {
  return Save.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { restaurantName: restaurantName || "Mon Restaurant", learnedRecipes: [] } },
    { upsert: true, new: true }
  );
};

router.get("/overview", authMiddleware, async (req, res) => {
  try {
    const save = await ensureSave(req.user.id, req.user.restaurantName);
    const ingredients = await Ingredient.find().sort({ name: 1 });
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);

    const stock = ingredients.map((ingredient) => ({
      _id: ingredient._id,
      name: ingredient.name,
      price: ingredient.price,
      quantity: Number(save.inventory?.get(ingredient._id.toString()) || 0)
    }));

    const byRecipe = transactions
      .filter((tx) => tx.type === "ORDER_SERVED")
      .reduce((acc, tx) => {
        const key = tx.metadata?.recipeName || "Inconnu";
        if (!acc[key]) acc[key] = { revenue: 0, cost: 0, count: 0 };
        acc[key].revenue += tx.metadata?.salePrice || 0;
        acc[key].cost += tx.metadata?.ingredientCost || 0;
        acc[key].count += 1;
        return acc;
      }, {});

    const margins = Object.entries(byRecipe).map(([recipeName, data]) => ({
      recipeName,
      sold: data.count,
      netProfit: data.revenue - data.cost,
      marginPerDish: data.count ? (data.revenue - data.cost) / data.count : 0
    }));

    return res.json({
      treasury: save.treasury,
      satisfaction: save.satisfaction,
      stock,
      transactions,
      margins
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur financière" });
  }
});

router.post("/buy", authMiddleware, async (req, res) => {
  const { ingredientId, quantity } = req.body;

  if (!ingredientId || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: "Achat invalide" });
  }

  try {
    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) return res.status(404).json({ message: "Ingrédient introuvable" });

    const totalCost = ingredient.price * quantity;
    const inventoryPath = `inventory.${ingredient._id.toString()}`;

    await ensureSave(req.user.id, req.user.restaurantName);

    const save = await Save.findOneAndUpdate(
      { user: req.user.id, treasury: { $gte: totalCost } },
      { $inc: { treasury: -totalCost, [inventoryPath]: quantity } },
      { new: true }
    );

    if (!save) {
      return res.status(400).json({ message: "Trésorerie insuffisante" });
    }

    await Transaction.create({
      user: req.user.id,
      type: "BUY_INGREDIENT",
      category: "expense",
      amount: -totalCost,
      metadata: { ingredientId: ingredient._id, ingredientName: ingredient.name, quantity, unitPrice: ingredient.price }
    });

    return res.json({ treasury: save.treasury, ingredientId: ingredient._id, quantityAdded: quantity });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur achat" });
  }
});

router.get("/recipes", authMiddleware, async (req, res) => {
  const recipes = await Recipe.find().select("name salePrice").sort({ name: 1 });
  res.json(recipes);
});

module.exports = router;
