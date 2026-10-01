const express = require("express");
const router = express.Router();


const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getInvoices,
  createInvoice,
  getMySubscription,
} = require("../controllers/paymentController");  //added as per Frontend requirement 

const { protect } = require("../middleware/authMiddleware");

// Create Razorpay Order
router.post("/create-order", createOrder);

// Verify Razorpay Payment
router.post(
  "/verify-payment",
  protect,
  verifyPayment
);

router.post(
  "/verify",
  protect,
  verifyPayment
);
router.get(
  "/invoices",
  protect,
  getInvoices
);

router.get(
  "/subscription",
  protect,
  getMySubscription
);

router.post(
  "/invoices",
  protect,
  createInvoice
);
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Payment Route Working",
  });
});

module.exports = router;