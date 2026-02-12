const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", async (req, res) => {
    const { restaurantName, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "Email already used." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({
            restaurantName,
            email,
            password: hashedPassword
        });

        return res.status(201).json({ message: "Account created successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user._id, restaurantName: user.restaurantName },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: "Server error." });
    }
});

router.get("/play", authMiddleware, (req, res) => {
    return res.json({
        message: `Welcome ${req.user.restaurantName}, you can play now.`
    });
});

module.exports = router;
