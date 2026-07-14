require("dotenv").config();

const express = require("express");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const profileRoutes = require("./routes/profileRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const { initializeSocket } = require("./socketServer");

connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Nexus API is running");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

initializeSocket(server);
console.log("✅ Socket.IO initialized");