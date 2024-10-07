"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSocket } from "../../../contexts/socket";
import GameUi from "../../../components/GameUi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Crown, LogOut } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
	startingNumber: number;
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
	const [startingNumber, setStartingNumber] = useState<number>(100);
	const [dots, setDots] = useState("");
	const [gameStartingNumber, setGameStartingNumber] = useState<number | null>(null);

	const copyLobbyId = () => {
		if (lobbyId) {
			navigator.clipboard.writeText(lobbyId);
		}
	};

	useEffect(() => {
		const interval = setInterval(() => {
			setDots((prevDots) => {
				if (prevDots.length >= 3) return "";
				return prevDots + ".";
			});
		}, 500);

		return () => clearInterval(interval);
	}, []);

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

			socket.on("gameStarted", ({ currentTurn, startingNumber }) => {
				console.log(`Game started! Current turn: ${currentTurn}, Starting number: ${startingNumber}`);
				setGames((prevGames) => ({
					...prevGames,
					[lobbyId]: {
						currentTurn,
						isActive: true,
						isFirstTurn: true,
						playerNumbers: {},
						startingNumber,
					} as Game,
				}));
				setGameStartingNumber(startingNumber);
			});

			socket.on("turnChanged", ({ currentTurn }) => {
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
				socket.off("gameOver");
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
			console.log("Emitting stopGame event");
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
		<>
			{lobbyId && games[lobbyId]?.isActive ? (
				<GameUi
					lobbyData={lobbyData}
					handlePlayerAction={handlePlayerAction}
					lobbyId={lobbyId}
					socket={socket}
					games={games}
					stopGame={stopGame}
					startingNumber={gameStartingNumber || startingNumber}
				/>
			) : (
				<main className="px-6">
					<div className="flex flex-col items-center gap-4 w-full m-auto max-w-96 mt-32">
						<div className="flex flex-col gap-4 w-full">
							<div className="bg-primary/10 rounded px-6 py-4 w-full h-fit flex items-center justify-between gap-4">
								<p className="text-2xl">{lobbyId}</p>
								<Button
									variant="ghost"
									className="rounded hover:bg-transparent w-fit p-0"
									onClick={copyLobbyId}
								>
									<Copy className="w-5" />
								</Button>
							</div>
							<div className="rounded p-1 w-full bg-gradient">
								<div className="bg-background rounded border-2">
									<h2 className="text-xl w-full text-center p-2">Players</h2>
									<ul className="h-fit grid grid-cols-2 gap-x-4 gap-y-2 p-4">
										{Array.from({ length: 10 }).map((_, index) => {
											const player = lobbyData?.players[index];
											return (
												<li
													className="flex items-center gap-2 h-10"
													key={index}
												>
													<div className="w-full h-full bg-card rounded-sm flex items-center gap-2 px-2 overflow-hidden">
														{player ? (
															<>
																{player.host && (
																	<Crown
																		className={`w-4 h-4 flex-shrink-0 ${
																			player.socketId === socket?.id
																				? "fill-[#FFD700] stroke-[#FFD700]"
																				: "fill-[#FFD700] stroke-[#FFD700]"
																		}`}
																		fill="currentColor"
																		stroke="currentColor"
																	/>
																)}
																<p
																	className={`text-lg font-bold truncate ${
																		player.socketId === socket?.id
																			? "text-primary"
																			: ""
																	}`}
																>
																	{player.nickname}
																</p>
															</>
														) : null}
													</div>
												</li>
											);
										})}
									</ul>
								</div>
							</div>
						</div>
						<div className="bg-card border rounded px-6 py-4 w-full h-fit flex flex-col gap-4">
							{lobbyId && !games[lobbyId]?.isActive && (
								<>
									{isCurrentPlayerHost() ? (
										<>
											<div className="flex items-center justify-between gap-4">
												<Label className="text-md w-fit">Default value :</Label>
												<Select
													value={startingNumber.toString()}
													onValueChange={(value) =>
														setStartingNumber(Number(value))
													}
												>
													<SelectTrigger className="w-32 rounded ">
														<SelectValue placeholder="Select starting number" />
													</SelectTrigger>
													<SelectContent className="bg-background rounded">
														{Array.from(
															{ length: 100 },
															(_, i) => (i + 1) * 100
														).map((value) => (
															<SelectItem key={value} value={value.toString()}>
																{value}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Button
													className="rounded w-full"
													onClick={startGame}
													disabled={!canStartGame}
												>
													Start Game
												</Button>
											</div>
										</>
									) : (
										<div className="text-gray-500 text-xl">
											Waiting for host to start game{dots}
										</div>
									)}

									<Button
										variant="outline"
										className="rounded flex gap-2"
										onClick={leaveLobby}
									>
										<LogOut className="w-4" />
										<p>Leave</p>
									</Button>
								</>
							)}
						</div>
					</div>
				</main>
			)}
		</>
	);
};

export default Lobby;