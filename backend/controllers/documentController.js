const Document = require("../models/Document");
const User = require("../models/User");

// @desc    Upload a document
exports.uploadDocument = async (req, res) => {
  try {
    console.log("📤 Uploading document...");
    console.log("File:", req.file);
    console.log("Body:", req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { title, description, tags, sharedWith } = req.body;

    const document = await Document.create({
      title: title || req.file.originalname,
      description: description || "",
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: req.file.path,
      publicId: req.file.filename,
      uploadedBy: req.user.id,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      status: "draft",
      sharedWith: sharedWith ? JSON.parse(sharedWith) : [],
    });

    await document.populate("uploadedBy", "name email");

    console.log("✅ Document uploaded successfully");

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Upload Document Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all documents
exports.getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    let filter = {
      $or: [{ uploadedBy: userId }, { "sharedWith.userId": userId }],
    };

    if (status) filter.status = status;
    if (type) filter.fileType = { $regex: type, $options: "i" };

    const documents = await Document.find(filter)
      .populate("uploadedBy", "name email")
      .populate("sharedWith.userId", "name email")
      .populate("signature.signedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get Documents Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single document
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .populate("sharedWith.userId", "name email")
      .populate("signature.signedBy", "name email");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const hasAccess =
      document.uploadedBy._id.toString() === req.user.id ||
      document.sharedWith.some(
        (s) => s.userId._id.toString() === req.user.id
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this document",
      });
    }

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Get Document Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update document status
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the uploader can change document status",
      });
    }

    document.status = status;
    await document.save();

    res.status(200).json({
      success: true,
      message: `Document status updated to ${status}`,
      document,
    });
  } catch (error) {
    console.error("Update Document Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Sign document
exports.signDocument = async (req, res) => {
  try {
    const { signatureUrl } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const hasAccess =
      document.uploadedBy.toString() === req.user.id ||
      document.sharedWith.some(
        (s) => s.userId.toString() === req.user.id && s.permission === "sign"
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to sign this document",
      });
    }

    document.signature = {
      signedBy: req.user.id,
      signatureUrl: signatureUrl,
      signedAt: new Date(),
      ipAddress: req.ip,
    };
    document.status = "signed";

    await document.save();
    await document.populate("signature.signedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Document signed successfully",
      document,
    });
  } catch (error) {
    console.error("Sign Document Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Share document
exports.shareDocument = async (req, res) => {
  try {
    const { userId, permission } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the uploader can share this document",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existing = document.sharedWith.find(
      (s) => s.userId.toString() === userId
    );

    if (existing) {
      existing.permission = permission || "view";
    } else {
      document.sharedWith.push({
        userId,
        permission: permission || "view",
      });
    }

    await document.save();

    res.status(200).json({
      success: true,
      message: "Document shared successfully",
      document,
    });
  } catch (error) {
    console.error("Share Document Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the uploader can delete this document",
      });
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete Document Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};