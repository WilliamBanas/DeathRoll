import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

interface Player {
	host: boolean;
	nickname: string;
	lobbyId: string | null;
	socketId: string;
	turn: boolean;
	loser: boolean;
}

interface Lobby {
	lobbyId: string;
	host: string;
	players: Player[];
}

interface Game {
	currentTurn: number;
	isActive: boolean;
	playerNumbers: { [socketId: string]: number };
}

const lobbies: Lobby[] = [];

const games: { [lobbyId: string]: Game } = {};

function createLobbyId() {
	return Math.random().toString(36).substring(2, 9);
}

export const configureSocket = (server: HTTPServer) => {
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:5173",
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log(`User connected: connection id: ${socket.id}`);

		socket.on("createLobby", (nickname: string) => {
			console.log(`Emitting createLobby event with nickname: ${nickname}`);
			const lobbyId = createLobbyId();

			const player: Player = {
				host: true,
				nickname,
				lobbyId,
				socketId: socket.id,
				turn: false,
				loser: false,
			};

			const newLobby: Lobby = {
				lobbyId,
				host: nickname,
				players: [player],
			};

			lobbies.push(newLobby);

			socket.join(lobbyId);
			console.log(`Lobby created with ID: ${lobbyId} by ${nickname}`);
			console.log(`Lobbies:`, lobbies);

			socket.emit("lobbyCreated", { lobbyId, player });
		});

		socket.on("joinLobby", ({ nickname, lobbyId }) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				const player: Player = {
					host: false,
					nickname,
					lobbyId,
					socketId: socket.id,
					turn: false,
					loser: false,
				};

				lobby.players.push(player);
				socket.join(lobbyId);
				console.log(`Lobby joined with ID: ${lobbyId} by ${nickname}`);
				io.to(lobbyId).emit("playerJoined", player);
				socket.emit("lobbyJoined", { lobbyId, player });
			} else {
				socket.emit("lobbyError", "Lobby not found.");
			}
		});

		socket.on("getLobbyData", (lobbyId) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				socket.emit("lobbyData", lobby);
			} else {
				socket.emit("lobbyError", "Lobby not found.");
			}
		});

		socket.on("leaveLobby", (lobbyId) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				const playerLeaving = lobby.players.find(
					(player) => player.socketId === socket.id
				);

				if (playerLeaving) {
					lobby.players = lobby.players.filter(
						(player) => player.socketId !== socket.id
					);

					if (playerLeaving.host) {
						if (lobby.players.length > 0) {
							const newHost = lobby.players[0];
							newHost.host = true;
							io.to(lobbyId).emit("playerLeft", socket.id);
						}
					}

					socket.broadcast.to(lobbyId).emit("playerLeft", socket.id);
				}
			}
		});

		socket.on("startGame", (lobbyId) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				lobby.players.sort(() => Math.random() - 0.5);

				games[lobbyId] = {
					currentTurn: 0,
					isActive: true,
					playerNumbers: {},
				};

				io.to(lobbyId).emit("gameStarted", { currentTurn: 0 });
			}
		});

		socket.on("playerAction", (lobbyId) => {
      const game = games[lobbyId];
      if (game && game.isActive) {
        const players = lobbies.find(
          (lobby) => lobby.lobbyId === lobbyId
        )?.players;
        if (players) {
          const currentPlayer = players[game.currentTurn];
          let randomNum: number;
          let rangeStart: number;
          let rangeEnd: number;
    
          // First player's random number
          if (game.currentTurn === 0) {
            rangeStart = 1;
            rangeEnd = 100;
            randomNum = Math.floor(Math.random() * 100) + 1;
          } else {
            // Next player random number based on previous player's number
            const previousPlayerNum =
              game.playerNumbers[players[game.currentTurn - 1].socketId];
            rangeStart = 1;
            rangeEnd = previousPlayerNum;
            randomNum = Math.floor(Math.random() * previousPlayerNum) + 1;
          }
    
          // Store player's number
          game.playerNumbers[currentPlayer.socketId] = randomNum;
    
          // Check if the game is over (i.e., random number is 1)
          if (randomNum === 1) {
            game.isActive = false;
            // Emit a gameOver event after a delay
            setTimeout(() => {
              io.to(lobbyId).emit("gameOver", {
                loser: currentPlayer.nickname,
              });
            }, 5000); // 5-second delay
            // Emit the losing message immediately
            console.log(`Player ${currentPlayer.nickname} has lost!`);
            io.to(lobbyId).emit("loserAnnouncement", currentPlayer.nickname);
            return;
          }
    
          // Move to the next player's turn
          game.currentTurn = (game.currentTurn + 1) % players.length;
    
          // Emit the updated turn, random number, and range to all players
          io.to(lobbyId).emit("turnChanged", {
            currentTurn: game.currentTurn,
            randomNum,
            socketId: currentPlayer.socketId, // Include socketId to identify the player
            rangeStart,
            rangeEnd,
          });
        }
      }
    });

		socket.on("disconnect", () => {
			console.log(`User disconnected: connection id: ${socket.id}`);
			socket.broadcast.emit("playerLeft", socket.id);
		});
	});
};
