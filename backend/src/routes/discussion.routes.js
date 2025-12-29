const express = require("express");
const Discussion = require("../models/discussion");

const router = express.Router();

router.post("/", async (req, res) => {
  const msg = new Discussion(req.body);
  await msg.save();
  res.json(msg);
});

router.get("/:bookId", async (req, res) => {
  const msgs = await Discussion.find({ bookId: req.params.bookId })
    .sort({ createdAt: 1 });
  res.json(msgs);
});

module.exports = router;
