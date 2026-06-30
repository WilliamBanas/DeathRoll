"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const API_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

type SocketContextType = {
	socket: Socket | null;
	playerId: string;
	setPlayerId: (id: string) => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
	const ctx = useContext(SocketContext);
	if (!ctx) throw new Error("SocketProvider missing");
	return ctx;
};

const getOrCreatePlayerId = () => {
	if (typeof window === "undefined") return "";

	let id = localStorage.getItem("playerId");

	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem("playerId", id);
	}

	return id;
};

export const SocketProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [playerId, setPlayerIdState] = useState(getOrCreatePlayerId);

	const setPlayerId = (id: string) => {
		localStorage.setItem("playerId", id);
		setPlayerIdState(id);
	};

	useEffect(() => {
		const s = io(API_URL, {
			transports: ["websocket"],
			withCredentials: true,
		});

		// eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate: synchronizing React with external WebSocket
		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, []);

	return (
		<SocketContext.Provider value={{ socket, playerId, setPlayerId }}>
			{children}
		</SocketContext.Provider>
	);
};