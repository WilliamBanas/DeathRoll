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
	playerNumbers: { [socketId: string]: number };
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
	const [loserMessage, setLoserMessage] = useState<string | null>(null); // Add state for loser message
	const [rangeStart, setRangeStart] = useState<number>(1);
	const [rangeEnd, setRangeEnd] = useState<number>(100);
	const isGameOver = game ? !game.isActive : false;
	const currentPlayer =
		game && lobbyData ? lobbyData.players[game.currentTurn] : null;
	const isMyTurn = currentPlayer?.socketId === socket?.id;

	useEffect(() => {
		if (socket) {
			const handleTurnChanged = ({
				currentTurn,
				randomNum,
				rangeStart,
				rangeEnd,
			}: {
				currentTurn: number;
				randomNum: number;
				rangeStart: number;
				rangeEnd: number;
			}) => {
				setRangeStart(rangeStart);
				setRangeEnd(rangeEnd);
			};

			const handleLoserAnnouncement = (loserNickname: string) => {
				console.log(`Loser announced: ${loserNickname}`);
				setLoserMessage(`${loserNickname} has lost!`);
			};

			socket.on("turnChanged", handleTurnChanged);
			socket.on("loserAnnouncement", handleLoserAnnouncement);

			return () => {
				socket.off("turnChanged", handleTurnChanged);
				socket.off("loserAnnouncement", handleLoserAnnouncement);
			};
		}
	}, [socket]);

	return (
		<div>
			{/* Display information about whose turn it is */}
			{!isGameOver && currentPlayer && (
				<div>
					{/* If it's the current player's turn */}
					{isMyTurn ? (
						<div>
							<h3>It's your turn!</h3>
							<p>
								{rangeStart} - {rangeEnd}
							</p>
							<button onClick={handlePlayerAction}>
								Generate Random Number
							</button>
						</div>
					) : (
						<div>
							<h3>{currentPlayer.nickname}'s turn</h3>
							<span>{rangeStart} - {rangeEnd}</span>
							<p>Waiting for them to roll</p>
						</div>
					)}
				</div>
			)}

			{/* Display the loser message if the game is over */}
			{loserMessage && <div>{loserMessage}</div>}
		</div>
	);
};

export default GameUi;