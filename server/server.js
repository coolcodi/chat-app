import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import http from "http"
import connectmongo from './dbconnect.js'
import userRouter from './routes/userRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import { Server } from 'socket.io'

// Create Express app and http server
//1️⃣ CREATE EXPRESS APP
const app=express();
let port=process.env.PORT || 8000;


const dbconnect=process.env.MONGODB_URI
// 2️⃣ CREATE HTTP SERVER
// (Required for Socket.IO)
const server = http.createServer(app);
// 3️⃣ CREATE SOCKET.IO SERVER
// ===============================
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend URL
   
    credentials: true
  
  }
});

// 4️⃣ SOCKET.IO LOGIC
// ===============================
export const userSocketMap = new Map(); // userId -> socketId
// connection 
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) return;

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }

  userSocketMap.get(userId).add(socket.id);

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    const userSockets = userSocketMap.get(userId);

    if (userSockets) {
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        userSocketMap.delete(userId);
      }
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});
 connectmongo(dbconnect)
 .then(() => {
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

server.on("error", (err) => {
  console.error("Server error:", err.message);
});

// Middleware setup 

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use('/api/status',(req,res)=>{
res.send("<h1>Server is ready </h1>");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);