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
	stopGame: () => void; // Nouvelle prop pour arrêter le jeu
}

const GameUi: React.FC<GameUiProps> = ({
	lobbyData,
	lobbyId,
	socket,
	handlePlayerAction,
	games,
	stopGame, // Nouvelle prop
}) => {
	const game = lobbyId ? games[lobbyId] : null;
	const [rangeEnd, setRangeEnd] = useState<number>(100); // Default rangeEnd is 100
	const [currentRoll, setCurrentRoll] = useState<number | null>(null); // State to track current roll
	const isGameOver = game ? !game.isActive : false;
	const currentPlayer =
		game && lobbyData ? lobbyData.players[game.currentTurn] : null;
	const isMyTurn = currentPlayer?.socketId === socket?.id;
	const loser = lobbyData?.players.find(player => player.loser);
	const [reachedOneMessage, setReachedOneMessage] = useState<string | null>(null);

	const isHost = lobbyData?.players.find(player => player.socketId === socket?.id)?.host;

	useEffect(() => {
		console.log("Game state:", { isGameOver, loser, lobbyData, game });
	}, [isGameOver, loser, lobbyData, game]);

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

			const handlePlayerReachedOne = ({ playerName, loserSocketId }: { playerName: string, loserSocketId: string }) => {
				if (loserSocketId === socket.id) {
					setReachedOneMessage("You lost!");
				} else {
					setReachedOneMessage(`${playerName} has reached 1!`);
				}
			};

			socket.on("turnChanged", handleTurnChanged);
			socket.on("currentRoll", handleCurrentRoll); // Listen to the current roll
			socket.on("playerReachedOne", handlePlayerReachedOne);

			return () => {
				socket.off("turnChanged", handleTurnChanged);
				socket.off("currentRoll", handleCurrentRoll);
				socket.off("playerReachedOne", handlePlayerReachedOne);
			};
		}
	}, [socket]);

	if (reachedOneMessage) {
		return (
			<div style={{ textAlign: 'center', marginTop: '50px' }}>
				<h1>{reachedOneMessage}</h1>
			</div>
		);
	}

	const handleStopGame = () => {
		console.log("Stop game button clicked"); // Ajoutez ce log
		stopGame();
	};

	return (
		<div>
			{!isGameOver ? (
				<>
					{isMyTurn ? (
						<div>
							<h3>It's your turn!</h3>
							<div>
								<h4>Current roll: {currentRoll !== null ? currentRoll : 'N/A'}</h4>
							</div>
							<button onClick={handlePlayerAction}>Generate Random Number</button>
						</div>
					) : (
						<div>
							<h3>{currentPlayer?.nickname}'s turn</h3>
							<div>
								<h4>Current roll: {currentRoll !== null ? currentRoll : 'N/A'}</h4>
							</div>
						</div>
					)}
					{isHost && (
						<button onClick={handleStopGame} style={{ marginTop: '20px', color: 'red' }}>
							Return to Lobby
						</button>
					)}
				</>
			) : (
				<div>
					<h3>Game Over</h3>
					{loser ? (
						loser.socketId === socket?.id ? (
              <div>
                <p>You lost!</p>
                <p>Redirecting to lobby...</p>
              </div>
						) : (
              <div>
                <p>{loser.nickname} lost the game.</p>
                <p>Redirecting to lobby...</p>
              </div>
						)
					) : (
						<p>The game has ended.</p>
					)}
				</div>
			)}
		</div>
	);
};

export default GameUi;
