const multer = require("multer");
const {
  profileStorage,
  videoStorage,
  multipleImageStorage,
  multipleMediaStorage,
} = require("../utils/utilityFunctions.js");

exports.uploadProfilePic = multer({ storage: profileStorage });
exports.uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Optional: limit the file size to 10 MB
});
exports.uploadMultiplePhotos = multer({ storage: multipleImageStorage });
exports.uploadMultipleMedias = multer({
  storage: multipleMediaStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Optional: limit the file size to 10 MB
});
