import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Message from "./models/Message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // ภายหลังแก้เป็น localhost:5173 (React)
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Simple Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

let users = {}; // username -> socketId
let rooms = {}; // groupName -> [members]

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  // Client joins with a username
  socket.on("join", (username) => {
    // 🔽 เพิ่มส่วนนี้
    if (Object.values(users).includes(username)) {
      socket.emit("join_error", "Username is already taken.");
      return;
    }
    // 🔼 สิ้นสุดส่วนที่เพิ่ม

    users[socket.id] = username;

    // ส่ง greeting จาก server
    socket.emit("server_message", `👋 Welcome ${username}!`);

    // ส่งรายชื่อ user ทั้งหมดกลับไปให้ทุกคน
    io.emit("user_list", Object.values(users));
  });

  // 🔽 เพิ่ม Event Listener นี้เข้าไป 🔽
  // เมื่อ client ร้องขอ list ตอนโหลดหน้า
  socket.on("get_initial_lists", () => {
    console.log(`✨ ${users[socket.id]} requested initial lists`);
    // ส่ง list ทั้งสองกลับไปหา "แค่คนนั้น"
    socket.emit("user_list", Object.values(users));
    socket.emit("group_list", rooms);
  });
  // 🔼 สิ้นสุดส่วนที่เพิ่ม 🔼

  // รับข้อความ private
  socket.on("private_message", async ({ to, message }) => {
    const fromUser = users[socket.id];
    // Save first
    try {
      const saved = await Message.create({
        sender: fromUser,
        receiver: to,
        content: message,
        reactions: {}
      });

      // build payload with DB id and timestamp
      const payload = {
        _id: saved._id,
        sender: saved.sender,
        receiver: saved.receiver,
        content: saved.content,
        timestamp: saved.timestamp || saved.createdAt || Date.now()
      };

      const targetSocketId = Object.keys(users).find(key => users[key] === to);

      // emit to recipient (if online)
      if (targetSocketId) {
        io.to(targetSocketId).emit("private_message", payload);
      }

      // always emit back to sender
      socket.emit("private_message", payload);

      console.log(`💾 Saved private message from ${fromUser} to ${to}`);
    } catch (err) {
      console.error("❌ Error saving private message:", err);
    }
  });

  // รับข้อความในกลุ่ม
  socket.on("group_message", async ({ room, message }) => {
    const fromUser = users[socket.id];
    try {
      const saved = await Message.create({
        sender: fromUser,
        room,
        content: message,
        reactions: {}
      });

      const payload = {
        _id: saved._id,
        sender: saved.sender,
        room: saved.room,
        content: saved.content,
        timestamp: saved.timestamp || saved.createdAt || Date.now()
      };

      io.to(room).emit("group_message", payload);

      console.log(`💾 Saved group message in ${room} from ${fromUser}`);
    } catch (err) {
      console.error("❌ Error saving group message:", err);
    }
  });

  // สร้าง group
  socket.on("create_group", (groupName) => {
    rooms[groupName] = [users[socket.id]];
    socket.join(groupName);
    // ส่ง group_list ให้ทุกคน
    io.emit("group_list", rooms);
    // ส่ง members ของกลุ่มนี้ไปยังผู้สร้าง
    socket.emit("group_members_updated", { groupName, members: rooms[groupName] });
  });

  // เข้าร่วม group
  socket.on("join_group", (groupName) => {
    const username = users[socket.id];

    for (const room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`🚪 ${username} left room ${room}`);
    }
  }
    socket.join(groupName);
    if (!rooms[groupName]) rooms[groupName] = [];
    
    if (username && !rooms[groupName].includes(username)) {
      rooms[groupName].push(username);
      // ส่ง group_list ให้ทุกคน
      io.emit("group_list", rooms);
      // ส่ง members ไปยังทุกคนในกลุ่มนี้
      io.to(groupName).emit("group_members_updated", { groupName, members: rooms[groupName] });
    }
    // ส่ง members ของกลุ่มนี้ไปยังผู้เข้าร่วม (แม้ว่าเป็นสมาชิกเดิมแล้ว)
    socket.emit("group_members_updated", { groupName, members: rooms[groupName] });
  });

