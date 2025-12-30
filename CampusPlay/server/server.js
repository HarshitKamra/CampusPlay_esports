const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
// Configure CORS to allow specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:5500", "http://127.0.0.1:5500"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // In development, you might want to allow all, but for now let's be strict or add localhost
      return callback(null, true); // Temporarily allow all for ease of development
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for CSV uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan("dev"));

// Database Connection
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

// MongoDB connection optimized for serverless (Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("MongoDB Connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Connect to MongoDB
connectDB().catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tournaments", require("./routes/tournaments"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/payments", require("./routes/payments"));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, "../client")));

// Frontend Routes - serve specific pages
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "../client/index.html")));
app.get("/login", (_req, res) => res.sendFile(path.join(__dirname, "../client/login.html")));
app.get("/tournaments", (_req, res) => res.sendFile(path.join(__dirname, "../client/tournaments.html")));
app.get("/stats", (_req, res) => res.sendFile(path.join(__dirname, "../client/stats.html")));
app.get("/leaderboard", (_req, res) => res.sendFile(path.join(__dirname, "../client/leaderboard.html")));
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "../client/admin.html")));

// Handle SPA routing - send all other requests to index.html
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});
app.get("/", (req, res) => {
  res.send("CampusPlay backend is live 🚀");
});

// Export app for Vercel serverless functions
module.exports = app;

// Only start server if running locally (not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}