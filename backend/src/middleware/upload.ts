import multer from "multer";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const doctorImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    callback(null, allowedTypes.has(file.mimetype));
  },
});
