const express = require("express");
const Discussion = require("../models/discussion");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", async (req, res) => {
  const { bookId, user, text, stars, parentId } = req.body;
  const msg = new Discussion({ bookId, user, text, stars, parentId });
  if (parentId) {
    const parent = await Discussion.findById(parentId);
    if (parent) {
      parent.replies.push(msg._id);
      await parent.save();
    }
  }
  await msg.save();
  res.json(msg);
});

router.get("/:bookId", async (req, res) => {
  const msgs = await Discussion.find({ bookId: req.params.bookId })
    .sort({ createdAt: -1 })
    .populate('replies')
    .lean();
  res.json(msgs);
});

// Like a comment
router.post("/:id/like", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ error: "Comment not found" });

  // Check if already liked
  if (discussion.likers.includes(username)) {
    // Remove like
    discussion.likers = discussion.likers.filter(u => u !== username);
    discussion.likes = Math.max(0, discussion.likes - 1);
  } else {
    // Add like and remove dislike if exists
    discussion.likers.push(username);
    discussion.likes += 1;
    if (discussion.dislikers.includes(username)) {
      discussion.dislikers = discussion.dislikers.filter(u => u !== username);
      discussion.dislikes = Math.max(0, discussion.dislikes - 1);
    }
  }

  await discussion.save();
  res.json({ likes: discussion.likes, dislikes: discussion.dislikes });
});

// Dislike a comment
router.post("/:id/dislike", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ error: "Comment not found" });

  // Check if already disliked
  if (discussion.dislikers.includes(username)) {
    // Remove dislike
    discussion.dislikers = discussion.dislikers.filter(u => u !== username);
    discussion.dislikes = Math.max(0, discussion.dislikes - 1);
  } else {
    // Add dislike and remove like if exists
    discussion.dislikers.push(username);
    discussion.dislikes += 1;
    if (discussion.likers.includes(username)) {
      discussion.likers = discussion.likers.filter(u => u !== username);
      discussion.likes = Math.max(0, discussion.likes - 1);
    }
  }

  await discussion.save();
  res.json({ likes: discussion.likes, dislikes: discussion.dislikes });
});

module.exports = router;
