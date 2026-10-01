const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  autoSaveProject,
  duplicateProject,
  updateThumbnail,
  saveHtmlProject,
} = require("../controllers/projectController");

// ================= PROJECT ROUTES =================

// Create Project
router.post(
  "/",
  protect,
  createProject
);

// Get All Projects
router.get(
  "/",
  getProjects
);

// Get Project By ID
router.get(
  "/:id",
  getProjectById
);

// Update Project
router.put(
  "/:id",
  updateProject
);

// Delete Project
router.delete(
  "/:id",
  deleteProject
);

// Auto Save Project
router.put(
  "/:id/autosave",
  autoSaveProject
);

// Duplicate Project
router.post(
  "/:id/duplicate",
  duplicateProject
);

// Update Thumbnail
router.put(
  "/:id/thumbnail",
  updateThumbnail
);

// Save HTML Project
router.put(
  "/:id/save-html",
  saveHtmlProject
);

module.exports = router;