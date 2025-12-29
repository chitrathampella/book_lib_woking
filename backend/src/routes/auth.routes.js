const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user"); // Simple, clean import

// 📝 REGISTER
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        // We pass the plain password; the Schema's .pre("save") hashes it for us!
        const newUser = new User({ 
            username, 
            email: email.toLowerCase(), 
            password 
        });
        
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 🔑 LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user and force lowercase email check
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare plain password with hashed password from DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username }, 
            process.env.JWT_SECRET || "fallout_secret_for_now", 
            { expiresIn: "1d" }
        );

        res.json({ token, user: { username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;