import React, { useEffect, useState } from "react";
import { useSocket } from "../contexts/socket"; 
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [lobbyId, setLobbyId] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (socket) {
      console.log(`Socket initialized: ${socket.id}`);

      socket.on("lobbyCreated", ({ lobbyId, player }) => {
        console.log(`Lobby created with ID: ${lobbyId}`);
        console.log(`Player data:`, player);
        navigate(`/lobby/${lobbyId}`);
        // Copier le lobbyId dans le presse-papier
        navigator.clipboard.writeText(lobbyId);
      });

      socket.on("lobbyJoined", ({ lobbyId, player }) => {
        console.log(`Lobby joined with ID: ${lobbyId}`);
        console.log(`Player data:`, player);
        navigate(`/lobby/${lobbyId}`);
      });

      socket.on("lobbyError", (errorMessage: string) => {
        setError(errorMessage);
      });
    } else {
      console.error("Socket is not initialized");
    }

    return () => {
      if (socket) {
        socket.off("lobbyCreated");
        socket.off("lobbyJoined");
        socket.off("lobbyError");
      }
    };
  }, [socket, navigate]);

  const createLobby = () => {
    if (nickname && socket) {
      console.log("Emitting createLobby event with nickname:", nickname);
      socket.emit("createLobby", nickname);
    } else {
      setError("Please enter a nickname before creating a lobby.");
    }
  };

  const joinLobby = () => {
    if (nickname && lobbyId && socket) {
      console.log("Emitting joinLobby event with nickname and roomId:", nickname, lobbyId);
      socket.emit("joinLobby", { nickname, lobbyId });
    } else {
      setError("Please enter a nickname and lobby ID before joining.");
    }
  }

  return (
    <div className="flex flex-col items-center text-lg">
      <h1 className="text-3xl font-bold underline mb-4">Welcome to DEATHROLL!</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text" 
        placeholder="Enter Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="mb-2 p-2 border rounded"
      />
      <div className="flex space-x-2">
        <button 
          onClick={createLobby}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Lobby
        </button>
        <input
          type="text"
          placeholder="Enter Lobby ID"
          value={lobbyId}
          onChange={(e) => setLobbyId(e.target.value)}
          className="p-2 border rounded"
        />
        <button 
          onClick={joinLobby}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
};

export default Home;
