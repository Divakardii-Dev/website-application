const Subscription = require("../models/Subscription");
const User = require("../models/User");

// ==========================================
// GET CURRENT USER SUBSCRIPTION
// ==========================================

exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({
      userId,
      status: "Active",
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        subscribed: false,
        subscription: null,
      });
    }

    // Check expiry
if (
  subscription.expiryDate &&
  new Date(subscription.expiryDate) < new Date()
) {
  subscription.status = "Expired";

  await subscription.save();

  // Reset user plan after subscription expiry
  await User.findByIdAndUpdate(userId, {
    plan: "Free",
  });

  return res.status(200).json({
    success: true,
    subscribed: false,
    subscription: null,
  });
}

    return res.status(200).json({
      success: true,
      subscribed: true,
      subscription,
    });
  } catch (error) {
    console.error(
      "Get subscription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};


// ==========================================
// GET ALL USER SUBSCRIPTIONS
// ==========================================

exports.getMySubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscriptions = await Subscription.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error(
      "Get subscription history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription history",
      error: error.message,
    });
  }
};


// ==========================================
// CANCEL CURRENT SUBSCRIPTION
// ==========================================

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription =
      await Subscription.findOne({
        userId,
        status: "Active",
      }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    subscription.status = "Cancelled";

    await subscription.save();

    // Update user plan
    await User.findByIdAndUpdate(userId, {
      plan: "Free",
    });

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error) {
    console.error(
      "Cancel subscription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};