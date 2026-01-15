const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  authors: [String],
  googleBookId: String,
  thumbnail: String,
  description: String,
  buyLinks: {
    google: String,
    amazon: String,
    flipkart: String,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
