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

// Socket.IO Init (modular)
const { initializeSocket } = require("./soketHandler");
initializeSocket(server, app); // Pass both server & app


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


// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});