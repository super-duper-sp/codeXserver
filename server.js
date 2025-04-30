const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv").config();
const cors = require("cors");
const morgan = require("morgan");

// Initialize express app and HTTP server
const app = express();
const server = http.createServer(app);

// Set CORS options
const corsOptions = {
  origin: "*", // You can restrict this in production
};

// Middleware
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// Connect to database
const db = require("./Model/dbConnection");
db.sequelize.sync();
// Uncomment below for dropping & recreating tables during development
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });
const connectMongoDB = require("./Config/mongoDB.config");
connectMongoDB(); 

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "CodeX : Server is running" });
});

// API Routes
const authRoutes = require("./Routes/auth.routes");
const userRoutes = require("./Routes/user.routes");
const randomChatRoutes = require("./Routes/randomChat.routes");


app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/random-chat", randomChatRoutes);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // You can restrict this in production
    methods: ["GET", "POST"],
  },
});

// Socket.IO events
const userSocketMap = {};      // userId -> socketId
const onlineUsers = new Set(); // track online userIds

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Step 1: Register user when client sends their ID
  socket.on("register_user", (userId) => {
    userSocketMap[userId] = socket.id;
    socket.userId = userId;

    onlineUsers.add(userId);
    console.log(`🟢 ${userId} is online`);

    // Broadcast to all clients
    io.emit("user_status_update", { userId, status: "online" });
  });

  // Step 2: Handle disconnect
  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (userId) {
      delete userSocketMap[userId];
      onlineUsers.delete(userId);
      console.log(`🔴 ${userId} went offline`);

      io.emit("user_status_update", { userId, status: "offline" });
    }
  });

  // (Optional) handle direct message event here if needed
});


// Make io accessible in routes (optional)
app.set("io", io);
app.set("userSocketMap", userSocketMap);
app.set("onlineUsers", onlineUsers);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});