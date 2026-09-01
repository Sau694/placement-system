require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "placement-system-secret";
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads", { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const ROLES = {
  STUDENT: "STUDENT",
  COMPANY: "COMPANY",
  TPO: "TPO",
};

async function start() {
  try {
    if (!MONGODB_URI) {
      console.error("MONGODB_URI is not defined in environment variables!");
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

module.exports = { app };
