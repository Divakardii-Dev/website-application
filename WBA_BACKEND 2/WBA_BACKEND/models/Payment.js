const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },

  customerName: String,
  customerEmail: String,
  customerMobile: String,
  paymentMethod:String,
  wallet:String,
  upiId:String,
  bank:String,

  planName: String,
  amount: Number,
  cardLast4: String,
  cardNetwork: String,
  cardIssuer: String,
  cardType: String,
  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,

  paymentStatus: {
    type: String,
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

paymentSchema.index({ razorpay_payment_id: 1 });
paymentSchema.index({ userId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
