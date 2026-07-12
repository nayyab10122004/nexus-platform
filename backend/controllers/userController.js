const User = require("../models/User");

// @desc    Get all users (except current user)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("name email role bio startupHistory investmentHistory preferences")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email role bio startupHistory investmentHistory preferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search users by name or email
// @route   GET /api/users/search?q=keyword
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select("name email role bio startupHistory investmentHistory preferences")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Search Users Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get users by role (Investor or Entrepreneur)
// @route   GET /api/users/role/:role
// @access  Private
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Capitalize first letter to match enum
    const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
    
    if (!["Investor", "Entrepreneur"].includes(capitalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'Investor' or 'Entrepreneur'",
      });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      role: capitalizedRole,
    })
      .select("name email role bio startupHistory investmentHistory preferences")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
      role: capitalizedRole,
    });
  } catch (error) {
    console.error("Get Users By Role Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user stats (counts by role)
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const investors = await User.countDocuments({ role: "Investor" });
    const entrepreneurs = await User.countDocuments({ role: "Entrepreneur" });

    res.status(200).json({
      success: true,
      stats: {
        total: totalUsers,
        investors,
        entrepreneurs,
      },
    });
  } catch (error) {
    console.error("Get User Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile (admin or self)
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is updating their own profile or is admin
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      });
    }

    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete users",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};