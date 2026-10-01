const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const uploadImageToS3 = async (file) => {

    const fileName = `templates/${Date.now()}.webp`;

    const webpBuffer = await sharp(file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: webpBuffer,
        ContentType: "image/webp",
    };

    await s3.send(new PutObjectCommand(params));

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return imageUrl;
};

module.exports = {
    uploadImageToS3,
};