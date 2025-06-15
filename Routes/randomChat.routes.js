const express = require("express");
const router = express.Router();



router.get("/status", (req, res) => {
  const userSocketMap = req.app.get("userSocketMap");
  const onlineUsers = req.app.get("onlineUsers");

  // For total chat pairs
  const controller = req.app.get("randomChatController");
  const totalChats = controller.getTotalActiveChats();

  res.json({
    onlineUsers: onlineUsers.size,
    activeChats: totalChats,
    queueLength: matchQueue.length,
    userSocketIds: Object.keys(userSocketMap),
    queuedUsers: matchQueue,
  });
});

module.exports = router;