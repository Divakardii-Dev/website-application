const S3File = require("../models/S3File");

exports.handleS3File = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            s3Url,
        } = req.body;

        if (!name || !category || !s3Url) {
            return res.status(400).json({
                success: false,
                message: "Name, category and s3Url are required",
            });
        }

        console.log("Received Data:", req.body);

        const savedTemplate = await S3File.create({
            name,
            category,
            image: s3Url,
            description,
        });

        console.log("Saved:", savedTemplate);

        res.status(201).json({
            success: true,
            message: "Template saved successfully",
            data: savedTemplate,
        });
    } catch (error) {
        console.error("Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// GET - Fetch all saved S3 URLs
exports.getS3Files = async (req, res) => {
    try {
        const files = await S3File.find().sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: files.length,
            data: files,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.triggerFile = async (req, res) => {
    try {
        const { s3Url } = req.body;

        console.log("Received S3 URL:", s3Url);

        res.status(200).json({
            success: true,
            url: s3Url
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.uploadFiles = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            files: req.files,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};