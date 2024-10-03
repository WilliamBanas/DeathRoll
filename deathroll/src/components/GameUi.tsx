import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";

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
	stopGame: () => void; 
}

const GameUi: React.FC<GameUiProps> = ({
	lobbyData,
	lobbyId,
	socket,
	handlePlayerAction,
	games,
	stopGame,
}) => {
	const game = lobbyId ? games[lobbyId] : null;
	const [currentRoll, setCurrentRoll] = useState<number | null>(null);
	const isGameOver = game ? !game.isActive : false;
	const currentPlayer =
		game && lobbyData ? lobbyData.players[game.currentTurn] : null;
	const isMyTurn = currentPlayer?.socketId === socket?.id;
	const loser = lobbyData?.players.find(player => player.loser);
	const [reachedOneMessage, setReachedOneMessage] = useState<string | null>(null);

	const isHost = lobbyData?.players.find(player => player.socketId === socket?.id)?.host;

	useEffect(() => {
		if (socket) {
			const handleGameStarted = ({ startingNumber }: { startingNumber: number }) => {
				console.log(`Game started with starting number: ${startingNumber}`);
			};

			const handleTurnChanged = ({
				currentTurn,
				randomNum,
			}: {
				currentTurn: number;
				randomNum: number;
				socketId: string;
			}) => {
				console.log(`Turn changed: currentTurn = ${currentTurn}, randomNum = ${randomNum}`);
				setCurrentRoll(randomNum);
			};

			const handlePlayerReachedOne = ({ playerName, loserSocketId }: { playerName: string, loserSocketId: string }) => {
				if (loserSocketId === socket.id) {
					setReachedOneMessage("You lost!");
				} else {
					setReachedOneMessage(`${playerName} has reached 1!`);
				}
			};

			const handleCurrentRoll = ({ randomNum }: { randomNum: number }) => {
				console.log(`Current roll: ${randomNum}`);
				setCurrentRoll(randomNum);
			};

			socket.on("gameStarted", handleGameStarted);
			socket.on("turnChanged", handleTurnChanged);
			socket.on("playerReachedOne", handlePlayerReachedOne);
			socket.on("currentRoll", handleCurrentRoll);

			return () => {
				socket.off("gameStarted", handleGameStarted);
				socket.off("turnChanged", handleTurnChanged);
				socket.off("playerReachedOne", handlePlayerReachedOne);
				socket.off("currentRoll", handleCurrentRoll);
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
		console.log("Stop game button clicked");
		stopGame();
	};

	return (
		<div>
			{!isGameOver ? (
				<>
					<div>
						<h3>{isMyTurn ? "It's your turn!" : `${currentPlayer?.nickname}'s turn`}</h3>
						<div>
							<h4>Current roll: {currentRoll !== null ? currentRoll : 'N/A'}</h4>
						</div>
						{isMyTurn && (
							<Button onClick={handlePlayerAction}>Generate Random Number</Button>
						)}
					</div>
					{isHost && (
						<Button onClick={handleStopGame} style={{ marginTop: '20px', color: 'red' }}>
							Return to Lobby
						</Button>
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
