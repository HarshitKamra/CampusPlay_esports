const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { OAuth2Client } = require("google-auth-library");

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ error: "Email already registered" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("Register Error:", e);
    if (e.code === 11000) {
      return res.status(400).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "All fields required" });

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("Login Error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    console.error("Me Error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      updates.name = name.trim();
    }

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.userId.toString()) {
        return res.status(400).json({ error: "Email already in use" });
      }
      updates.email = email.toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    console.error("Update Profile Error:", e);
    if (e.code === 11000) {
      return res.status(400).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments({});
    res.json({ count });
  } catch (e) {
    console.error("Get User Count Error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Create admin user
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase(), 
      password: hashed,
      role: "admin"
    });

    res.json({
      message: "Admin account created successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error("Create Admin Error:", e);
    if (e.code === 11000) {
      return res.status(400).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.googleSignIn = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Initialize Google OAuth2 Client
    const client = new OAuth2Client();
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    // Verify email is from thapar.edu
    if (!email.endsWith("@thapar.edu")) {
      return res.status(400).json({ error: "Only thapar.edu accounts are allowed" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user with Google data
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: await bcrypt.hash(Math.random().toString(), 10),
        role: "user"
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Google Sign-In Error:", err);
    res.status(400).json({ error: "Invalid token or verification failed" });
  }
};