"use client";
import { Dices } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

interface Player {
	playerId: string;
	socketId: string;
	nickname: string;
	host: boolean;
	avatar: number;
	loser: boolean;
	connected: boolean;
}

interface Lobby {
	lobbyId: string;
	players: Player[];
}

interface Game {
	status: "WAITING" | "PLAYING" | "FINISHED";
	turnOrder: string[];
	currentPlayerId: string | null;
	startingNumber: number | null;
	isFirstTurn: boolean;
	playerNumbers: Record<string, number>;
}

interface GameUiProps {
	lobbyData: Lobby | null;
	handlePlayerAction: () => void;
	lobbyId: string | undefined;
	socket: Socket | null;
	games: { [lobbyId: string]: Game };
	stopGame: () => void;
	startingNumber: number;
	playerId: string;
}

const GameUi: React.FC<GameUiProps> = ({
	lobbyData,
	lobbyId,
	socket,
	handlePlayerAction,
	games,
	stopGame,
	playerId,
}) => {
	const game = lobbyId ? games[lobbyId] : null;

	const [currentRoll, setCurrentRoll] = useState<number | null>(null);
	const [gameOver, setGameOver] = useState(false);
	const [dialogMessage, setDialogMessage] = useState("");

	const [animatedNumber, setAnimatedNumber] = useState(0);
	const previousNumberRef = useRef(0);
	const [isAnimating, setIsAnimating] = useState(false);

	/* =========================
	   CURRENT PLAYER (FIXED)
	========================= */

	const currentPlayer = game?.turnOrder
		? lobbyData?.players.find(
				(p) => p.playerId === game.currentPlayerId
		  )
		: null;

	const isMyTurn = game?.currentPlayerId === playerId;

	const isHost = lobbyData?.players.find((p) => p.playerId === playerId)?.host;

	const displayNumber = currentRoll === null ? (game?.startingNumber ?? 0) : animatedNumber;

	/* =========================
	   SOCKET EVENTS
	========================= */

	useEffect(() => {
		if (!socket) return;

		const handleTurnChanged = ({
			currentPlayerId,
			randomNum,
		}: {
			currentPlayerId: string;
			randomNum: number;
		}) => {
			setCurrentRoll(randomNum);
		};

		const handleGameOver = ({
			loser,
		}: {
			loser: string;
		}) => {
			setCurrentRoll(1);

			setTimeout(() => {
				setDialogMessage(loser);
				setGameOver(true);
			}, 1500);
		};

		socket.on("turnChanged", handleTurnChanged);
		socket.on("gameOver", handleGameOver);

		return () => {
			socket.off("turnChanged", handleTurnChanged);
			socket.off("gameOver", handleGameOver);
		};
	}, [socket]);

	/* =========================
	   ANIMATION
	========================= */

	useEffect(() => {
		if (currentRoll === null) return;

		setIsAnimating(true);

		const start = previousNumberRef.current;
		const end = currentRoll;

		let current = start;

		const step = end > start ? 1 : -1;

		const interval = setInterval(() => {
			current += step;

			setAnimatedNumber(current);

			if (current === end) {
				clearInterval(interval);
				previousNumberRef.current = end;
				setIsAnimating(false);
			}
		}, 20);

		return () => clearInterval(interval);
	}, [currentRoll]);

	/* =========================
	   ACTIONS
	========================= */

	const handleStopGame = () => {
		stopGame();
	};

	const formatNumber = (num: number) =>
		num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

	/* =========================
	   UI
	========================= */

	if (gameOver) {
		return (
			<div className="flex flex-col items-center justify-center mt-32">
				<p className="text-5xl font-bold">{dialogMessage} lost !</p>
			</div>
		);
	}

	return (
		<main className="px-6 my-16">
			<div className="flex flex-col items-center gap-4 w-full max-w-96 m-auto">

				{/* TURN */}
				<div className="text-2xl font-bold text-center">
					{isMyTurn ? (
						<p>It&apos;s your turn !</p>
					) : (
						<p>
							{currentPlayer?.nickname}&apos;s turn
						</p>
					)}
				</div>

				{/* NUMBER */}
				<div className="text-7xl">
					1 -{" "}
					<span className="text-secondary">
						{formatNumber(displayNumber)}
					</span>
				</div>

				{/* ACTION */}
				<button
					onClick={handlePlayerAction}
					className="btn btn-lg"
					disabled={!isMyTurn || isAnimating || gameOver}
				>
					<Dices />
					Roll !
				</button>

				{/* STOP */}
				{isHost && (
					<button onClick={handleStopGame} className="btn">
						Retour au lobby
					</button>
				)}
			</div>
		</main>
	);
};

export default GameUi;