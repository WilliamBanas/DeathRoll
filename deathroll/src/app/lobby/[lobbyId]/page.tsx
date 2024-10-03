"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSocket } from "../../../contexts/socket";
import GameUi from "../../../components/GameUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, LogOut, Star, User } from "lucide-react";

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
	isFirstTurn: boolean;
	startingNumber: number; // Ajoutez le nombre de départ ici
}

const Lobby: React.FC = () => {
	const router = useRouter();
	const params = useParams();
	const lobbyId = params.lobbyId as string;
	const socket = useSocket();
	const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [games, setGames] = useState<{ [lobbyId: string]: Game }>({});
	const [playerNumbers, setPlayerNumbers] = useState<{
		[socketId: string]: number;
	}>({});
	const [startingNumber, setStartingNumber] = useState<number>(100);

	const copyLobbyId = () => {
		if (lobbyId) {
			navigator.clipboard.writeText(lobbyId);
		}
	};

	useEffect(() => {
		if (socket && lobbyId) {
			socket.emit("getLobbyData", lobbyId);

			socket.on("lobbyData", (data: Lobby) => {
				setLobbyData(data);
				setLoading(false);
			});

			socket.on("lobbyError", (message: string) => {
				setError(message);
				setLoading(false);
			});

			const handlePlayerJoined = (newPlayer: Player) => {
				setLobbyData((prevLobby) => {
					if (prevLobby) {
						const existingPlayer = prevLobby.players.find(
							(player) => player.socketId === newPlayer.socketId
						);
						if (!existingPlayer) {
							return {
								...prevLobby,
								players: [...prevLobby.players, newPlayer],
							};
						}
						return prevLobby;
					}
					return prevLobby;
				});
			};

			const handlePlayerLeft = (socketId: string) => {
				setLobbyData((prevLobby) => {
					if (prevLobby) {
						const updatedPlayers = prevLobby.players.filter(
							(player) => player.socketId !== socketId
						);

						if (
							prevLobby.players.some(
								(player) => player.socketId === socketId && player.host
							)
						) {
							const newHost = updatedPlayers[0];
							if (newHost) {
								newHost.host = true;
							}
						}

						return {
							...prevLobby,
							players: updatedPlayers,
							host: updatedPlayers[0]?.nickname || "",
						};
					}
					return prevLobby;
				});
			};

			socket.on("playerJoined", handlePlayerJoined);
			socket.on("playerLeft", handlePlayerLeft);

			socket.on("gameStarted", ({ currentTurn }) => {
				console.log(`Game started! Current turn: ${currentTurn}`);
				setGames((prevGames) => ({
					...prevGames,
					[lobbyId]: {
						currentTurn,
						isActive: true,
						isFirstTurn: true,
						playerNumbers: {},
					} as Game,
				}));
			});

			socket.on("turnChanged", ({ currentTurn, randomNum, socketId }) => {
				const currentPlayer = lobbyData?.players[currentTurn];
				if (currentPlayer && currentPlayer.socketId === socketId) {
					setPlayerNumbers((prevNumbers) => ({
						...prevNumbers,
						[socketId]: randomNum,
					}));
				}

				setGames((prevGames) => ({
					...prevGames,
					[lobbyId]: {
						...prevGames[lobbyId],
						currentTurn,
					},
				}));
			});

			socket.on("gameOver", () => {
				setGames((prevGames) => ({
					...prevGames,
					[lobbyId]: {
						...prevGames[lobbyId],
						isActive: false,
					},
				}));
			});
		}

		return () => {
			if (socket) {
				socket.off("lobbyData");
				socket.off("lobbyError");
				socket.off("playerJoined");
				socket.off("playerLeft");
				socket.off("gameStarted");
				socket.off("turnChanged");
			}
		};
	}, [socket, lobbyId, lobbyData?.players]);

	const leaveLobby = () => {
		if (socket) {
			socket.emit("leaveLobby", lobbyId);
			router.push("/");
		}
	};

	const startGame = () => {
		if (socket && lobbyId) {
			socket.emit("startGame", { lobbyId, startingNumber });
			setGames((prevGames) => ({
				...prevGames,
				[lobbyId]: {
					currentTurn: 0,
					isActive: true,
					isFirstTurn: true,
					playerNumbers: {},
					startingNumber, // Ajoutez le nombre de départ ici
				} as Game,
			}));
		}
	};

	const handlePlayerAction = () => {
		if (socket) {
			socket.emit("playerAction", lobbyId);
		}
	};

	const isCurrentPlayerHost = () => {
		const currentPlayer = lobbyData?.players.find(
			(player) => player.socketId === socket?.id
		);
		return currentPlayer?.host;
	};

	const canStartGame = lobbyData && lobbyData.players.length > 1;

	const stopGame = () => {
		if (socket && lobbyId) {
			console.log("Emitting stopGame event"); // Ajoutez ce log
			socket.emit("stopGame", lobbyId);
		}
	};

	if (loading) return <div>Loading room data...</div>;
	if (error)
		return (
			<div className="flex flex-col items-center">
				<div className="text-red-500 mb-4">{error}</div>
				<Link href="/">
					<Button>Return to Home</Button>
				</Link>
			</div>
		);

	return (
		<main className="min-h-dvh flex flex-col items-center bg-background">
			<div className="flex justify-center gap-6 w-2/3">
				<div className="bg-card rounded p-6 h-fit w-96 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<p className="text-2xl">{lobbyId}</p>
						<Button variant="ghost" className="rounded" onClick={copyLobbyId}>
							<Copy className="w-4" />
						</Button>
					</div>

					{lobbyId && !games[lobbyId]?.isActive && (
						<>
							{isCurrentPlayerHost() ? (
								<>
									<Input
										type="number"
										value={startingNumber}
										onChange={(e) => setStartingNumber(Number(e.target.value))}
										min="1"
										className="mb-2 p-2 border rounded"
										placeholder="Starting number"
									/>
									<Button className="rounded" onClick={startGame} disabled={!canStartGame}>
										Start Game
									</Button>
								</>
							) : (
								<div className="text-gray-500 mt-4">
									Waiting for host to start game...
								</div>
							)}

							<Button variant="outline" className="rounded" onClick={leaveLobby}>
              <LogOut className="w-4" />Leave 
							</Button>
						</>
					)}
				</div>
				<div className="bg-card rounded p-6 h-fit w-96 flex flex-col gap-3">
					<h2>Players:</h2>
					<ul>
						{lobbyData?.players.map((player: Player) => (
							<li className="flex items-center gap-2" key={player.socketId}>
								<p>{player.nickname}</p>
								{player.socketId === socket?.id ? <User className="w-4" /> : null}
								{player.host ? <Star className="w-4" /> : null}
							</li>
						))}
					</ul>
				</div>

				{lobbyId && games[lobbyId]?.isActive ? (
					<GameUi
						lobbyData={lobbyData}
						handlePlayerAction={handlePlayerAction}
						lobbyId={lobbyId}
						socket={socket}
						games={games}
						stopGame={stopGame}
					/>
				) : null}
			</div>
		</main>
	);
};

export default Lobby;
