const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);
