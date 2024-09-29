import React, { useEffect, useState } from "react";
import { useSocket } from "../contexts/socket"; 
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [lobbyId, setLobbyId] = useState('');
  const [nickname, setNickname] = useState('');
  
  useEffect(() => {
    if (socket) {
      console.log(`Socket initialized: ${socket.id}`);
    } else {
      console.error("Socket is not initialized");
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("lobbyCreated", ({ lobbyId, player }) => {
        console.log(`Lobby created with ID: ${lobbyId}`);
        console.log(`Player data:`, player);

        navigate(`/lobby/${lobbyId}`);
      });

      socket.on("lobbyJoined", ({ lobbyId, player }) => {
        console.log(`Lobby joined with ID: ${lobbyId}`);
        console.log(`Player data:`, player);

        navigate(`/lobby/${lobbyId}`);
      });
    }

    return () => {
      if (socket) {
        socket.off("lobbyCreated");
        socket.off("lobbyJoined");
      }
    };
  }, [socket, navigate]);

  const createLobby = () => {
    if (nickname && socket) {
      console.log("Emitting createLobby event with nickname:", nickname);
      socket.emit("createLobby", nickname);
    } else {
      alert(`Nickname or socket is missing! Nickname: ${nickname}, Socket: ${socket}`);
      console.log("Current Nickname:", nickname);
      console.log("Current Socket:", socket);
    }
  };

  const joinLobby = () => {
    if (nickname && lobbyId && socket) {
      console.log("Emitting createLobby event with nickname and roomId:", nickname, lobbyId);
      socket.emit("joinLobby", { nickname, lobbyId });
    } else {
      alert(`Nickname or socket or lobbyId is missing! Nickname: ${nickname}, Socket: ${socket}, LobbyId: ${lobbyId}`);
      console.log("Current Nickname:", nickname);
      console.log("Current Socket:", socket);
      console.log("Current LobbyId:", lobbyId);
    }
  }

  return (
    <div className="flex flex-col items-start text-lg">
      <h1 className="text-3xl font-bold underline">Welcome to the Room App!</h1>
      <div>
        <button disabled={nickname === '' ? true : false} onClick={createLobby} >Host</button>
      </div>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={lobbyId}
        onChange={(e) => setLobbyId(e.target.value)}
        disabled={nickname === '' ? true : false}
      />
      <button disabled={nickname === '' ? true : false} onClick={joinLobby} >Join</button>
      <input
        type="text" 
        placeholder="Enter Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)} 
      />

    </div>
  );
};

export default Home;