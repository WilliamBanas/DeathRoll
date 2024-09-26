import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../secrets";

// Interface définissant la structure d'une Room
interface Room {
	id: string; // Identifiant unique de la room
	players: Array<{ userId: number; nickname: string }>; // Liste des joueurs avec leurs userId et nicknames
}

// Utilisation d'une Map pour stocker les rooms en mémoire
const rooms: Map<string, Room> = new Map();
// Map pour stocker les relations entre utilisateurs et room
const userToRoom: Map<number, string> = new Map();

export const configureSocket = (server: HTTPServer) => {
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:5173",
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	// Middleware pour vérifier le JWT et passer au traitement
	io.use((socket: Socket, next) => {
		const token = socket.handshake.auth.token; // Récupérer le token depuis l'authentification

		if (token) {
			console.log("Received token:", token); // Log the received token for debugging
			try {
				const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
				socket.data = {
					userId: parseInt(decoded.userId), // Assurez-vous que userId est un nombre
					nickname: decoded.nickname,
				};
				next();
			} catch (error: Error | any) {
				console.error("JWT verification failed:", error.message); // Log the error message
				next(new Error("Authentication error"));
			}
		} else {
			next(new Error("Authentication error"));
		}
	});

	// Lorsqu'une nouvelle connexion est établie
	io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, ${socket.data.userId}, ${socket.data.nickname}`);
		const userId = socket.data.userId; // Utilisation de socket.data pour récupérer userId
		const nickname = socket.data.nickname; // Utilisation de socket.data pour récupérer nickname

		// Gestion de la création d'une room
		socket.on("createRoom", async (roomId) => {
      try {
        // Log the attempt to create a room
        console.log(`Attempting to create room with ID: ${roomId}`);
        
        if (!rooms.has(roomId)) {
          rooms.set(roomId, { id: roomId, players: [] });
          console.log(`Room created: ${roomId}`);
          socket.emit("roomCreated", roomId); // Emit only if room was created
        } else {
          console.warn(`Room already exists: ${roomId}`);
          socket.emit("roomError", { error: "Room already exists" });
        }
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("roomError", { error: "Could not create room" });
      }
    });

		// Gestion de la tentative de rejoindre une room
		socket.on("joinRoom", async (roomId) => {
			try {
				// Vérifier si l'utilisateur est déjà dans une autre room
				const currentRoomId = userToRoom.get(userId!); // Utilisation de userId

				// Si l'utilisateur est déjà dans une room, le retirer de cette room avant de le connecter à la nouvelle
				if (currentRoomId && currentRoomId !== roomId) {
					const currentRoom = rooms.get(currentRoomId);
					if (currentRoom) {
						const playerIndex = currentRoom.players.findIndex(
							(player) => player.userId === userId
						);
						if (playerIndex !== -1) {
							currentRoom.players.splice(playerIndex, 1); // Retirer l'utilisateur de l'ancienne room
							socket.leave(currentRoomId); // Déconnecter de l'ancienne room

							// Supprimer la room si elle est vide
							if (currentRoom.players.length === 0) {
								rooms.delete(currentRoomId);
							}
						}
					}
				}

				// Vérifier si la nouvelle room existe
				if (!rooms.has(roomId)) {
					socket.emit("roomError", { error: "Room does not exist" });
					return;
				}

				const room = rooms.get(roomId);

				// Vérifier si la room est pleine
				if (room!.players.length >= 8) {
					socket.emit("roomError", { error: "Room is full" });
					return;
				}

				// Ajouter l'utilisateur à la nouvelle room
				room!.players.push({ userId: userId!, nickname: nickname! });
				userToRoom.set(userId!, roomId); // Mettre à jour la relation user -> room
				socket.join(roomId); // Rejoindre la nouvelle room côté serveur
				socket.emit("joinedRoom", roomId); // Notifier le client
			} catch (error) {
				console.error("Error joining room:", error);
				socket.emit("roomError", { error: "Could not join room" });
			}
		});

		socket.on("checkRoom", (roomId) => {
			console.log(`Checking if room exists: ${roomId}`); // Added logging for debugging
			if (rooms.has(roomId)) {
				// If the room exists, emit back that it exists
				console.log(`Room exists: ${roomId}`);
				socket.emit("roomExists", { exists: true });
			} else {
				// If the room does not exist, emit back that it does not exist
				console.error(`Room does not exist: ${roomId}`);
				socket.emit("roomExists", { exists: false });
			}
		});

		// Gestion de la déconnexion
		socket.on("leaveRoom", async () => {
			try {
				const currentRoomId = userToRoom.get(userId!);
				if (currentRoomId) {
					const room = rooms.get(currentRoomId);

					if (room) {
						// Retirer l'utilisateur de la room
						const playerIndex = room.players.findIndex(
							(player) => player.userId === userId
						);
						if (playerIndex !== -1) {
							room.players.splice(playerIndex, 1);
						}

						// Si la room est vide, la supprimer
						if (room.players.length === 0) {
							rooms.delete(currentRoomId);
						}
					}

					// Retirer la relation entre l'utilisateur et la room
					userToRoom.delete(userId!);
				}
			} catch (error) {
				console.error("Error while leaving room:", error);
			}
		});
	});
};
