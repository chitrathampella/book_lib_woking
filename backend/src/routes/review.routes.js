const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const Review = require("../models/review");

// 📢 GET reviews & Average Rating - PUBLIC
router.get("/:googleBookId", async (req, res) => {
  try {
    const reviews = await Review.find({ googleBookId: req.params.googleBookId })
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    // This is the specific part that sends the average to Postman
    res.json({
      googleBookId: req.params.googleBookId,
      averageRating: Number(averageRating), 
      totalReviews,
      reviews 
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
// ✍️ POST a new review/rating - PROTECTED
router.post("/", auth, async (req, res) => {
  try {
    console.log("User from Token:", req.user); // Check if username is here
    console.log("Data from Postman:", req.body);
    const { googleBookId, rating, comment } = req.body;

    // Optional: Check if user already reviewed this book
    const existingReview = await Review.findOne({ 
      googleBookId, 
      user: req.user.id 
    });

    if (existingReview) {
      return res.status(400).json({ error: "You already reviewed this book" });
    }

    const newReview = new Review({
      googleBookId: req.body.googleBookId,
      user: req.user.id,
      username: req.user.username || "Anonymous", // Ensure your JWT payload has username
      rating: req.body.rating,
      comment: req.body.comment,
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    console.error("POST REVIEW ERROR:", err.message); // This tells us the REAL problem
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;