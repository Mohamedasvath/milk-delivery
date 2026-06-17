import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // Owner Reference
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Business Information
    businessName: {
      type: String,
      trim: true,
      default: "",
    },
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },

    // Logo
    logo: {
      type: String,
      default: "",
    },

    // Milk Rates
    defaultMilkRate: {
      type: Number,
      min: 0,
      default: 50,
    },
    morningMilkRate: {
      type: Number,
      min: 0,
      default: 50,
    },
    eveningMilkRate: {
      type: Number,
      min: 0,
      default: 55,
    },

    // Language Settings
    language: {
      type: String,
      enum: ["english", "tamil"],
      default: "english",
    },

    // Billing Cycle
    billingCycle: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "monthly",
    },

    // Report View Preference
    reportDefaultView: {
      type: String,
      enum: ["daily", "monthly", "yearly"],
      default: "monthly",
    },
  },
  {
    timestamps: true,
  }
);

// Create index on ownerId for faster queries
settingsSchema.index({ ownerId: 1 });

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;