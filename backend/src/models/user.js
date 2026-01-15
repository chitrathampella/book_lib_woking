const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String, sparse: true }, // For Google OAuth
  favorites: [{ type: String }], // array of googleBookIds
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readingList: [{
    bookId: { type: String, required: true },
    status: { type: String, enum: ['want', 'reading', 'read'], default: 'want' },
    progress: { type: Number, default: 0 }, // percentage
    startDate: Date,
    finishDate: Date
  }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);