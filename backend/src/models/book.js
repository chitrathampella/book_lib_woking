const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: String,
  authors: [String],
  googleBookId: { type: String, unique: true },
  thumbnail: String,
  description: String,

  buyLinks: {
    google: String,
    amazon: String,
    flipkart: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
