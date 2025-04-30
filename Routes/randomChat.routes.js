const router = require("express").Router();
const { authenticateToken } = require("../Middleware/Authorization/authenticationToken");
const randomChatController = require("../Controller/randomChat.controller");

// All routes require authentication
// router.use(authenticateToken);

// Send a message
router.post("/send", randomChatController.sendMessage);

// Join chat queue
router.post("/join", randomChatController.joinChatQueue);

// Leave chat
router.post("/leave", randomChatController.leaveChatQueue);

// Report another user
router.post("/report", randomChatController.reportUser);

module.exports = router;