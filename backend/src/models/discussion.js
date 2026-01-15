const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  bookId: String, // google book id
  user: String, // username
  text: String,
  stars: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likers: [String], // Track usernames who liked
  dislikers: [String], // Track usernames who disliked
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion", default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }]
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);
