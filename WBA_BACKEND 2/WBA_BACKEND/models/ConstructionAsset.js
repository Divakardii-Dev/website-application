const mongoose = require("mongoose");

const constructionAssetSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "ConstructionAsset",
    constructionAssetSchema
);