"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useSocket } from "../../../contexts/socket";
import GameUi from "../../../components/GameUi";
import { Copy, Crown, LogOut } from "lucide-react";
import Image from "next/image";
import avatar1 from "../../assets/img/avatar1.png";
import avatar2 from "../../assets/img/avatar2.png";
import avatar3 from "../../assets/img/avatar3.png";
import avatar4 from "../../assets/img/avatar4.png";
import avatar5 from "../../assets/img/avatar5.png";
import avatar6 from "../../assets/img/avatar6.png";
import avatar7 from "../../assets/img/avatar7.png";
import avatar8 from "../../assets/img/avatar8.png";

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
	const [gameStartingNumber, setGameStartingNumber] = useState<number | null>(
		null
	);
	const pathname = usePathname();

	const copyLobbyLink = () => {
		if (lobbyId) {
			const link = `${window.location.origin}/?lobbyId=${lobbyId}`;
			navigator.clipboard.writeText(link);
		}
	};

	const avatars = [
		avatar1,
		avatar2,
		avatar3,
		avatar4,
		avatar5,
		avatar6,
		avatar7,
		avatar8,
	];

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
				console.log(
					`Game started! Current turn: ${currentTurn}, Starting number: ${startingNumber}`
				);
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
					<button>Return to Home</button>
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
				<main className="px-6 my-16">
					<div className="flex flex-col items-center gap-4 w-full m-auto">
						<div className="mb-24 flex flex-col gap-4 lg:flex-row">
							<div className="min-w-80 max-w-80 flex flex-col gap-4 w-full">
								<div className="bg-base-200 rounded-md px-6 py-4 w-full h-fit flex items-center justify-between gap-4">
									<p className="text-2xl">{lobbyId}</p>
									<button
										className="btn bg-base-200 border-none w-fit"
										onClick={copyLobbyLink}
									>
										<Copy className="w-5" />
									</button>
								</div>
								<div className="flex flex-col gap-2">
									<div className="flex justify-between items-center w-full p-2">
										<h2 className="text-2xl">Players</h2>
										<span className="text-lg font-semibold bg-base-200 px-3 py-1 rounded-md">
											{lobbyData?.players.length || 0}/10
										</span>
									</div>
									<div className="overflow-x-auto w-full">
										<ul className="h-64 lg:h-fit grid grid-cols-3 gap-2">
											{Array.from({ length: 10 }).map((_, index) => {
												const player = lobbyData?.players[index];
												return (
													<li
														className="flex items-center aspect-square"
														key={index}
													>
														<div className="bg-base-200 rounded-md w-full h-full flex items-center justify-center p-2 overflow-hidden">
															{player ? (
																<div className="w-full flex flex-col items-center">
																	<Image
																		src={avatars[player.avatar - 1]}
																		alt={`Avatar ${player.avatar}`}
																		width={50}
																		className="rounded-full"
																	/>
																	<div className="w-full flex items-center justify-center gap-2">
																		{player.host && (
																			<Crown
																				className={`w-3 flex-shrink-0 ${"fill-[#FFD700] stroke-[#FFD700]"}`}
																				fill="currentColor"
																				stroke="currentColor"
																			/>
																		)}
																		<p
																			className={`text-md font-bold truncate ${
																				player.socketId === socket?.id
																					? "text-primary"
																					: ""
																			}`}
																		>
																			{player.nickname}
																		</p>
																	</div>
																</div>
															) : null}
														</div>
													</li>
												);
											})}
										</ul>
									</div>
								</div>
							</div>

							<div className="bg-base-200 rounded-md p-6 min-w-80 max-w-80 h-fit flex flex-col gap-4">
								{lobbyId && !games[lobbyId]?.isActive && (
									<>
										{isCurrentPlayerHost() ? (
											<>
												<h3 className="text-2xl mb-8">Game settings :</h3>
												<div className="flex items-center justify-between gap-4 mb-12">
													<label className="text-md w-fit">
														Default value :
													</label>
													<select
														className="select select-bordered select-sm"
														value={startingNumber.toString()}
														onChange={(e) =>
															setStartingNumber(Number(e.target.value))
														}
													>
														{Array.from(
															{ length: 100 },
															(_, i) => (i + 1) * 100
														).map((value) => (
															<option key={value} value={value.toString()}>
																{value}
															</option>
														))}
													</select>
												</div>
												<div>
													<button
														className="btn btn-secondary w-full"
														onClick={startGame}
														disabled={!canStartGame}
													>
														Start Game
													</button>
												</div>
											</>
										) : (
											<div className="text-gray-500 text-md">
												Waiting for the host to start game{dots}
											</div>
										)}
									</>
								)}
							</div>
						</div>
						<button
							className="btn btn-outline flex gap-2 "
							onClick={leaveLobby}
						>
							<LogOut className="w-4" />
							<p>Leave</p>
						</button>
					</div>
				</main>
			)}
		</>
	);
};

export default Lobby;
