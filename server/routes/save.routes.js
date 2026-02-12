const express = require("express");

const Save = require("../models/Save");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const save = await Save.findOne({ user: req.user.id }).populate({
            path: "learnedRecipes",
            select: "name salePrice ingredients"
        });

        if (!save) {
            return res.json({
                learnedRecipes: [],
                treasury: 100,
                inventory: {},
                satisfaction: 20
            });
        }

        return res.json(save);
    } catch (error) {
        return res.status(500).json({ message: "Failed to load save." });
    }
});

module.exports = router;
