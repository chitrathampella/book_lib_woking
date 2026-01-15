const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  googleBookId: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true }, // Store username for quick display
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});



module.exports = mongoose.model("Review", reviewSchema);