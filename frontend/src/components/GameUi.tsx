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
	const isGameOver = game ? !game.isActive : false;
	const isMyTurn =
		game &&
		lobbyData &&
		lobbyData.players[game.currentTurn]?.socketId === socket?.id;

	useEffect(() => {
		if (socket) {
			const handleLoserAnnouncement = (loserNickname: string) => {
				console.log(`Loser announced: ${loserNickname}`);
				setLoserMessage(`${loserNickname} has lost!`);
			};

			socket.on("loserAnnouncement", handleLoserAnnouncement);
			return () => {
				socket.off("loserAnnouncement", handleLoserAnnouncement);
			};
		}
	}, [socket]);

	return (
		<div>
			<>
				<h2>Players can generate numbers. First player to reach 1 loses!</h2>

				{isMyTurn ? (
					<div>
						<h3>Your Turn!</h3>
						<button onClick={handlePlayerAction}>Generate Random Number</button>
					</div>
				) : (
					game && (
						<div>
							<h3>{lobbyData?.players[game.currentTurn]?.nickname}'s Turn!</h3>
							{game.currentTurn > 0 && (
								<>
									<p>Waiting for them to generate a number...</p>
								</>
							)}
						</div>
					)
				)}
			</>
		</div>
	);
};

export default GameUi;
