const Subscription = require("../models/Subscription");
const Order = require("../models/Order");

const getTemplateAccess = async (userId, templateId = null) => {
  try {
    // ==========================================
    // GET ACTIVE SUBSCRIPTION
    // ==========================================
    const subscription = await Subscription.findOne({
      userId,
      status: "Active",
      expiryDate: { $gt: new Date() },
    }).sort({ expiryDate: -1 });

    const normalizedPlan = (subscription?.planName || "Free")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const hasAllAccess =
      normalizedPlan === "advanced" ||
      normalizedPlan === "advancedplan" ||
      normalizedPlan === "business" ||
      normalizedPlan === "businessplan";

    // ==========================================
    // GET PAID TEMPLATE ORDERS
    // ==========================================
    const paidOrders = await Order.find({
      user: userId,
      paymentStatus: "Paid",
      $or: [
        { itemType: "template" },
        { "template.templateId": { $exists: true } },
      ],
    })
      .select("template")
      .lean();

    const purchasedTemplates = [
      ...new Set(
        paidOrders
          .map((order) => {
            const purchasedTemplateId =
              order.template?.templateId;

            return purchasedTemplateId
              ? purchasedTemplateId.toString()
              : null;
          })
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // CHECK SINGLE TEMPLATE
    // ==========================================
    const isPurchased = templateId
      ? purchasedTemplates.includes(templateId.toString())
      : false;

    // ==========================================
    // FINAL ACCESS
    // ==========================================
    return {
      planName: subscription?.planName || "Free",
      hasAllAccess,
      purchasedTemplates,
      isPurchased,
      canEdit: hasAllAccess || isPurchased,
      canBuy: !hasAllAccess && !isPurchased,
    };
  } catch (error) {
    console.error("Template Access Service Error:", error);
    throw error;
  }
};

module.exports = {
  getTemplateAccess,
};