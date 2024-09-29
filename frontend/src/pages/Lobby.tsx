import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../contexts/socket";
import GameUi from "../components/GameUi";

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
}

const Lobby: React.FC = () => {
	const { lobbyId } = useParams<{ lobbyId: string }>();
	const socket = useSocket();
	const navigate = useNavigate();
	const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [games, setGames] = useState<{ [lobbyId: string]: Game }>({});
	const [playerNumbers, setPlayerNumbers] = useState<{
		[socketId: string]: number;
	}>({});

	const copyLobbyUrl = () => {
		const url = `${window.location.origin}/lobby/${lobbyId}`;
		navigator.clipboard.writeText(url);
		// Optionally, you can add a state to show a temporary "Copied!" message
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

						// Vérifier si le joueur qui est parti était l'hôte et assigner un nouvel hôte si nécessaire
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
			navigate("/");
		}
	};

	const startGame = () => {
		if (socket && lobbyId) {
			socket.emit("startGame", lobbyId);
			setGames((prevGames) => ({
				...prevGames,
				[lobbyId]: {
					currentTurn: 0,
					isActive: true,
					isFirstTurn: true,
					playerNumbers: {},
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
	if (error) return (
		<div className="flex flex-col items-center">
			<div className="text-red-500 mb-4">{error}</div>
			<Link to="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
				Return to Home
			</Link>
		</div>
	);

	return (
		<main className="flex flex-col items-center text-xl">
			<div className="flex items-center space-x-2">
				<h1>Lobby ID: {lobbyId}</h1>
				<button
					onClick={copyLobbyUrl}
					className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded text-sm"
				>
					Copy URL
				</button>
			</div>
			<h2>Players:</h2>
			<ul>
				{lobbyData?.players.map((player: Player) => (
					<li className="text-blue-500" key={player.socketId}>
						{player.nickname} {player.socketId === socket?.id ? " (You)" : ""}{" "}
						{player.host ? "(Host)" : ""}
					</li>
				))}
			</ul>

			{lobbyId && !games[lobbyId]?.isActive && (
				<>
					{isCurrentPlayerHost() ? (
						<button 
							onClick={startGame} 
							disabled={!canStartGame}
							className={`${!canStartGame ? 'opacity-50 cursor-not-allowed' : ''} bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4`}
						>
							Start Game
						</button>
					) : (
						<div className="text-gray-500 mt-4">
							Waiting for host to start game...
						</div>
					)}

					<button onClick={leaveLobby}>Leave Room</button>
				</>
			)}

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
		</main>
	);
};

export default Lobby;
