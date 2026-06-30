import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local",
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
  playerId: string;
  socketId: string;
  nickname: string;
  host: boolean;
  avatar: number;
  loser: boolean;
  connected: boolean;
  ready: boolean;
  returnedToLobby: boolean;
}

interface GameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  turnOrder: string[];
  currentPlayerId: string | null;
  startingNumber: number | null;
  isFirstTurn: boolean;
  playerNumbers: Record<string, number>;
}

interface LobbySession {
  lobbyId: string;
  players: Map<string, Player>;
  game: GameState;
}

const sessions = new Map<string, LobbySession>();
const MAX_PLAYERS = 10;

function createLobbyId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let res = "";
  for (let i = 0; i < 6; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

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

    socket.on("createLobby", ({ nickname, avatar, playerId }) => {
      const lobbyId = createLobbyId();

      const player: Player = {
        playerId,
        socketId: socket.id,
        nickname,
        host: true,
        avatar,
        loser: false,
        connected: true,
        ready: false,
        returnedToLobby: false,
      };

      const session: LobbySession = {
        lobbyId,
        players: new Map([[playerId, player]]),
        game: {
          status: "WAITING",
          turnOrder: [],
          currentPlayerId: null,
          startingNumber: null,
          isFirstTurn: true,
          playerNumbers: {},
        },
      };

      sessions.set(lobbyId, session);
      socket.join(lobbyId);

      socket.emit("lobbyCreated", { lobbyId, player });
    });

    socket.on("joinLobby", ({ nickname, avatar, lobbyId, playerId }) => {
      const session = sessions.get(lobbyId);
      if (!session) return socket.emit("lobbyError", "Lobby not found");

      const existing = session.players.get(playerId);

      if (existing) {
        const roomSockets = io.sockets.adapter.rooms.get(lobbyId);
        const oldSocketConnected = roomSockets?.has(existing.socketId) ?? false;

        if (oldSocketConnected) {
          const newPlayerId = playerId + "-" + Date.now();

          const player: Player = {
            playerId: newPlayerId,
            socketId: socket.id,
            nickname,
            host: false,
            avatar,
            loser: false,
            connected: true,
            ready: false,
            returnedToLobby: false,
          };

          session.players.set(newPlayerId, player);
          socket.join(lobbyId);

          io.to(lobbyId).emit("playerJoined", player);

          socket.emit("lobbyJoined", {
            lobbyId,
            player,
            reconnect: false,
            assignedPlayerId: newPlayerId,
          });

          return;
        }

        existing.socketId = socket.id;
        existing.connected = true;

        socket.join(lobbyId);

        socket.emit("lobbyJoined", {
          lobbyId,
          player: existing,
          reconnect: true,
        });

        io.to(lobbyId).emit("playerReconnected", {
          playerId,
        });

        return;
      }

      if (session.players.size >= MAX_PLAYERS) {
        return socket.emit("lobbyError", "Lobby is full");
      }

      const isUsed = [...session.players.values()].some(
        (p) => p.nickname === nickname
      );

      if (isUsed) {
        return socket.emit("lobbyError", "Nickname already used");
      }

      const player: Player = {
        playerId,
        socketId: socket.id,
        nickname,
        host: false,
        avatar,
        loser: false,
        connected: true,
        ready: false,
        returnedToLobby: false,
      };

      session.players.set(playerId, player);

      socket.join(lobbyId);

      io.to(lobbyId).emit("playerJoined", player);

      socket.emit("lobbyJoined", {
        lobbyId,
        player,
        reconnect: false,
      });
    });

    socket.on("getLobbyData", (lobbyId) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      socket.emit("lobbyData", {
        lobbyId,
        players: [...session.players.values()],
        game: session.game,
      });
    });

    socket.on("reconnectLobby", ({ lobbyId, playerId }: { lobbyId: string; playerId: string }) => {
      const session = sessions.get(lobbyId);
      if (!session) {
        socket.emit("lobbyError", "Lobby not found");
        return;
      }

      const player = session.players.get(playerId);
      if (!player) {
        socket.emit("lobbyError", "Player not found in this lobby");
        return;
      }

      player.socketId = socket.id;
      player.connected = true;

      socket.join(lobbyId);

      socket.emit("lobbyJoined", {
        lobbyId,
        player,
        reconnect: true,
      });

      io.to(lobbyId).emit("playerReconnected", { playerId });
    });

    socket.on("leaveLobby", (lobbyId: string) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      for (const [playerId, player] of session.players) {
        if (player.socketId === socket.id) {
          session.players.delete(playerId);

          io.to(lobbyId).emit("playerLeft", { playerId });

          if (session.players.size === 0) {
            io.to(lobbyId).emit("lobbyClosed");
            sessions.delete(lobbyId);
          } else if (player.host) {
            const nextHost = [...session.players.values()].find((p) => p.connected);
            if (nextHost) {
              nextHost.host = true;
              io.to(lobbyId).emit("newHost", { playerId: nextHost.playerId });
            }
          }

          return;
        }
      }
    });

    socket.on("toggleReady", (lobbyId: string) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      for (const player of session.players.values()) {
        if (player.socketId === socket.id) {
          player.ready = !player.ready;
          io.to(lobbyId).emit("playerReady", {
            playerId: player.playerId,
            ready: player.ready,
          });
          return;
        }
      }
    });

    socket.on("startGame", ({ lobbyId, startingNumber }) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      const players = [...session.players.values()].filter((p) => p.connected);

      if (players.length < 2) {
        socket.emit("lobbyError", "Not enough connected players to start");
        return;
      }

      const allReady = players.every((p) => p.ready);
      if (!allReady) {
        socket.emit("lobbyError", "Not all players are ready");
        return;
      }

      for (const p of session.players.values()) {
        p.ready = false;
        p.returnedToLobby = false;
        p.loser = false;
      }

      const turnOrder = players
        .map((p) => p.playerId)
        .sort(() => Math.random() - 0.5);

      session.game = {
        status: "PLAYING",
        turnOrder,
        currentPlayerId: turnOrder[0],
        startingNumber,
        isFirstTurn: true,
        playerNumbers: {},
      };

      io.to(lobbyId).emit("gameStarted", {
        startingNumber,
        currentPlayerId: turnOrder[0],
        players,
      });
    });

    socket.on("playerAction", ({ lobbyId, playerId }) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      const game = session.game;
      if (game.status !== "PLAYING") return;

      if (game.currentPlayerId !== playerId) return;

      const player = session.players.get(playerId);
      if (!player) return;

      let randomNum: number;

      if (game.isFirstTurn) {
        randomNum =
          Math.floor(Math.random() * game.startingNumber!) + 1;
        game.isFirstTurn = false;
      } else {
        const idx = game.turnOrder.indexOf(playerId);
        const prevId =
          game.turnOrder[
            (idx - 1 + game.turnOrder.length) %
              game.turnOrder.length
          ];

        const last = game.playerNumbers[prevId];
        randomNum = Math.floor(Math.random() * last) + 1;
      }

      game.playerNumbers[playerId] = randomNum;

      if (randomNum === 1) {
        game.status = "FINISHED";
        player.loser = true;

        io.to(lobbyId).emit("gameOver", {
          loser: player.nickname,
        });

        return;
      }

      const idx = game.turnOrder.indexOf(playerId);
      game.currentPlayerId =
        game.turnOrder[(idx + 1) % game.turnOrder.length];

      io.to(lobbyId).emit("turnChanged", {
        currentPlayerId: game.currentPlayerId,
        randomNum,
      });
    });

    socket.on("stopGame", (lobbyId: string) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      session.game = {
        status: "WAITING",
        turnOrder: [],
        currentPlayerId: null,
        startingNumber: null,
        isFirstTurn: true,
        playerNumbers: {},
      };

      for (const player of session.players.values()) {
        player.loser = false;
        player.ready = false;
        player.returnedToLobby = false;
      }

      io.to(lobbyId).emit("gameReset");
    });

    socket.on("returnToLobby", (lobbyId: string) => {
      const session = sessions.get(lobbyId);
      if (!session) return;

      for (const player of session.players.values()) {
        if (player.socketId === socket.id) {
          player.returnedToLobby = true;
          io.to(lobbyId).emit("playerReturned", {
            playerId: player.playerId,
          });

          const allReturned = [...session.players.values()].every(
            (p) => p.returnedToLobby
          );

          if (allReturned) {
            session.game = {
              status: "WAITING",
              turnOrder: [],
              currentPlayerId: null,
              startingNumber: null,
              isFirstTurn: true,
              playerNumbers: {},
            };
            for (const p of session.players.values()) {
              p.loser = false;
              p.ready = false;
            }
            io.to(lobbyId).emit("gameReset");
          }

          return;
        }
      }
    });

    socket.on("disconnect", () => {
      for (const session of sessions.values()) {
        for (const player of session.players.values()) {
          if (player.socketId === socket.id) {
            player.connected = false;

            io.to(session.lobbyId).emit("playerDisconnected", {
              playerId: player.playerId,
            });

            const allDisconnected = [...session.players.values()].every(
              (p) => !p.connected
            );

            if (allDisconnected) {
              io.to(session.lobbyId).emit("lobbyClosed");
              sessions.delete(session.lobbyId);
              console.log(`Lobby ${session.lobbyId} has been deleted due to no player left`)
            } else if (player.host) {
              player.host = false;
              const nextHost = [...session.players.values()].find(
                (p) => p.connected
              );
              if (nextHost) {
                nextHost.host = true;
                io.to(session.lobbyId).emit("newHost", {
                  playerId: nextHost.playerId,
                });
              }
            }

            return;
          }
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on ${baseUrl}`);
  });
});