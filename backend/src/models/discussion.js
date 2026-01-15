const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  bookId: String, // google book id
  user: String, // username
  text: String,
  stars: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track who voted
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion", default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }]
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);
