"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "../contexts/socket";
import { useRouter } from "next/navigation";

const Home: React.FC = () => {
	const socket = useSocket();
	const router = useRouter();
	const [lobbyId, setLobbyId] = useState("");
	const [nickname, setNickname] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (socket) {
			console.log(`Socket initialized: ${socket.id}`);

			socket.on("lobbyCreated", ({ lobbyId, player }) => {
				console.log(`Lobby created with ID: ${lobbyId}`);
				console.log(`Player data:`, player);
				router.push(`/lobby/${lobbyId}`);
				navigator.clipboard.writeText(lobbyId);
			});

			socket.on("lobbyJoined", ({ lobbyId, player }) => {
				console.log(`Lobby joined with ID: ${lobbyId}`);
				console.log(`Player data:`, player);
				router.push(`/lobby/${lobbyId}`);
			});

			socket.on("lobbyError", (errorMessage: string) => {
				setError(errorMessage);
				setTimeout(() => setError(null), 5000);
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
	}, [socket, router]);

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
			console.log(
				"Emitting joinLobby event with nickname and roomId:",
				nickname,
				lobbyId
			);
			socket.emit("joinLobby", { nickname, lobbyId });
		} else {
			setError("Please enter a nickname and lobby ID before joining.");
		}
	};

	const handleLobbyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLobbyId(e.target.value.toUpperCase());
	};

	return (
		<main className="px-6 my-16">
			<div className="flex flex-col items-center gap-4 w-full m-auto max-w-96">
				<div className="border border-secondary  p-6 w-full h-fit flex flex-col gap-3">
					{error && <p className="text-red-500">{error}</p>}
					<input
						type="text"
						placeholder="Enter Nickname"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						className="input input-bordered text-sm"
					/>
					<button
						disabled={nickname === ""}
						className="btn"
						onClick={createLobby}
					>
						Host game
					</button>
					<div className="flex gap-3">
						<input
							type="text"
							placeholder="Enter Lobby Id"
							value={lobbyId}
							onChange={handleLobbyIdChange}
							className="input input-bordered text-sm w-1/2"
						/>
						<button
							disabled={nickname === "" || lobbyId === ""}
							className="btn w-1/2"
							onClick={joinLobby}
						>
							Join game
						</button>
					</div>
				</div>
				<div className="border border-secondary  w-full px-6 h-fit">
					<div className="collapse collapse-arrow">
						<input type="checkbox" />
						<div className="collapse-title">
							What are the rules ?
						</div>
						<div className="collapse-content flex flex-col gap-6">
								<div>
									<p>
										Each player rolls a random number between two values. The
										first player to play has to roll a number between 1 and a
										value set by the game host. The next player has to roll a
										number between 1 and the number the previous player rolled,
										and so on... The first player to hit 1 loses.
									</p>
								</div>
								<div className="flex flex-col gap-2 text-sm">
									<p>Example:</p>
									<p>Default value is 100.</p>
									<p>Player1 rolls between 1 and 100 and obtains 42.</p>
									<p>Player2 rolls between 1 and 42 and obtains 33.</p>
									<p>Player3 rolls between 1 and 33 and obtains 12</p>
									<p>Player4 rolls between 1 and 12 and obtains 8.</p>
									<p>Player5 rolls between 1 and 8 and obtains 1.</p>
									<p>Player5 loses.</p>
								</div>
							</div>
					</div>

					<div className="collapse collapse-arrow">
						<input type="checkbox" />
						<div className="collapse-title">
							Report a bug
						</div>
						<div className="collapse-content">
							<p>hello world</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
};

export default Home;
