const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
    handleS3File,
    getS3Files,
    triggerFile,
    uploadFiles,
} = require("../controllers/fileController");

const {
    createTemplate,
} = require("../controllers/templateController");

// ================= S3 FILE ROUTES =================

// Save intercepted S3 URL
router.post("/trigger", handleS3File);

// Get all saved S3 files
router.get("/", getS3Files);

// Optional trigger API (if controller exists)
router.post("/trigger-file", triggerFile);

// ================= UPLOAD ROUTES =================

// Create template with single image upload
router.post(
    "/templates",
    upload.single("image"),
    createTemplate
);

// Upload multiple files/images
router.post(
    "/upload",
    upload.array("images", 5),
    uploadFiles
);

module.exports = router;