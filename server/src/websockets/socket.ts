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
	isActive: boolean;
	currentTurn: number;
	playerNumbers: Record<string, number>;
	isFirstTurn: boolean;
	startingNumber: number; // Ajoutez le nombre de départ ici
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
				// Check if the nickname is already in use in this lobby
				const isNicknameInUse = lobby.players.some(player => player.nickname === nickname);
				
				if (isNicknameInUse) {
					socket.emit("lobbyError", "Nickname already in use in this lobby.");
					return;
				}

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

		socket.on("startGame", ({ lobbyId, startingNumber }) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				lobby.players.sort(() => Math.random() - 0.5);

				games[lobbyId] = {
					currentTurn: 0,
					isActive: true,
					playerNumbers: {},
					isFirstTurn: true,
					startingNumber, // Ajoutez le nombre de départ ici
				};

				io.to(lobbyId).emit("gameStarted", { currentTurn: 0, startingNumber });
			}
		});

		socket.on("playerAction", (lobbyId) => {
			const game = games[lobbyId];
			if (game && game.isActive) {
				const players = lobbies.find(
					(lobby) => lobby.lobbyId === lobbyId
				)?.players;

				if (players && players.length > 0) {
					const currentPlayer = players[game.currentTurn];
					let randomNum: number;
					let lastGeneratedNum: number | null = null;

					// First turn logic
					if (game.isFirstTurn) {
						randomNum = Math.floor(Math.random() * game.startingNumber) + 1;
						game.isFirstTurn = false;
					} else {
						// Use the last generated number as the new range limit
						const previousPlayerSocketId =
							players[
								game.currentTurn === 0
									? players.length - 1
									: game.currentTurn - 1
							].socketId;
						lastGeneratedNum = game.playerNumbers[previousPlayerSocketId];

						randomNum = Math.floor(Math.random() * lastGeneratedNum) + 1;
					}

					console.log(
						`Player: ${currentPlayer.nickname}, Last Generated Number: ${
							lastGeneratedNum !== null ? lastGeneratedNum : "N/A"
						}, Random Number: ${randomNum}`
					);

					// Save the generated number for the current player
					game.playerNumbers[currentPlayer.socketId] = randomNum;

					// If the player generates 1, they lose
					if (randomNum === 1) {
						game.isActive = false;
						currentPlayer.loser = true; // Mark the current player as loser
						io.to(lobbyId).emit("playerReachedOne", {
							playerName: currentPlayer.nickname,
							loserSocketId: currentPlayer.socketId
						});
						setTimeout(() => {
							io.to(lobbyId).emit("gameOver", {
								loser: currentPlayer.nickname,
							});
						}, 4000);
						return;
					}

					// Pass the turn to the next player
					game.currentTurn = (game.currentTurn + 1) % players.length;

					// Emit the turn change to all players, including the generated number
					io.to(lobbyId).emit("turnChanged", {
						currentTurn: game.currentTurn,
						randomNum, // Include the generated number
						lastGeneratedNum:
							lastGeneratedNum !== null ? lastGeneratedNum : undefined,
						socketId: currentPlayer.socketId,
					});

					// Emit the generated number so all players can display it
					io.to(lobbyId).emit("currentRoll", { randomNum });
				}
			}
		});

		socket.on("stopGame", (lobbyId) => {
			console.log(`Received stopGame event for lobby ${lobbyId}`); // Ajoutez ce log
			const game = games[lobbyId];
			if (game && game.isActive) {
				game.isActive = false;
				io.to(lobbyId).emit("gameOver", {
					message: "The host has stopped the game.",
				});
				console.log(`Game in lobby ${lobbyId} has been stopped by the host.`);
			} else {
				console.log(`No active game found for lobby ${lobbyId}`);
			}
		});

		socket.on("disconnect", () => {
			console.log(`User disconnected: connection id: ${socket.id}`);

			// Find the lobby the user was in
			const lobby = lobbies.find((lobby) =>
				lobby.players.some((player) => player.socketId === socket.id)
			);

			if (lobby) {
				const playerLeaving = lobby.players.find(
					(player) => player.socketId === socket.id
				);

				if (playerLeaving) {
					// Remove player from lobby
					lobby.players = lobby.players.filter(
						(player) => player.socketId !== socket.id
					);

					// If the player was the host, reassign host to the next player
					if (playerLeaving.host) {
						if (lobby.players.length > 0) {
							const newHost = lobby.players[0];
							newHost.host = true;
							io.to(lobby.lobbyId).emit("hostChanged", {
								newHost: newHost.nickname,
							});
						} else {
							// If there are no players left, remove the lobby
							const lobbyIndex = lobbies.indexOf(lobby);
							if (lobbyIndex !== -1) {
								lobbies.splice(lobbyIndex, 1);
								console.log(`Lobby with ID: ${lobby.lobbyId} removed.`);
							}
							return; // Exit early since the lobby is removed
						}
					}

					// Check if the game is active
					const game = games[lobby.lobbyId];
					if (game && game.isActive) {
						// If there are no players left after the player leaves, stop the game
						if (lobby.players.length === 0) {
							game.isActive = false;
							io.to(lobby.lobbyId).emit("gameOver", {
								message: "All players have left. The game is over.",
							});
							console.log(`Game in lobby ${lobby.lobbyId} has ended.`);
						}
					}

					// Notify other players that someone left
					socket.broadcast.to(lobby.lobbyId).emit("playerLeft", socket.id);
					console.log(`Player left the lobby: ${socket.id}`);
				}
			}
		});
	});
};
