import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store for VIP status (for demo purposes)
const vipUsers = new Set<string>();

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Matchmaking queues by filter and country
  const queues: Record<string, string[]> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-queue", (data) => {
      const { filter, country } = data;
      const queueKey = `${filter || 'All'}_${country || 'Global'}`;
      
      console.log(`User ${socket.id} joining queue: ${queueKey}`);

      if (!queues[queueKey]) {
        queues[queueKey] = [];
      }

      // Remove from any other queues first
      Object.keys(queues).forEach(key => {
        queues[key] = queues[key].filter(id => id !== socket.id);
      });

      if (queues[queueKey].length > 0) {
        const partnerId = queues[queueKey].shift()!;
        const roomId = `room_${Math.random().toString(36).substring(7)}`;
        
        // Join room
        socket.join(roomId);
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.join(roomId);
          
          // Notify both users
          io.to(socket.id).emit("match-found", { roomId, initiator: true });
          io.to(partnerId).emit("match-found", { roomId, initiator: false });
          
          console.log(`Matched ${socket.id} with ${partnerId} in room ${roomId}`);
        } else {
          // Partner disconnected while in queue
          queues[queueKey].push(socket.id);
        }
      } else {
        queues[queueKey].push(socket.id);
      }
    });

    socket.on("signal-data", (data) => {
      const { roomId, signal } = data;
      // Broadcast to others in the room
      socket.to(roomId).emit("signal-data", {
        roomId,
        signal
      });
    });

    socket.on("disconnect", () => {
      Object.keys(queues).forEach(key => {
        queues[key] = queues[key].filter(id => id !== socket.id);
      });
      console.log("User disconnected:", socket.id);
    });
  });

  // CCBill Post-back Webhook
  app.post("/api/ccbill/postback", (req, res) => {
    console.log("CCBill Post-back received:", req.body);
    
    // In a real scenario, you'd verify the signature and update a database
    const { eventType, clientAccNo, clientSubAccNo, subscriptionId, userId, planId } = req.body;
    
    if (userId) {
      console.log(`Processing payment for user: ${userId}, plan: ${planId}`);
      
      let coins = 0;
      if (planId === 'pack_100') coins = 100;
      else if (planId === 'pack_500') coins = 500;
      else if (planId === 'pack_1500') coins = 1500;

      if (coins > 0) {
        io.emit("payment-success", { userId, coins });
      } else {
        vipUsers.add(userId);
        io.emit("payment-success", { userId, status: "VIP ELITE" });
      }
    }
    
    res.send("1");
  });

  // API to check VIP status
  app.get("/api/user/status/:userId", (req, res) => {
    const { userId } = req.params;
    res.json({ isPremium: vipUsers.has(userId) });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
