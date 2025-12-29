const express = require("express");
const axios = require("axios");
const Book = require("../models/book");

const router = express.Router();

// Search books
router.get("/search", async (req, res) => {
  const { q } = req.query;

  const response = await axios.get(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
  );

  res.json(response.data.items);
});

// Add book to library
router.post("/", async (req, res) => {
  const book = req.body;

  const amazonLink = `https://www.amazon.in/s?k=${encodeURIComponent(book.title)}`;
  const flipkartLink = `https://www.flipkart.com/search?q=${encodeURIComponent(book.title)}`;

  const newBook = new Book({
    title: book.title,
    authors: book.authors,
    googleBookId: book.googleBookId,
    thumbnail: book.thumbnail,
    description: book.description,
    buyLinks: {
      google: book.googleLink,
      amazon: amazonLink,
      flipkart: flipkartLink
    }
  });

  await newBook.save();
  res.json(newBook);
});

router.get("/", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

module.exports = router;
