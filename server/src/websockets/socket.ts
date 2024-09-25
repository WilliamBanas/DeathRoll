import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { RoomController } from "../controllers/room.controller";

export const configureSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Autorise les connexions du frontend
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("createRoom", async (roomId) => {
      try {
        // Créer la salle en utilisant le contrôleur
        const room = await RoomController._createRoomInDB(roomId);
        socket.emit("roomCreated", room); // Émet une réponse au client
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("roomError", { error: "Could not create room" }); // Émet une erreur
      }
    });

    socket.on("checkRoom", async (roomId) => {
      try {
        const roomExists = await RoomController.exists(roomId); // Passe uniquement roomId
        socket.emit("roomExists", { exists: roomExists });
      } catch (error) {
        console.error("Error checking room existence:", error);
        socket.emit("roomCheckError", { error: "Could not check room" });
      }
    });
  
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Client ${socket.id} joined room: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};