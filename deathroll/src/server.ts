import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({
	path:
		process.env.NODE_ENV === "production" ? ".env.production" : ".env.local",
});

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const baseUrl = dev
	? process.env.NEXT_PUBLIC_API_URL
	: process.env.NEXT_PUBLIC_SOCKET_URL;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

interface Player {
	host: boolean;
	nickname: string;
	lobbyId: string | null;
	socketId: string;
	turn: boolean;
	loser: boolean;
	avatar: number; 
}

interface Lobby {
	lobbyId: string;
	host: string;
	players: Player[];
	maxPlayers: number;
}

interface Game {
	isActive: boolean;
	currentTurn: number;
	playerNumbers: Record<string, number>;
	isFirstTurn: boolean;
	startingNumber: number;
}

const lobbies: Lobby[] = [];

const games: { [lobbyId: string]: Game } = {};

function createLobbyId() {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

const MAX_PLAYERS = 10;

app.prepare().then(() => {
	const httpServer = createServer(handler);

	const io = new Server(httpServer, {
		cors: {
			origin: baseUrl,
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log(`User connected: connection id: ${socket.id}`);

		socket.on("createLobby", ({ nickname, avatar }: { nickname: string, avatar: number }) => {
			console.log(`Emitting createLobby event with nickname: ${nickname} and avatar: ${avatar}`);
			const lobbyId = createLobbyId();

			const player: Player = {
				host: true,
				nickname,
				lobbyId,
				socketId: socket.id,
				turn: false,
				loser: false,
				avatar,
			};

			const newLobby: Lobby = {
				lobbyId,
				host: nickname,
				players: [player],
				maxPlayers: MAX_PLAYERS,
			};

			lobbies.push(newLobby);

			socket.join(lobbyId);
			console.log(`Lobby created with ID: ${lobbyId} by ${nickname}`);
			console.log(`Lobbies:`, lobbies);

			socket.emit("lobbyCreated", { lobbyId, player });
		});

		socket.on("joinLobby", ({ nickname, lobbyId, avatar }: { nickname: string, lobbyId: string, avatar: number }) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				if (lobby.players.length >= lobby.maxPlayers) {
					socket.emit(
							"lobbyError",
							"Le lobby est plein. Impossible de rejoindre."
					);
					return;
				}

				const isNicknameInUse = lobby.players.some(
					(player) => player.nickname === nickname
				);

				if (isNicknameInUse) {
					socket.emit(
						"lobbyError",
						"Ce pseudo est déjà utilisé dans ce lobby."
					);
					return;
				}

				const player: Player = {
					host: false,
					nickname,
					lobbyId,
					socketId: socket.id,
					turn: false,
					loser: false,
					avatar,
				};

				lobby.players.push(player);
				socket.join(lobbyId);
				console.log(`Lobby rejoint avec l'ID: ${lobbyId} par ${nickname}`);
				io.to(lobbyId).emit("playerJoined", player);
				socket.emit("lobbyJoined", { lobbyId, player });
			} else {
				socket.emit("lobbyError", "Lobby not found");
			}
		});

		socket.on("getLobbyData", (lobbyId) => {
			const lobby = lobbies.find((lobby) => lobby.lobbyId === lobbyId);
			if (lobby) {
				socket.emit("lobbyData", lobby);
			} else {
				socket.emit("lobbyError", "Lobby not found or has been removed.");
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

					if (lobby.players.length === 0) {
						// Supprimer le lobby s'il n'y a plus de joueurs
						const lobbyIndex = lobbies.findIndex(
							(l) => l.lobbyId === lobby.lobbyId
						);
						if (lobbyIndex !== -1) {
							lobbies.splice(lobbyIndex, 1);
							console.log(`Lobby with ID: ${lobbyId} removed.`);
							delete games[lobby.lobbyId]; // Supprimer également le jeu associé
						}
					} else if (playerLeaving.host) {
						const newHost = lobby.players[0];
						newHost.host = true;
						io.to(lobbyId).emit("hostChanged", {
							newHost: newHost.nickname,
						});
					}

					socket.broadcast.to(lobbyId).emit("playerLeft", socket.id);
					console.log(`Player left the lobby: ${socket.id}`);
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
					startingNumber,
				};

				io.to(lobbyId).emit("gameStarted", {
					currentTurn: 0,
					startingNumber,
					players: lobby.players.map((player) => ({
						nickname: player.nickname,
						socketId: player.socketId,
						avatar: player.avatar, // Include avatar in the player data
					})),
				});
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

					if (game.isFirstTurn) {
						randomNum = Math.floor(Math.random() * game.startingNumber) + 1;
						game.isFirstTurn = false;
					} else {
						const previousPlayerSocketId =
							players[
								game.currentTurn === 0
									? players.length - 1
									: game.currentTurn - 1
							].socketId;
						const lastGeneratedNum = game.playerNumbers[previousPlayerSocketId];

						randomNum = Math.floor(Math.random() * lastGeneratedNum) + 1;
					}

					console.log(
						`Player: ${currentPlayer.nickname}, Random Number: ${randomNum}`
					);

					game.playerNumbers[currentPlayer.socketId] = randomNum;

					if (randomNum === 1) {
						game.isActive = false;
						currentPlayer.loser = true;
						io.to(lobbyId).emit("playerReachedOne", {
							playerName: currentPlayer.nickname,
							loserSocketId: currentPlayer.socketId,
						});
						setTimeout(() => {
							io.to(lobbyId).emit("gameOver", {
								loser: currentPlayer.nickname,
							});
						}, 6000);
						return;
					}

					game.currentTurn = (game.currentTurn + 1) % players.length;

					io.to(lobbyId).emit("turnChanged", {
						currentTurn: game.currentTurn,
						randomNum,
						socketId: currentPlayer.socketId,
					});

					io.to(lobbyId).emit("currentRoll", { randomNum });
				}
			}
		});

		socket.on("stopGame", (lobbyId) => {
			console.log(`Received stopGame event for lobby ${lobbyId}`);
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

			const lobby = lobbies.find((lobby) =>
				lobby.players.some((player) => player.socketId === socket.id)
			);

			if (lobby) {
				const playerLeaving = lobby.players.find(
					(player) => player.socketId === socket.id
				);

				if (playerLeaving) {
					lobby.players = lobby.players.filter(
						(player) => player.socketId !== socket.id
					);

					if (lobby.players.length === 0) {
						// Supprimer le lobby s'il n'y a plus de joueurs
						const lobbyIndex = lobbies.findIndex(
							(l) => l.lobbyId === lobby.lobbyId
						);
						if (lobbyIndex !== -1) {
							lobbies.splice(lobbyIndex, 1);
							console.log(`Lobby with ID: ${lobby.lobbyId} removed.`);
							delete games[lobby.lobbyId]; // Supprimer également le jeu associé
						}
					} else if (playerLeaving.host) {
						const newHost = lobby.players[0];
						newHost.host = true;
						io.to(lobby.lobbyId).emit("hostChanged", {
							newHost: newHost.nickname,
						});
					}

					const game = games[lobby.lobbyId];
					if (game && game.isActive) {
						if (lobby.players.length === 0) {
							game.isActive = false;
							delete games[lobby.lobbyId]; // Supprimer le jeu associé au lobby
							io.to(lobby.lobbyId).emit("gameOver", {
								message: "All players have left. The game is over.",
							});
							console.log(`Game in lobby ${lobby.lobbyId} has ended.`);
						}
					}

					socket.broadcast.to(lobby.lobbyId).emit("playerLeft", socket.id);
					console.log(`Player left the lobby: ${socket.id}`);
				}
			}
		});
	});

	httpServer
		.once("error", (err) => {
			console.error(err);
			process.exit(1);
		})
		.listen(port, () => {
			console.log(`> Ready on ${baseUrl}`);
		});
});
