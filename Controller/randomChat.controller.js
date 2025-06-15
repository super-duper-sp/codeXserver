const Chat = require("../Model/chat.model");

module.exports = (io, userSocketMap, onlineUsers) => {
  const activeChats = new Map(); // Stores matched user pairs: userId => partnerId

  return {
 // Get Total Active Chat Pairs (used in /status)
    getTotalActiveChats: () => {
      const counted = new Set();
      let count = 0;

      for (const [user, partner] of activeChats.entries()) {
        if (!counted.has(user) && !counted.has(partner)) {
          counted.add(user);
          counted.add(partner);
          count++;
        }
      }

      return count;
    }
  };
};