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
    .sort({ createdAt: 1 })
    .populate('replies')
    .populate('voters', 'username'); // Include voter information
  res.json(msgs);
});

router.post("/:id/vote", auth, async (req, res) => {
  const { delta } = req.body;
  const discussion = await Discussion.findById(req.params.id);

  if (!discussion) {
    return res.status(404).json({ error: "Discussion not found" });
  }

  const userId = req.user.id;
  const hasVoted = discussion.voters.includes(userId);

  if (hasVoted) {
    return res.status(400).json({ error: "You have already voted on this comment" });
  }

  // Add user to voters list and update vote count
  discussion.voters.push(userId);
  discussion.votes += delta;
  await discussion.save();

  res.json({ votes: discussion.votes });
});

module.exports = router;
