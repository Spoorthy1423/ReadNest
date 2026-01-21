import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedUsername = username?.trim();

    const missing = [];
    if (!normalizedUsername) missing.push("username");
    if (!normalizedEmail) missing.push("email");
    if (!password) missing.push("password");
    if (missing.length) {
      console.log("[register] missing fields:", missing.join(","));
      return res
        .status(400)
        .json({ message: `Missing: ${missing.join(", ")}. Please fill all fields.` });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters long" });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ message: "Username should be at least 3 characters long" });
    }

    // check if user already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // get random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`;

    const user = new User({
      email: normalizedEmail,
      username: normalizedUsername,
      password,
      profileImage,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in register route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const missing = [];
    if (!normalizedEmail) missing.push("email");
    if (!password) missing.push("password");
    if (missing.length) {
      console.log("[login] missing fields:", missing.join(","));
      return res
        .status(400)
        .json({ message: `Missing: ${missing.join(", ")}. Please fill all fields.` });
    }

    // check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("[login] invalid credentials - user not found", normalizedEmail);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      console.log("[login] invalid credentials - bad password", normalizedEmail);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
