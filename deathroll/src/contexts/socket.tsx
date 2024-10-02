"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:3000";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    
      const newSocketInstance = io(`${API_URL}`, {
        withCredentials: true,
      });
     
      setSocket(newSocketInstance);
      newSocketInstance.on("connect", () => {
        console.log(`Socket connected: ${newSocketInstance.id}`);
      });

      newSocketInstance.on("disconnect", () => {
        console.log(`Socket disconnected: ${newSocketInstance.id}`);
      });

    
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};