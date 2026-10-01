const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
     workspaceId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Project",
     required: true,
     index: true,
     },

    // SEO Fields
    seoTitle: String,

    seoDescription: String,

    seoKeywords: [String],

    // Open Graph Fields
    ogTitle: String,

    ogDescription: String,

    ogImage: String,

    ogType: {
      type: String,
      default: "article",
    },

    twitterCard: {
      type: String,
      default: "summary_large_image",
    },

    canonicalUrl: String,

    // Featured Image
    featuredImage: String,

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

   // Indexes for faster search

   blogSchema.index({
  workspaceId: 1,
  slug: 1,
}, {
  unique: true,
});

blogSchema.index({
  status: 1,
});

blogSchema.index({
  createdAt: -1,
});

blogSchema.index({
  title: "text",
});

module.exports = mongoose.model("Blog", blogSchema);