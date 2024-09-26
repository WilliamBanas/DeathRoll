import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "../contexts/socket";

const Home: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>(""); // For error handling
  const socket = useSocket();
  const navigate = useNavigate();

  const checkAuth = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  };

  const createRoom = () => {
    const id = uuidv4();
    if (socket) {
      console.log(`Creating room with ID: ${id}`);
      
      // Handle room creation and joining locally
      socket.once("roomCreated", (createdRoomId: string) => {
        console.log(`Room created: ${createdRoomId}`);
        socket.emit("joinRoom", createdRoomId);
      });
  
      // Handle room errors locally
      socket.once("roomError", (error: { error: string }) => {
        setErrorMessage(error.error);
        console.error(`Error creating room: ${error.error}`);
      });
  
      // Emit the createRoom event
      socket.emit("createRoom", id);
      console.log("Emitted createRoom event");
    }
  };

  const joinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (roomId.trim() !== "") {
      if (socket) {
        console.log(`Joining room: ${roomId}`);
  
        // Handle successful room join locally
        socket.once("joinedRoom", (joinedRoomId: string) => {
          console.log(`Successfully joined room: ${joinedRoomId}`);
          navigate(`/room/${joinedRoomId}`);
        });
  
        // Handle room errors locally
        socket.once("roomError", (error: { error: string }) => {
          setErrorMessage(error.error);
          console.error(`Error joining room: ${error.error}`);
        });
  
        // Emit the joinRoom event
        socket.emit("joinRoom", roomId);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = () => {
    // Clear the token from session storage
    sessionStorage.removeItem("token");
    setIsAuthenticated(false); // Update authenticated state
    navigate("/login"); // Redirect to login page
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Welcome to the Room App!</h1>
      <div>
        <button onClick={createRoom}>Create Room</button>
      </div>
      <form onSubmit={joinRoom}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button type="submit">Join Room</button>
      </form>
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}{" "}
      {/* Display errors here */}
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Home;