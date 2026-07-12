const mongoose = require("mongoose");


const meetingSchema = new mongoose.Schema(
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
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    meetingLink: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "Online",
    },
    notes: {
      type: String,
      default: "",
    },
    rejectedReason: {
      type: String,
      default: "",
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Check for conflicting meetings
meetingSchema.statics.checkConflict = async function(organizerId, participantId, date, startTime, endTime) {
  const conflicting = await this.findOne({
    $or: [
      { organizer: organizerId },
      { participant: organizerId }
    ],
    date: new Date(date),
    status: { $in: ["pending", "accepted"] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });
  
  return conflicting;
};

module.exports = mongoose.model("Meeting", meetingSchema);