//
// 📍 index.js (ฟังก์ชัน add_reaction เวอร์ชั่นสมบูรณ์ + Debug)
//
socket.on('add_reaction', async ({ messageId, emoji, username, chatType, chatName }) => {
  
  // ---------------------------------------------
  // 🐞 DEBUG: เพิ่ม Log เพื่อตรวจสอบ
  // ---------------------------------------------
  console.log(`[Reaction] 🚀 User '${username}' reacted with '${emoji}' on message '${messageId}'`);
  // ---------------------------------------------

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      // ---------------------------------------------
      // 🐞 DEBUG
      console.error(`[Reaction] ❌ ERROR: Message NOT FOUND with ID: ${messageId}`);
      // ---------------------------------------------
      return;
    }

    console.log(`[Reaction] 📄 Found message. Current reactions (before):`, message.reactions);

  // 1. ดึง Array ของ user ที่กด emoji นี้ (ถ้าไม่มี จะได้ Array ว่าง)
  //    ชื่อเปลี่ยนเป็น reactedUsers เพื่อไม่ให้ไปทับตัวแปร global `users`
  const reactedUsers = message.reactions.get(emoji) || [];

    // 2. Toggle (เพิ่ม/ลบ)
    const index = reactedUsers.indexOf(username);
    if (index > -1) {
      reactedUsers.splice(index, 1); // ลบออก
      console.log(`[Reaction] ➖ Removing reaction.`);
    } else {
      reactedUsers.push(username); // เพิ่มเข้าไป
      console.log(`[Reaction] ➕ Adding reaction.`);
    }

    // 3. บันทึก Map กลับเข้าไป
    if (reactedUsers.length > 0) {
      // เราใช้ .set(key, value)
      message.reactions.set(emoji, reactedUsers);
    } else {
      // ลบ key (emoji) ทิ้ง ถ้าไม่มีคนกดแล้ว
      // เราใช้ .delete(key)
      message.reactions.delete(emoji);
    }

    console.log(`[Reaction] 📝 Reactions (after):`, message.reactions);

    // ❗️ Mongoose Map สามารถตรวจจับการเปลี่ยนแปลง .set() และ .delete() ได้
    //    เราอาจไม่จำเป็นต้องใช้ .markModified() แต่ใส่ไว้ก็ไม่เสียหาย
    // message.markModified('reactions'); // เอาออกไปก่อนก็ได้

    // 4. บันทึกลง Database
    await message.save();
    
    // ---------------------------------------------
    // 🐞 DEBUG
    console.log(`[Reaction] ✅ SUCCESS: Message saved to DB.`);
    // ---------------------------------------------

    const reactionUpdate = {
      messageId,
      reactions: message.reactions, // ส่ง Map กลับไป (React จะเห็นเป็น Object)
    };

    // 5. Broadcast (โค้ดส่วนนี้เหมือนเดิม และถูกต้องแล้ว)
    if (chatType === 'private') {
  // -----------------------------------------------------------------
      // ❗️❗️ DEBUG: เพิ่ม Log ตรงนี้ ❗️❗️
      // -----------------------------------------------------------------
  console.log(`[Reaction] DEBUG: Searching for... Sender: '${message.sender}', Receiver: '${message.receiver}'`);
  console.log(`[Reaction] DEBUG: Reacted users array:`, reactedUsers);
  console.log(`[Reaction] DEBUG: All connected users mapping:`, users);
      // -----------------------------------------------------------------
      const senderSocketId = Object.keys(users).find(key => users[key] === message.sender);
      const receiverSocketId = Object.keys(users).find(key => users[key] === message.receiver);
      
      // ---------------------------------------------
      // 🐞 DEBUG
      console.log(`[Reaction] 📡 Broadcasting 'reaction_updated' to private sockets: ${senderSocketId}, ${receiverSocketId}`);
      // ---------------------------------------------

      if (senderSocketId) {
        io.to(senderSocketId).emit('reaction_updated', reactionUpdate);
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('reaction_updated', reactionUpdate);
      }

    } else { // group

      io.to(chatName).emit('reaction_updated', reactionUpdate);
    }

  } catch (err) {
    // ---------------------------------------------
    // 🐞 DEBUG
    console.error('[Reaction] ❌❌❌ CATASTROPHIC ERROR:', err);
    // ---------------------------------------------
  }
});

  // disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 ${socket.id} disconnected`);

    const username = users[socket.id]; // 🔽 เพิ่มส่วนนี้
    delete users[socket.id];

    // ลบ user ออกจากทุก group ที่เขาอยู่
    if (username) {
      Object.keys(rooms).forEach(groupName => {
        rooms[groupName] = rooms[groupName].filter(member => member !== username);
        // ถ้ากลุ่มไม่เหลือใคร อาจจะลบกลุ่มทิ้งไปเลยก็ได้
        if (rooms[groupName].length === 0) {
          delete rooms[groupName];
        }
      });
      io.emit("group_list", rooms); // (R9) อัปเดต list 
    }
    // 🔼 สิ้นสุดส่วนที่เพิ่ม

    io.emit("user_list", Object.values(users));
  });
});

// 🔹 ดึงข้อความ private (ระหว่างผู้ใช้สองคน)
app.get("/api/messages/private/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 }); // เรียงตามเวลาเก่าก่อนไปใหม่
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch private messages" });
  }
});

// 🔹 ดึงข้อความ group
app.get("/api/messages/group/:room", async (req, res) => {
  const { room } = req.params;
  try {
    const messages = await Message.find({ room }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));