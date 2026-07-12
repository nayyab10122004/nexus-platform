const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  searchUsers,
  getUsersByRole,
  getUserStats,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

// All routes are protected
router.use(protect);

// Get user stats
router.get("/stats", getUserStats);

// Search users
router.get("/search", searchUsers);

// Get users by role
router.get("/role/:role", getUsersByRole);

// Get all users and create user (get all users)
router.get("/", getUsers);

// Get, update, delete a single user
router.route("/:id")
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;