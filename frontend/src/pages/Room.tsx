import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/socket"; 

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      socket.emit("checkRoom", roomId);

      socket.on("roomExists", (data: { exists: boolean }) => {
        if (!data.exists) {
          navigate("/"); 
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("roomExists");
      }
    };
  }, [roomId, navigate, socket]);

  return (
    <>
      <h1>Room: {roomId}</h1>
    </>
  );
};

export default Room;