const express = require("express");
const router = express.Router();
const Save = require("../models/Save");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const save = await Save.findOne({ user: req.user.id }).populate({
      path: "learnedRecipes",
      select: "name salePrice ingredients"
    });

    if (!save) {
      return res.json({ learnedRecipes: [], treasury: 100, inventory: {}, satisfaction: 20 });
    }

    return res.json(save);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
