const express = require("express");
const axios = require("axios");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

// 🔍 Search books (Google Books API) - PUBLIC
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query missing" });

    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q,
          key: process.env.GOOGLE_BOOKS_API_KEY,
        },
      }
    );

    res.json(response.data.items || []);
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ error: "Google Books API failed" });
  }
});

// ➕ Add book to user's library - PROTECTED
router.post("/", auth, async (req, res) => {
  // Lazy load the model here to prevent circular dependency issues
  const Book = require("../models/book"); 
  
  try {
    const bookData = req.body;

    // Generate dynamic buy links
    const amazonLink = `https://www.amazon.in/s?k=${encodeURIComponent(bookData.title)}`;
    const flipkartLink = `https://www.flipkart.com/search?q=${encodeURIComponent(bookData.title)}`;

    const newBook = new Book({
      title: bookData.title,
      authors: bookData.authors,
      googleBookId: bookData.googleBookId,
      thumbnail: bookData.thumbnail,
      description: bookData.description,
      user: req.user.id, // Extracted from the JWT token by 'auth' middleware
      buyLinks: {
        google: bookData.googleLink,
        amazon: amazonLink,
        flipkart: flipkartLink,
      },
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error("Save Book Error:", err.message);
    res.status(500).json({ error: "Failed to save book" });
  }
});

// 📚 Get all saved books for the logged-in user - PROTECTED
router.get("/", auth, async (req, res) => {
  const Book = require("../models/book");

  try {
    // Only find books where the 'user' field matches the ID in the token
    const books = await Book.find({ user: req.user.id });
    res.json(books);
  } catch (err) {
    console.error("Fetch Books Error:", err.message);
    res.status(500).json({ error: "Could not retrieve library" });
  }
});
// 🗑️ Delete a book from library - PROTECTED
router.delete("/:id", auth, async (req, res) => {
  const Book = require("../models/book");

  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // SAFE CHECK: 
    // If the book has no user (old test data), OR if the user matches
    if (!book.user || book.user.toString() !== req.user.id) {
       // If there is a user but it's not mine, block it
       if (book.user && book.user.toString() !== req.user.id) {
          return res.status(403).json({ error: "Unauthorized" });
       }
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book removed successfully" });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;