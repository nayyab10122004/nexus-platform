const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// All routes are protected
router.use(protect);

// Profile routes
router.get("/", getProfile);
router.put("/", updateProfile);

module.exports = router;