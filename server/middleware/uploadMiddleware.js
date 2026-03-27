const multer = require("multer");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Only JPEG, PNG, WEBP, and GIF images are allowed");
    error.statusCode = 400;
    return cb(error);
  }

  return cb(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

module.exports = {
  uploadImage
};
