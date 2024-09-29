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
	isFirstTurn: boolean;
}

interface GameUiProps {
	lobbyData: Lobby | null;
	handlePlayerAction: () => void;
	lobbyId: string | undefined;
	socket: Socket | null;
	games: { [lobbyId: string]: Game };
}

const GameUi: React.FC<GameUiProps> = ({
	lobbyData,
	lobbyId,
	socket,
	handlePlayerAction,
	games,
}) => {
	const game = lobbyId ? games[lobbyId] : null;
	const [loserMessage, setLoserMessage] = useState<string | null>(null);
	const [rangeEnd, setRangeEnd] = useState<number>(100); // Default rangeEnd is 100
	const [currentRoll, setCurrentRoll] = useState<number | null>(null); // State to track current roll
	const isGameOver = game ? !game.isActive : false;
	const currentPlayer =
		game && lobbyData ? lobbyData.players[game.currentTurn] : null;
	const isMyTurn = currentPlayer?.socketId === socket?.id;

	useEffect(() => {
		if (socket) {
			const handleTurnChanged = ({
				currentTurn,
				randomNum,
				socketId,
				lastGeneratedNum,
			}: {
				currentTurn: number;
				randomNum: number;
				socketId: string;
				lastGeneratedNum: number;
			}) => {
				console.log(
					`Received turnChanged: currentTurn = ${currentTurn}, lastGeneratedNum = ${lastGeneratedNum}`
				);
				setRangeEnd(lastGeneratedNum); // Update rangeEnd with last generated number
			};

			const handleCurrentRoll = ({ randomNum }: { randomNum: number }) => {
				setCurrentRoll(randomNum); // Update current roll for all players
			};

			socket.on("turnChanged", handleTurnChanged);
			socket.on("currentRoll", handleCurrentRoll); // Listen to the current roll

			return () => {
				socket.off("turnChanged", handleTurnChanged);
				socket.off("currentRoll", handleCurrentRoll);
			};
		}
	}, [socket]);

	return (
		<div>
			{isMyTurn ? (
				<div>
					<h3>It's your turn!</h3>
					{currentRoll !== null && (
						<div>
							<h4>Current roll: {currentRoll}</h4>{" "}
							{/* Display the current roll */}
						</div>
					)}
					<button onClick={handlePlayerAction}>Generate Random Number</button>
				</div>
			) : (
				<div>
					<h3>{currentPlayer?.nickname}'s turn</h3>
					{currentRoll !== null && (
						<div>
							<h4>Current roll: {currentRoll}</h4>{" "}
							{/* Display the current roll */}
						</div>
					)}
				</div>
			)}

			{loserMessage && <div>{loserMessage}</div>}
		</div>
	);
};

export default GameUi;
