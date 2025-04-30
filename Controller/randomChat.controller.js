

exports.joinChatQueue = (req, res) => {
    const { userId } = req.body;
    // Add logic to put the user in the matchmaking queue
    res.json({ success: true, message: "User added to the chat queue" });
};
  
exports.leaveChatQueue = (req, res) => {
const { userId } = req.body;
    // Remove user from queue / disconnect logic
    res.json({ success: true, message: "User left the chat" });
};

exports.reportUser = (req, res) => {
    const { reporterId, reportedId, reason } = req.body;
    console.log(`⚠️ Report: ${reporterId} → ${reportedId}: ${reason}`);
    res.status(200).json({ message: "Report received" });
};


const Chat = require("../Model/chat.model");

// Send a message and emit to receiver
exports.sendMessage = async (req, res) => {
    try {
      const { senderId, receiverId, message } = req.body;
  
      if (!senderId || !receiverId || !message) {
        return res.status(400).json({ message: "senderId, receiverId, and message are required" });
      }
  
      const chat = await Chat.create({ senderId, receiverId, message });
  
      const io = req.app.get("io");
      const userSocketMap = req.app.get("userSocketMap");
  
      const receiverSocketId = userSocketMap[receiverId];
    
      console.log(userSocketMap);
      console.log(userSocketMap[receiverId]);

  
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", chat);
      }
  
      res.status(201).json({
        message: "Message sent successfully",
        chat
      });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };