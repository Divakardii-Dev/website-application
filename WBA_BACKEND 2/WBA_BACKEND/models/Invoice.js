const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Razorpay payment ID
    paymentId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    gst: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    planName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Paid",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ paymentId: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);