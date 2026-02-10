const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * INSCRIPTION
 */
router.post("/register", async (req, res) => {
    const { restaurantName, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email déjà utilisé" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            restaurantName,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: "Compte créé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Identifiants invalides" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Identifiants invalides" });
        }

        const token = jwt.sign(
            { id: user._id, restaurantName: user.restaurantName },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

/**
 * ROUTE PROTÉGÉE (ex: jouer)
 */
router.get("/play", authMiddleware, (req, res) => {
    res.json({
        message: `Bienvenue ${req.user.restaurantName}, tu peux jouer !!! 🎮`
    });
});

module.exports = router;