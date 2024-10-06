import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
	startingNumber: number; // Ajoutez cette prop
}

const GameUi: React.FC<GameUiProps> = ({
	lobbyData,
	lobbyId,
	socket,
	handlePlayerAction,
	games,
	stopGame,
	startingNumber,
}) => {
	const game = lobbyId ? games[lobbyId] : null;
	const [currentRoll, setCurrentRoll] = useState<number | null>(null);
	const currentPlayer =
		game && lobbyData ? lobbyData.players[game.currentTurn] : null;
	const isMyTurn = currentPlayer?.socketId === socket?.id;
	const [reachedOneMessage, setReachedOneMessage] = useState<string | null>(
		null
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogMessage, setDialogMessage] = useState("");
	const [animatedNumber, setAnimatedNumber] = useState(startingNumber);
	const previousNumberRef = useRef(startingNumber);

	const isHost = lobbyData?.players.find(
		(player) => player.socketId === socket?.id
	)?.host;

	useEffect(() => {
		if (socket) {
			const handleGameStarted = ({
				startingNumber,
				}: {
				startingNumber: number;
			}) => {
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
				console.log(
					`Turn changed: currentTurn = ${currentTurn}, randomNum = ${randomNum}`
				);
				setCurrentRoll(randomNum);
			};

			const handlePlayerReachedOne = ({
				playerName,
				loserSocketId,
			}: {
				playerName: string;
				loserSocketId: string;
			}) => {
				if (loserSocketId === socket.id) {
					setDialogMessage("You lost!");
				} else {
					setDialogMessage(`${playerName} lost !`);
				}
				setIsDialogOpen(true);
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

	useEffect(() => {
		if (currentRoll !== null) {
			const start = previousNumberRef.current;
			const end = currentRoll;
			const duration = 250;
			const range = Math.abs(end - start);
			const increment = end > start ? 1 : -1;
			const stepTime = Math.floor(duration / range);

			let current = start;
			const timer = setInterval(() => {
				current += increment * Math.max(1, Math.floor(range / 100));
				if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
					current = end;
				}
				setAnimatedNumber(current);
				if (current === end) {
					clearInterval(timer);
					previousNumberRef.current = end;
				}
			}, stepTime);

			return () => clearInterval(timer);
		}
	}, [currentRoll]);

	const handleStopGame = () => {
		console.log("Stop game button clicked");
		stopGame();
	};

	const formatNumber = (num: number): string => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	};

	return (
		<main className="bg-background px-6">
			<div className="flex flex-col items-center gap-4 w-full m-auto max-w-96 mt-32">
				<div className="bg-primary/10 rounded px-6 py-4 w-full flex items-center justify-center">
					<p className="text-2xl font-bold truncate">
						{isMyTurn
							? "It's your turn !"
							: `${currentPlayer?.nickname}'s turn`}
					</p>
				</div>
				<div className="flex flex-col items-center justify-center w-full h-96">
					<div>
						<p className="text-7xl text-white">
							1 - <span className="text-primary">{formatNumber(animatedNumber)}</span>
						</p>
					</div>
				</div>
				<Button
					onClick={handlePlayerAction}
					className="rounded mb-4 w-32 h-20 bg-primary/10"
					disabled={!isMyTurn}
				>
					<span
						className={`gradient-text text-3xl ${
							!isMyTurn ? "opacity-50" : ""
						}`}
					>
						Roll !
					</span>
				</Button>
			</div>
			{isHost && (
				<Button
					onClick={handleStopGame}
					className="mt-6 bg-red-500 hover:bg-red-600 text-white"
				>
					Retour au lobby
				</Button>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="w-4/5 sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="text-2xl text-center mb-4">
							Game Over
						</DialogTitle>
						<DialogDescription className="text-2xl font-semibold text-center">
							{dialogMessage}
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</main>
	);
};

export default GameUi;
