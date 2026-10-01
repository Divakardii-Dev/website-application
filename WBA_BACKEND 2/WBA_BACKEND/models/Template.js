const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    // Template name/title
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional alias for compatibility
    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    // For S3 image URL
    thumbnail: {
      type: String,
      default: "",
    },

    // Optional alias for compatibility
    imageUrl: {
      type: String,
      default: "",
    },

    previewPath: {
      type: String,
      default: "",
    },

    // Drag-and-drop builder data
    templateData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Template",
  templateSchema
);