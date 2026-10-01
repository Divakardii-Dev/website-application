const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },

    amount: {
      type: Number,
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Cancelled", "Expired"],
      default: "Active",
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Subscription",
  subscriptionSchema
);