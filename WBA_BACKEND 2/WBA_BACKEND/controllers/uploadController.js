const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const ConstructionAsset = require("../models/ConstructionAsset");
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }
    // Convert image to WebP
    const webpBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      __dirname,
      "../uploads/profile"
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {
        recursive: true,
      });
    }

    // Generate unique file name
    const fileName = `profile-${Date.now()}.webp`;

    // Save image locally
    const filePath = path.join(
      uploadDir,
      fileName
    );
    await fs.promises.writeFile(
      filePath,
      webpBuffer
    );
 
    // Generate backend image URL
    const imageUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/profile/${fileName}`;
    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error(
      "PROFILE IMAGE UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 