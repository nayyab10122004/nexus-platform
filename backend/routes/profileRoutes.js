const express = require("express");
const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

router.get("/", authMiddleware, getProfile);

router.put("/", authMiddleware, updateProfile);

module.exports = router;
router.get(
  "/investor",
  authMiddleware,
  roleMiddleware("Investor"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Investor Dashboard",
    });
  }
);

router.get(
  "/entrepreneur",
  authMiddleware,
  roleMiddleware("Entrepreneur"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Entrepreneur Dashboard",
    });
  }
);