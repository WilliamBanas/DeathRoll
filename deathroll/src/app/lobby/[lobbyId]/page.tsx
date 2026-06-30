"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/contexts/socket";
import GameUi from "@/components/GameUi";
import { Copy, LogOut } from "lucide-react";
import Image from "next/image";

import avatar1 from "../../assets/img/avatar1.png";
import avatar2 from "../../assets/img/avatar2.png";
import avatar3 from "../../assets/img/avatar3.png";
import avatar4 from "../../assets/img/avatar4.png";
import avatar5 from "../../assets/img/avatar5.png";
import avatar6 from "../../assets/img/avatar6.png";
import avatar7 from "../../assets/img/avatar7.png";
import avatar8 from "../../assets/img/avatar8.png";

import type { Lobby, Player, Game } from "../../../types/games";

export default function LobbyPage() {
	const router = useRouter();
	const { lobbyId } = useParams<{ lobbyId: string }>();

	const { socket, playerId } = useSocket(); // ✅ FIX IMPORTANT

	const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
	const [games, setGames] = useState<Record<string, Game>>({});
	const [startingNumber, setStartingNumber] = useState(100);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const isHost = lobbyData?.players.find((p) => p.playerId === playerId)?.host ?? false;

	const [dotCount, setDotCount] = useState(0);

	useEffect(() => {
		if (isHost) return;
		const interval = setInterval(() => {
			setDotCount((prev) => (prev + 1) % 4);
		}, 500);
		return () => clearInterval(interval);
	}, [isHost]);

	const avatars = [
		avatar1, avatar2, avatar3, avatar4,
		avatar5, avatar6, avatar7, avatar8,
	];

	/* SOCKET */
	useEffect(() => {
		if (!socket || !lobbyId) return;

		socket.emit("getLobbyData", lobbyId);
		socket.emit("reconnectLobby", { lobbyId, playerId });

		const onLobbyData = (data: any) => {
			setLobbyData(data);
			setLoading(false);
		};

		const onLobbyError = () => {
			setLoading(false);
		};

		const onPlayerJoined = (player: any) => {
			setLobbyData((prev) => {
				if (!prev) return { lobbyId, players: [player] };
				const exists = prev.players.find((p) => p.playerId === player.playerId);
				if (exists) return prev;
				return { ...prev, players: [...prev.players, player] };
			});
		};

		const onPlayerDisconnected = ({ playerId: id }: { playerId: string }) => {
			setLobbyData((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.map((p) =>
						p.playerId === id ? { ...p, connected: false } : p
					),
				};
			});
		};

		const onPlayerReconnected = ({ playerId: id }: { playerId: string }) => {
			setLobbyData((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.map((p) =>
						p.playerId === id ? { ...p, connected: true } : p
					),
				};
			});
		};

		const onGameStarted = ({ currentPlayerId, startingNumber }: any) => {
			setGames((prev) => ({
				...prev,
				[lobbyId]: {
					status: "PLAYING",
					currentPlayerId,
					startingNumber,
					isFirstTurn: true,
					playerNumbers: {},
					turnOrder: [],
				},
			}));
		};

		const onTurnChanged = ({ currentPlayerId }: any) => {
			setGames((prev) => ({
				...prev,
				[lobbyId]: {
					...prev[lobbyId],
					currentPlayerId,
				},
			}));
		};

		const onGameOver = () => {
			setGames((prev) => ({
				...prev,
				[lobbyId]: {
					...prev[lobbyId],
					status: "FINISHED",
				},
			}));
		};

		const onLobbyClosed = () => {
			localStorage.removeItem("lastLobbyId");
			router.push("/");
		};

		socket.on("lobbyData", onLobbyData);
		socket.on("lobbyError", onLobbyError);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playerDisconnected", onPlayerDisconnected);
		socket.on("playerReconnected", onPlayerReconnected);
		socket.on("gameStarted", onGameStarted);
		socket.on("turnChanged", onTurnChanged);
		socket.on("gameOver", onGameOver);
		socket.on("lobbyClosed", onLobbyClosed);

		return () => {
			socket.off("lobbyData", onLobbyData);
			socket.off("lobbyError", onLobbyError);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playerDisconnected", onPlayerDisconnected);
			socket.off("playerReconnected", onPlayerReconnected);
			socket.off("gameStarted", onGameStarted);
			socket.off("turnChanged", onTurnChanged);
			socket.off("gameOver", onGameOver);
			socket.off("lobbyClosed", onLobbyClosed);
		};
	}, [socket, lobbyId]);

	/* ACTIONS */
	const handlePlayerAction = () => {
		socket?.emit("playerAction", {
			lobbyId,
			playerId,
		});
	};

	const startGame = () => {
		socket?.emit("startGame", { lobbyId, startingNumber });
	};

	const leaveLobby = () => {
		socket?.emit("leaveLobby", lobbyId);
		localStorage.removeItem("lastLobbyId");
		router.push("/");
	};

	const copyLobbyLink = () => {
		navigator.clipboard.writeText(
			`${window.location.origin}/?lobbyId=${lobbyId}`
		);
	};

	/* UI */
	if (loading) return <div>Loading...</div>;
	if (error) return <div className="text-red-500">{error}</div>;

	if (games[lobbyId]?.status === "PLAYING") {
		return (
			<GameUi
				lobbyData={lobbyData}
				handlePlayerAction={handlePlayerAction}
				lobbyId={lobbyId}
				socket={socket}
				games={games}
				stopGame={() => socket?.emit("stopGame", lobbyId)}
				startingNumber={startingNumber}
				playerId={playerId}
			/>
		);
	}

	return (
		<main className="px-6 my-16">
			<div className="flex flex-col items-center gap-4">

				<div className="flex gap-4">

					{/* LEFT */}
					<div className="w-80">
						<div className="flex justify-between bg-base-200 p-3 rounded">
							<p>{lobbyId}</p>
							<button onClick={copyLobbyLink}>
								<Copy />
							</button>
						</div>

						<ul className="grid grid-cols-3 gap-2 mt-4">
							{Array.from({ length: 10 }).map((_, i) => {
								const player = lobbyData?.players[i];

								return (
									<li key={i} className={`bg-base-300 aspect-square rounded relative ${!player?.connected ? "opacity-40" : ""}`}>
										{player && (
											<div className="flex flex-col items-center justify-center size-full">
												{player.host && (
													<span className="badge badge-warning badge-xs absolute top-1">
														Host
													</span>
												)}
												{!player.connected && (
													<span className="badge badge-neutral badge-xs absolute top-1 right-1">
														Disconnected
													</span>
												)}
												<Image
													src={avatars[player.avatar - 1]}
													alt=""
													width={40}
													height={40}
												/>
												<p className="text-xs mt-1">{player.nickname}</p>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</div>

					{/* RIGHT */}
					<div className="w-80 bg-base-200 p-4 rounded">
						{isHost ? (
							<>
								<select
									value={startingNumber}
									onChange={(e) => setStartingNumber(Number(e.target.value))}
									className="select select-bordered w-full"
								>
									{Array.from({ length: 10 }, (_, i) => (i + 1) * 100).map(
										(v) => (
											<option key={v} value={v}>
												{v}
											</option>
										)
									)}
								</select>

								<button
									onClick={startGame}
									className="btn btn-secondary w-full mt-4"
								>
									Start Game
								</button>
							</>
						) : (
							<p className="text-center text-lg py-8">
								Waiting for host to start{".".repeat(dotCount)}
							</p>
						)}
					</div>
				</div>

				<button className="btn mt-4" onClick={leaveLobby}>
					<LogOut /> Leave
				</button>
			</div>
		</main>
	);
}