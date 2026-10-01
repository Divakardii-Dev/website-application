const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },
 
    password: {
      type: String,
      required: true,
    },

    // Country code/mobile validations
    mobileDigits: {
      type: String,
      default: "",
    },

    nationalNumber: {
      type: String,
      default: "",
    },

    // Store previous passwords
    passwordHistory: {
      type: [String],
      default: [],
    },

    // User plan
    plan: {
      type: String,
      default: "Free",
    },

    // Temporary alternate email/mobile
    pendingAlternate: {
      type: String,
      default: null,
    },

    // Alternate emails/mobiles
    alternates: {
      type: [String],
      default: [],
    },

    // OTP fields
    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Number,
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);