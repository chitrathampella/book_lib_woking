const path = require("path");
const fs = require("fs");
// This specifically looks in C:\Users\sailesh\book_lib\backend\.env
//require("dotenv").config({ path:"C:/Users/sailesh/book_lib/backend/.env" });
//console.log("MONGO_URI test:", process.env.MONGO_URI ? "Found ✅" : "NOT FOUND ❌");
// --- ENV LOADING LOGIC ---
const possiblePaths = [
  path.join(__dirname, "..", ".env"), // backend/.env
  path.join(process.cwd(), ".env"),   // current working directory
  path.join(__dirname, ".env")        // backend/src/.env
];

let envFound = false;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    require("dotenv").config({ path: p });
    console.log("✅ .env found at:", p);
    envFound = true;
    break;
  }
}

if (!envFound) console.log("❌ .env NOT FOUND in any common location");
console.log("MONGO_URI value:", process.env.MONGO_URI ? "Value exists" : "STILL UNDEFINED");
// -------------------------
const express = require("express");
const cors = require("cors");
const connectDB = require("./db"); // ONLY import it here
const authRoutes = require("./routes/auth.routes");
const passport = require("passport");

const app = express();

// Start connection
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Initialize Passport
app.use(passport.initialize());

// Auth routes (includes Google OAuth)
app.use("/auth", authRoutes);

// ✅ ROUTES
app.use("/books", require("./routes/books.routes"));
app.use("/auth", require("./routes/auth.routes"));
app.use("/reviews", require("./routes/review.routes"));
app.use("/discussions", require("./routes/discussion.routes"));

app.get("/", (req, res) => {
  res.send("Book Library API is running");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});