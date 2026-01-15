const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const auth = require("../middleware/auth.middleware");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            return done(null, user);
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }
        
        // Create new user
        user = new User({
            username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
            email: profile.emails[0].value,
            googleId: profile.id,
            password: 'google_oauth' // Dummy password for Google users
        });
        
        await user.save();
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
        try {
            const token = jwt.sign(
                { id: req.user._id, username: req.user.username }, 
                process.env.JWT_SECRET || "fallout_secret_for_now", 
                { expiresIn: "1d" }
            );
            
            // Redirect to frontend with token
            res.redirect(`http://localhost:3000?token=${token}&user=${encodeURIComponent(JSON.stringify({
                username: req.user.username,
                email: req.user.email
            }))}`);
        } catch (err) {
            res.redirect("http://localhost:3000?error=auth_failed");
        }
    }
);

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

        res.json({ 
            token, 
            user: { 
                _id: user._id.toString(),
                username: user.username, 
                email: user.email,
                favorites: user.favorites || [],
                reading: user.reading || []
            } 
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// 👤 GET current user profile & their books - PROTECTED
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      username: user.username,
      email: user.email,
      favoritesCount: user.favorites.length
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch profile" });
  }
});

// ⭐ Add to favorites
router.post("/favorites", auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(bookId)) {
      user.favorites.push(bookId);
      await user.save();
    }
    res.json({ message: "Added to favorites" });
  } catch (err) {
    res.status(500).json({ error: "Could not add to favorites" });
  }
});

// ⭐ Remove from favorites
router.delete("/favorites/:bookId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(id => id !== req.params.bookId);
    await user.save();
    res.json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ error: "Could not remove from favorites" });
  }
});

// ⭐ Get favorites
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch favorites" });
  }
});

// 👥 Follow a user
router.post("/follow/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    if (!user.following.includes(req.params.userId)) {
      user.following.push(req.params.userId);
      await user.save();
    }
    res.json({ message: "Followed" });
  } catch (err) {
    res.status(500).json({ error: "Could not follow" });
  }
});

// 👥 Unfollow a user
router.delete("/follow/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.following = user.following.filter(id => id.toString() !== req.params.userId);
    await user.save();
    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json({ error: "Could not unfollow" });
  }
});

// 👥 Get following
router.get("/following", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('following', 'username');
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch following" });
  }
});

// 📚 Add/Update reading list
router.post("/reading", auth, async (req, res) => {
  try {
    const { bookId, status, progress } = req.body;
    const user = await User.findById(req.user.id);
    let item = user.readingList.find(r => r.bookId === bookId);
    if (item) {
      item.status = status || item.status;
      item.progress = progress !== undefined ? progress : item.progress;
      if (status === 'reading' && !item.startDate) item.startDate = new Date();
      if (status === 'read' && !item.finishDate) item.finishDate = new Date();
    } else {
      item = { bookId, status: status || 'want', progress: progress || 0 };
      if (status === 'reading') item.startDate = new Date();
      if (status === 'read') item.finishDate = new Date();
      user.readingList.push(item);
    }
    await user.save();
    res.json({ message: "Updated reading list" });
  } catch (err) {
    res.status(500).json({ error: "Could not update reading list" });
  }
});

// 📚 Get reading list
router.get("/reading", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.readingList);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch reading list" });
  }
});

module.exports = router;