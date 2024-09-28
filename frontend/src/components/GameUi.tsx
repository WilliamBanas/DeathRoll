import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

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
}

interface GameUiProps {
	lobbyData: Lobby | null;
	handlePlayerAction: () => void;
	lobbyId: string | undefined;
	socket: Socket | null;
	games: { [lobbyId: string]: Game };
	playerNumbers: { [socketId: string]: number };
}

const GameUi: React.FC<GameUiProps> = ({
	lobbyData,
	lobbyId,
	socket,
	handlePlayerAction,
	games,
	playerNumbers,
}) => {
	const game = lobbyId ? games[lobbyId] : null;
	const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
	const [loserMessage, setLoserMessage] = useState<string | null>(null); // Add state for loser message
	const isGameOver = game ? !game.isActive : false;
	const isMyTurn =
		game &&
		lobbyData &&
		lobbyData.players[game.currentTurn]?.socketId === socket?.id;

	useEffect(() => {
		if (socket) {
			socket.on("loserAnnouncement", (loserNickname) => {
				setLoserMessage(`${loserNickname} has lost!`);
				const timer = setTimeout(() => {
					setLoserMessage(null);
				}, 5000); // Display for 5 seconds
				return () => clearTimeout(timer); // Cleanup timer on component unmount
			});
		}
	}, [socket]);

	useEffect(() => {
		if (socket) {
			socket.on("loserAnnouncement", (loserNickname) => {
				setLoserMessage(`${loserNickname} has lost!`);
				const timer = setTimeout(() => {
					setLoserMessage(null);
				}, 5000); // Display for 5 seconds
				return () => clearTimeout(timer); // Cleanup timer on component unmount
			});
		}
	}, [socket]);

	return (
		<>
			{loserMessage && <h2>{loserMessage}</h2>} {/* Display loser message */}
			{gameOverMessage ? (
				<h2>{gameOverMessage}</h2>
			) : (
				<div>
					<h2>Players can generate numbers. First player to reach 1 loses !</h2>

					{isMyTurn ? (
						<div key={socket?.id}>
							<h3>Your Turn!</h3>
							<button onClick={handlePlayerAction}>
								Generate Random Number
							</button>
						</div>
					) : (
						game && (
							<div>
								<h3>
									{lobbyData?.players[game.currentTurn]?.nickname}'s Turn!
									Waiting for them to generate a number...
								</h3>
							</div>
						)
					)}
				</div>
			)}
		</>
	);
};

export default GameUi;
