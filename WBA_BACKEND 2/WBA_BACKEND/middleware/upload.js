const multer = require("multer");
 
const storage = multer.memoryStorage();
 
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
 
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
 
    cb(null, true);
  },
});
 
module.exports = upload;
 