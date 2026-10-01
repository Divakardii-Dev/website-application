const express = require("express");

const router = express.Router();

const {
  getMySubscription,
  getMySubscriptionHistory,
  cancelSubscription,
} = require("../controllers/subscriptionController");

const { protect } = require("../middleware/authMiddleware");

// Get current active subscription
router.get(
  "/my-subscription",
  protect,
  getMySubscription
);

// Get subscription history
router.get(
  "/history",
  protect,
  getMySubscriptionHistory
);

// Cancel current subscription
router.patch(
  "/cancel",
  protect,
  cancelSubscription
);

module.exports = router;