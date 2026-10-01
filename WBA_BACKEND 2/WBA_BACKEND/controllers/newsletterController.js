const Newsletter = require("../models/Newsletter");

// Subscribe to Newsletter
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { fullName, email, billingAddress } = req.body;

    // Required field validation
    if (!fullName || !email || !billingAddress) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and billing address are required",
      });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = billingAddress.trim();

    // Check if email is already subscribed
    const existingSubscriber = await Newsletter.findOne({
      email: cleanEmail,
    });

    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: "Already subscribed",
      });
    }

    // Create newsletter subscriber
    const subscriber = await Newsletter.create({
      fullName: cleanName,
      email: cleanEmail,
      billingAddress: cleanAddress,
    });

    return res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      subscriber: {
        _id: subscriber._id,
        fullName: subscriber.fullName,
        email: subscriber.email,
        billingAddress: subscriber.billingAddress,
        createdAt: subscriber.createdAt,
      },
    });
  } catch (error) {
    console.error("NEWSLETTER SUBSCRIBE ERROR:", error);

    // Handle MongoDB duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Already subscribed",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while subscribing",
    });
  }
};
