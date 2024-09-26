import React, { createContext, useContext, useEffect } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:3000";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = sessionStorage.getItem("token"); // Get the token from session storage
  const socket = io(`${API_URL}`, {
    auth: {
      token, // Send the token in the authentication payload
    },
  });

  useEffect(() => {
    return () => {
      socket.disconnect(); // Clean up the socket connection when the component unmounts
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};