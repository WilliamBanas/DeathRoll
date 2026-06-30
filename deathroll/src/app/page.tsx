"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/contexts/socket";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
	const { socket, playerId, setPlayerId } = useSocket();
	const router = useRouter();

	const [nickname, setNickname] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [sharedLobbyId, setSharedLobbyId] = useState<string | null>(null);
	const [selectedAvatar, setSelectedAvatar] = useState(1);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const lobbyIdParam = params.get("lobbyId");
		if (lobbyIdParam) {
			setSharedLobbyId(lobbyIdParam);
		}
	}, []);

	useEffect(() => {
		const savedLobbyId = localStorage.getItem("lastLobbyId");
		if (!savedLobbyId || !socket) return;

		const onLobbyData = () => {
			router.push(`/lobby/${savedLobbyId}`);
		};

		const onLobbyError = () => {
			localStorage.removeItem("lastLobbyId");
		};

		socket.emit("getLobbyData", savedLobbyId);
		socket.on("lobbyData", onLobbyData);
		socket.on("lobbyError", onLobbyError);

		return () => {
			socket.off("lobbyData", onLobbyData);
			socket.off("lobbyError", onLobbyError);
		};
	}, [socket, router]);

	useEffect(() => {
		if (!socket) return;

		const onCreated = (data: any) => {
			localStorage.setItem("lastLobbyId", data.lobbyId);
			router.push(`/lobby/${data.lobbyId}`);
		};

		const onJoined = (data: any) => {
			if (data.assignedPlayerId) {
				setPlayerId(data.assignedPlayerId);
			}
			localStorage.setItem("lastLobbyId", data.lobbyId);
			router.push(`/lobby/${data.lobbyId}`);
		};

		const onError = (msg: string) => {
			setError(msg);
			setTimeout(() => setError(null), 3000);
		};

		socket.on("lobbyCreated", onCreated);
		socket.on("lobbyJoined", onJoined);
		socket.on("lobbyError", onError);

		return () => {
			socket.off("lobbyCreated", onCreated);
			socket.off("lobbyJoined", onJoined);
			socket.off("lobbyError", onError);
		};
	}, [socket, router]);

	const createLobby = () => {
		if (!socket || !nickname) return;

		socket.emit("createLobby", {
			nickname,
			avatar: selectedAvatar,
			playerId,
		});
	};

	const joinLobby = () => {
		if (!socket || !nickname || !sharedLobbyId) return;

		socket.emit("joinLobby", {
			nickname,
			lobbyId: sharedLobbyId,
			avatar: selectedAvatar,
			playerId,
		});
	};

	const avatars = [
		{ icon: "/assets/img/avatar1.png", id: 1 },
		{ icon: "/assets/img/avatar2.png", id: 2 },
		{ icon: "/assets/img/avatar3.png", id: 3 },
		{ icon: "/assets/img/avatar4.png", id: 4 },
		{ icon: "/assets/img/avatar5.png", id: 5 },
		{ icon: "/assets/img/avatar6.png", id: 6 },
		{ icon: "/assets/img/avatar7.png", id: 7 },
		{ icon: "/assets/img/avatar8.png", id: 8 },
	];

	return (
		<main className="px-6 mt-16 m-auto mb-24">
			<div className="flex flex-col items-center lg:flex-row gap-4">

				<div className="max-w-80 w-80 bg-base-200 rounded-md p-6 flex flex-col gap-3">

					{/* AVATARS */}
					<div className="carousel w-full">
						{avatars.map((avatar) => (
							<div
								key={avatar.id}
								id={`avatar${avatar.id}`}
								className="carousel-item w-full flex justify-center"
							>
								<Image
									src={avatar.icon}
									alt={`Avatar ${avatar.id}`}
									width={224}
									height={224}
								/>
							</div>
						))}
					</div>

					{/* SELECT AVATAR */}
					<div className="flex justify-center gap-2">
						{avatars.map((avatar) => (
							<a
								key={avatar.id}
								href={`#avatar${avatar.id}`}
								className={`btn btn-xs ${
									selectedAvatar === avatar.id ? "btn-secondary" : ""
								}`}
								onClick={() => setSelectedAvatar(avatar.id)}
							>
								{avatar.id}
							</a>
						))}
					</div>

					{/* ERROR */}
					{error && <p className="text-red-500">{error}</p>}

					{/* NICKNAME */}
					<input
						type="text"
						placeholder="Enter Nickname"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						className="input input-bordered text-sm"
					/>

					{/* BUTTON */}
					{!sharedLobbyId ? (
						<button
							disabled={!nickname}
							className="btn btn-secondary"
							onClick={createLobby}
						>
							Host game
						</button>
					) : (
						<button
							disabled={!nickname}
							className="btn btn-secondary"
							onClick={joinLobby}
						>
							Join game
						</button>
					)}
				</div>

				{/* RULES */}
				<div className="max-w-80 w-80 flex flex-col gap-3">
					<div className="bg-base-200 collapse collapse-arrow rounded-md">
						<input type="checkbox" />
						<div className="collapse-title">What are the rules?</div>
						<div className="collapse-content text-sm">
							Each player rolls a number between 1 and the previous value.
							The first to reach 1 loses.
						</div>
					</div>
				</div>

			</div>
		</main>
	);
}