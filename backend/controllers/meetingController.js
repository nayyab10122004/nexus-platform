const Meeting = require("../models/Meeting");
const User = require("../models/User");

// @desc    Schedule a meeting
// @route   POST /api/meetings
// @access  Private
exports.scheduleMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      participantId,
      date,
      startTime,
      endTime,
      duration,
      location,
      notes,
    } = req.body;

    const organizerId = req.user.id;

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // Check for conflicts
    const conflict = await Meeting.checkConflict(
      organizerId,
      participantId,
      date,
      startTime,
      endTime
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Meeting time conflicts with an existing meeting",
        conflict: conflict,
      });
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      description,
      organizer: organizerId,
      participant: participantId,
      date,
      startTime,
      endTime,
      duration,
      location: location || "Online",
      notes: notes || "",
      status: "pending",
      meetingLink: `https://meet.nexus.com/${Math.random().toString(36).substring(7)}`,
    });

    // Populate organizer and participant details
    await meeting.populate([
      { path: "organizer", select: "name email role" },
      { path: "participant", select: "name email role" },
    ]);

    res.status(201).json({
      success: true,
      message: "Meeting scheduled successfully",
      meeting,
    });
  } catch (error) {
    console.error("Schedule Meeting Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Get all meetings for a user
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching meetings for user:', userId);

    // Build filter - get meetings where user is organizer OR participant
    let filter = {
      $or: [
        { organizer: userId },
        { participant: userId }
      ]
    };

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add date filter if provided
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(req.query.date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    console.log('Filter:', JSON.stringify(filter));

    const meetings = await Meeting.find(filter)
      .populate('organizer', 'name email role')
      .populate('participant', 'name email role')
      .sort({ date: 1, startTime: 1 });

    console.log('Found meetings:', meetings.length);

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings: meetings
    });
  } catch (error) {
    console.error('Get Meetings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
};

// @desc    Get a single meeting
// @route   GET /api/meetings/:id
// @access  Private
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("organizer", "name email role")
      .populate("participant", "name email role");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if user is part of the meeting
    if (
      meeting.organizer._id.toString() !== req.user.id &&
      meeting.participant._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this meeting",
      });
    }

    res.status(200).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("Get Meeting Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update meeting status (Accept/Reject/Cancel)
// @route   PUT /api/meetings/:id/status
// @access  Private
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { status, rejectedReason } = req.body;
    const meetingId = req.params.id;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check authorization
    if (status === "accepted" || status === "rejected") {
      // Only participant can accept/reject
      if (meeting.participant.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the participant can accept or reject the meeting",
        });
      }
    } else if (status === "cancelled") {
      // Only organizer can cancel
      if (meeting.organizer.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the organizer can cancel the meeting",
        });
      }
    }

    // Update status
    meeting.status = status;
    if (status === "rejected" && rejectedReason) {
      meeting.rejectedReason = rejectedReason;
    }

    await meeting.save();

    await meeting.populate([
      { path: "organizer", select: "name email role" },
      { path: "participant", select: "name email role" },
    ]);

    res.status(200).json({
      success: true,
      message: `Meeting ${status} successfully`,
      meeting,
    });
  } catch (error) {
    console.error("Update Meeting Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update meeting details
// @route   PUT /api/meetings/:id
// @access  Private
exports.updateMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Only organizer can update
    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the organizer can update the meeting",
      });
    }

    // Check if meeting is already accepted or rejected
    if (meeting.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a meeting that is ${meeting.status}`,
      });
    }

    // If date/time is being changed, check for conflicts
    if (updates.date || updates.startTime || updates.endTime) {
      const newDate = updates.date || meeting.date;
      const newStartTime = updates.startTime || meeting.startTime;
      const newEndTime = updates.endTime || meeting.endTime;

      const conflict = await Meeting.checkConflict(
        meeting.organizer,
        meeting.participant,
        newDate,
        newStartTime,
        newEndTime
      );

      if (conflict && conflict._id.toString() !== meetingId) {
        return res.status(409).json({
          success: false,
          message: "Meeting time conflicts with an existing meeting",
          conflict: conflict,
        });
      }
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("organizer", "name email role")
      .populate("participant", "name email role");

    res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Update Meeting Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
exports.deleteMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if user is organizer or participant
    if (
      meeting.organizer.toString() !== userId &&
      meeting.participant.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this meeting",
      });
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Delete Meeting Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get upcoming meetings for a user
// @route   GET /api/meetings/upcoming
// @access  Private
exports.getUpcomingMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { participant: userId }],
      date: { $gte: today },
      status: { $in: ["pending", "accepted"] },
    })
      .populate("organizer", "name email role")
      .populate("participant", "name email role")
      .sort({ date: 1, startTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error("Get Upcoming Meetings Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
