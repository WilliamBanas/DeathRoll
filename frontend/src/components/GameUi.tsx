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
  isFirstTurn: boolean; // Add this line
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
}) => {
  const game = lobbyId ? games[lobbyId] : null;
  const [loserMessage, setLoserMessage] = useState<string | null>(null);
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
        rangeStart,
        rangeEnd,
      }: {
        currentTurn: number;
        randomNum: number;
        rangeStart: number;
        rangeEnd: number;
      }) => {
        console.log(
          `Received turnChanged: currentTurn = ${currentTurn}, rangeStart = ${rangeStart}, rangeEnd = ${rangeEnd}`
        );
        setRangeStart(rangeStart);
        setRangeEnd(rangeEnd);
      };
  
      const handleLoserAnnouncement = (loser: string) => {
        if (socket?.id === currentPlayer?.socketId) {
          setLoserMessage("You lost!");
        } else {
          setLoserMessage(`${loser} has lost the game!`);
        }
      };

      const handleGameOver = () => {
        // Handle the game over event, e.g., reset game state or show a message
        setLoserMessage("Game Over! Resetting the game...");
      };
  
      socket.on("turnChanged", handleTurnChanged);
      socket.on("loserAnnouncement", handleLoserAnnouncement);
      socket.on("gameOver", handleGameOver); // Provide a listener function here
  
      return () => {
        socket.off("turnChanged", handleTurnChanged);
        socket.off("loserAnnouncement", handleLoserAnnouncement);
        socket.off("gameOver", handleGameOver); // Clean up the listener
      };
    }
  }, [socket, currentPlayer]);


	return (
    <div>
      {/* UI elements */}
      {isMyTurn ? (
        <div>
          <h3>It's your turn!</h3>
          <p>
            Generate a random number between {rangeStart} and {rangeEnd}
          </p>
          <button onClick={handlePlayerAction}>Generate Random Number</button>
        </div>
      ) : (
        <div>
          <h3>{currentPlayer?.nickname}'s turn</h3>
          <p>
            They are generating a number between {rangeStart} and {rangeEnd}.
          </p>
        </div>
      )}
      {loserMessage && <div>{loserMessage}</div>}
    </div>
  );
};

export default GameUi;
