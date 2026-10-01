const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    images: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      default: "",
    },

    inventory: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },

    salePrice: {
      type: Number,
      default: null,
    },

    sku: {
      type: String,
      default: "",
    },

    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);