const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["view", "edit", "sign"],
          default: "view",
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "signed", "rejected", "archived"],
      default: "draft",
    },
    version: {
      type: Number,
      default: 1,
    },
    signature: {
      signedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      signatureUrl: {
        type: String,
      },
      signedAt: {
        type: Date,
      },
      ipAddress: {
        type: String,
      },
    },
    tags: [String],
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
documentSchema.index({ uploadedBy: 1, status: 1 });
documentSchema.index({ "sharedWith.userId": 1 });

module.exports = mongoose.model("Document", documentSchema);