import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/socket";

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Loading state

  const leaveRoom = () => {
    if (socket) {
      console.log(`Leaving room: ${roomId}`);
      socket.emit("leaveRoom");
      navigate("/");
    }
  };

  const checkAuth = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  };

  const checkRoom = () => {
    if (socket && roomId) {
      console.log(`Checking if room exists: ${roomId}`);
      socket.emit("checkRoom", roomId);

      socket.on("roomExists", (data: { exists: boolean }) => {
        if (data.exists) {
          console.log(`Room exists: ${roomId}`);
          setLoading(false); // Stop loading since we found the room
        } else {
          setError("Room does not exist.");
          console.error(`Room does not exist: ${roomId}`);
          setLoading(false); // Stop loading before navigating
          navigate("/");
        }
      });

      socket.on("roomError", (data: { error: string }) => {
        setError(data.error);
        console.error(`Error checking room: ${data.error}`);
        setLoading(false); // Stop loading before navigating
        navigate("/");
      });
    }
  };

  useEffect(() => {
    checkAuth();
    checkRoom(); // Call the checkRoom function when component mounts

    return () => {
      if (socket) {
        socket.off("roomExists");
        socket.off("roomError");
      }
    };
  }, [roomId, navigate, socket]);

  useEffect(() => {
    console.log("Room component mounted");
  }, []);

  if (loading) return <div>Loading room data...</div>; // Show loading state until we have room data

  return (
    <>
      <h1>Room: {roomId}</h1>
      {error && <p className="text-red-500">{error}</p>}
      <button onClick={leaveRoom}>Leave Room</button>
    </>
  );
};

export default Room;