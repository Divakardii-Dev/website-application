const { PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const s3 = require("../config/s3");

const uploadToS3 = async (fileBuffer, fileName) => {
    const webpBuffer = await sharp(fileBuffer)
        .webp({ quality: 80 })
        .toBuffer();

    const key = `templates/${Date.now()}-${fileName
        .split(".")[0]}.webp`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: webpBuffer,
            ContentType: "image/webp",
        })
    );

    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = uploadToS3;