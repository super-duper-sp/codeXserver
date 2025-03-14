const userController = require("../Controller/user.controller");
const router = require("express").Router();
const { authenticateToken } = require('../Middleware/Authorization/authenticationToken');

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get("/profile", userController.getProfile);

// Update user profile
router.put("/profile", userController.updateProfile);

// Delete user profile
router.delete("/profile", userController.deleteProfile);

module.exports = router; 