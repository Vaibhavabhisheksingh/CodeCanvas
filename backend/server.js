const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

const architectureRoutes = require("./routes/architectureRoutes");

const versionRoutes = require("./routes/versionRoutes");

const authRoutes = require("./routes/authRoutes");


app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));


app.use("/api/auth", authRoutes);
app.use("/api/architectures", architectureRoutes);
app.use("/api/versions", versionRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "CodeCanvas API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`CodeCanvas API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start CodeCanvas:", error.message);
    process.exit(1);
  }
}

startServer();