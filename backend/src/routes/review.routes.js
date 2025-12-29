const express = require("express");
const Review = require("../models/review");

const router = express.Router();

router.post("/", async (req, res) => {
  const review = new Review(req.body);
  await review.save();
  res.json(review);
});

router.get("/:bookId", async (req, res) => {
  const reviews = await Review.find({ bookId: req.params.bookId });
  res.json(reviews);
});

module.exports = router;
