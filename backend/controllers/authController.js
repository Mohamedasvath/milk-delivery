import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Owner from "../models/Owner.js";

// =====================
// CREATE OWNER
// =====================
export const createOwner = async (req, res) => {
  try {
    const { name, phone, pin } = req.body;

    const existingOwner = await Owner.findOne({ phone });

    if (existingOwner) {
      return res.status(400).json({
        message: "Phone already exists",
      });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const owner = await Owner.create({
      name,
      phone,
      pin: hashedPin,
    });

    res.status(201).json({
      message: "Owner created successfully",
      owner,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// LOGIN OWNER (FIXED 🔥)
// =====================
export const loginOwner = async (req, res) => {
  try {
    console.log("🔥 LOGIN BODY:", req.body);

    const { phone, pin } = req.body;

    const owner = await Owner.findOne({ phone });

    console.log("🔥 OWNER FROM DB:", owner);

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const isMatch = await bcrypt.compare(pin, owner.pin);

    console.log("🔥 PIN ENTERED:", pin);
    console.log("🔥 PIN MATCH RESULT:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid PIN",
      });
    }

    const token = jwt.sign(
      { id: owner._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      owner: {
        ownerId: owner._id,
        name: owner.name,
        phone: owner.phone,
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
// =====================
// VERIFY OWNER (optional use)
// =====================
export const verifyOwner = async (req, res) => {
  try {
    const { phone, pin } = req.body;

    const owner = await Owner.findOne({ phone });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const isMatch = await bcrypt.compare(pin, owner.pin);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid PIN",
      });
    }

    res.status(200).json({
      ownerId: owner._id,
      name: owner.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// RESET PIN
// =====================
export const resetPin = async (req, res) => {
  try {
    const { phone, newPin } = req.body;

    const owner = await Owner.findOne({ phone });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    owner.pin = hashedPin;
    await owner.save();

    res.status(200).json({
      message: "PIN updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};