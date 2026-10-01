const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createEcommerceCheckoutOrder,
  verifyEcommerceCheckoutPayment,
} = require("../controllers/checkoutController");

// VERIFY PAYMENT
router.post(
  "/verify-payment",
  protect,
  verifyEcommerceCheckoutPayment
);

// CREATE ORDER
router.post(
  "/create-order",
  protect,
  createEcommerceCheckoutOrder
);

module.exports = router;