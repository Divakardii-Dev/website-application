const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  createBlog,
  getBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  publishBlog,
} = require("../controllers/blogController");

// Create Blog
router.post("/post", upload.single("featuredImage"), createBlog);

// Get all blogs by workspace
router.get("/posts/:workspaceId", getBlogs);

// Public blog listing
router.get("/public/:workspaceId", getBlogs);

// Get blog by workspace + slug
router.get("/posts/:workspaceId/slug/:slug", getBlogBySlug);

// Public blog by workspace + slug
router.get("/public/:workspaceId/:slug", getBlogBySlug);

// Update Blog
router.put("/post/:id", upload.single("featuredImage"), updateBlog);

// Publish Blog
router.patch("/post/:id/publish", publishBlog);

// Delete Blog
router.delete("/post/:id", deleteBlog);

module.exports = router;