const express = require("express");
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocumentStatus,
  signDocument,
  shareDocument,
  deleteDocument,
} = require("../controllers/documentController");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// All routes are protected
router.use(protect);

// Upload document (single file)
router.post("/upload", upload.single("file"), uploadDocument);

// Get all documents
router.get("/", getDocuments);

// Get single document
router.get("/:id", getDocumentById);

// Update document status
router.put("/:id/status", updateDocumentStatus);

// Sign document
router.post("/:id/sign", signDocument);

// Share document
router.post("/:id/share", shareDocument);

// Delete document
router.delete("/:id", deleteDocument);

module.exports = router;