require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

console.log("DEBUG ENV MONGODB_URI:", MONGODB_URI);
console.log("DEBUG ALL KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));

async function start() {
  try {
    if (!MONGODB_URI) {
      console.error("MongoDB connection failed: MONGODB_URI is not defined");
      process.exit(1);
    }
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

start();
