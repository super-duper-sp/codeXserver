const { Server } = require("socket.io");

const userSocketMap = {};
const onlineUsers = new Set();
const matchedPairs = new Map(); // userId -> partnerId

function initializeSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const matchQueue = [];
  app.set("io", io);
  app.set("userSocketMap", userSocketMap);
  app.set("onlineUsers", onlineUsers);
  app.set("matchQueue", matchQueue);

  // 🎯 Random Matching Function
  function tryToMatchUsers() {
    while (matchQueue.length >= 2) {
      const index1 = Math.floor(Math.random() * matchQueue.length);
      const user1 = matchQueue.splice(index1, 1)[0];

      const index2 = Math.floor(Math.random() * matchQueue.length);
      const user2 = matchQueue.splice(index2, 1)[0];

      const socket1 = io.sockets.sockets.get(user1.socketId);
      const socket2 = io.sockets.sockets.get(user2.socketId);

      if (socket1 && socket2) {
        socket1.emit("matched", { partnerId: user2.userId });
        socket2.emit("matched", { partnerId: user1.userId });

        matchedPairs.set(user1.userId, user2.userId);
        matchedPairs.set(user2.userId, user1.userId);

        console.log(`✅ Matched ${user1.userId} ↔ ${user2.userId}`);
      }
    }
  }

  // 🧠 Socket Events
  io.on("connection", (socket) => {
    console.log(`⚡ Connected: ${socket.id}`);

    socket.on("register", (userId) => {
      userSocketMap[userId] = socket.id;
      onlineUsers.add(userId);
      console.log(`✅ Registered: ${userId} → ${socket.id}`);

      matchQueue.push({ userId, socketId: socket.id });
      tryToMatchUsers();

      io.emit("online_users", onlineUsers.size);
    });

    socket.on("leave_queue", (userId) => {
      const index = matchQueue.findIndex((u) => u.userId === userId);
      if (index !== -1) {
        matchQueue.splice(index, 1);
        console.log(`🚪 ${userId} left the queue`);
      }
    });

    socket.on("send_message", ({ senderId, message }) => {
      const receiverId = matchedPairs.get(senderId);
      const receiverSocketId = userSocketMap[receiverId];

      if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket) {
          receiverSocket.emit("receive_message", {
            senderId,
            message,
            timestamp: new Date(),
          });
          console.log(`✉️ ${senderId} → ${receiverId}: ${message}`);
        }
      } else {
        console.log(`⚠️ No matched partner for ${senderId}`);
      }
    });

    socket.on("disconnect", () => {
      const userId = Object.keys(userSocketMap).find((id) => userSocketMap[id] === socket.id);

      if (userId) {
        delete userSocketMap[userId];
        onlineUsers.delete(userId);
        console.log(`❌ Disconnected: ${userId}`);

        // Remove from matchQueue if still there
        const index = matchQueue.findIndex((u) => u.socketId === socket.id);
        if (index !== -1) {
          matchQueue.splice(index, 1);
          console.log(`🧹 Removed ${socket.id} from queue`);
        }

        // Notify matched partner and clean up
        if (matchedPairs.has(userId)) {
          const partnerId = matchedPairs.get(userId);
          const partnerSocketId = userSocketMap[partnerId];

          if (partnerSocketId) {
            const partnerSocket = io.sockets.sockets.get(partnerSocketId);
            if (partnerSocket) {
              partnerSocket.emit("partner_left", { userId });
              console.log(`⚠️ Notified ${partnerId} that ${userId} left`);
            }
          }

          matchedPairs.delete(userId);
          matchedPairs.delete(partnerId);
        }
      }

      io.emit("online_users", onlineUsers.size);
    });
  });
}

module.exports = { initializeSocket };