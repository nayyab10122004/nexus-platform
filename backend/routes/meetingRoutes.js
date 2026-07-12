const express = require("express");
const router = express.Router();
const {
  scheduleMeeting,
  getMeetings,
  getMeetingById,
  updateMeetingStatus,
  updateMeeting,
  deleteMeeting,
  getUpcomingMeetings,
} = require("../controllers/meetingController");
const { protect } = require("../middleware/auth");

// All routes are protected (require authentication)
router.use(protect);

// Meeting routes
router.route("/")
  .post(scheduleMeeting)
  .get(getMeetings);

router.get("/upcoming", getUpcomingMeetings);

router.route("/:id")
  .get(getMeetingById)
  .put(updateMeeting)
  .delete(deleteMeeting);

router.put("/:id/status", updateMeetingStatus);

module.exports = router;
