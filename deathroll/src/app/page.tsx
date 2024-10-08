"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "../contexts/socket";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";

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
		<main className="px-6">
			<div className="flex flex-col items-center gap-4 w-full m-auto max-w-96 mt-16">
				<div className="bg-card border rounded px-6 py-4 w-full h-fit flex flex-col gap-3">
					{error && <p className="text-red-500">{error}</p>}
					<Input
						type="text"
						placeholder="Enter Nickname"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						className="rounded"
					/>
					<Button
						disabled={nickname === ""}
						className={`rounded`}
						onClick={createLobby}
					>
						Create lobby
					</Button>
					<div className="flex gap-3">
						<Input
							type="text"
							placeholder="Enter Lobby ID"
							value={lobbyId}
							onChange={handleLobbyIdChange}
							className="rounded"
						/>
						<Button
							disabled={nickname === "" || lobbyId === ""}
							className={`rounded text-white bg-secondary hover:bg-secondary/50`}
							onClick={joinLobby}
							variant="ghost"
						>
							Join lobby
						</Button>
					</div>
				</div>
				<div className="bg-card border rounded w-full px-6 h-fit">
					<Accordion type="single" collapsible>
						<AccordionItem value="item-1">
							<AccordionTrigger className="text-lg">
								What are the rules ?
							</AccordionTrigger>
							<AccordionContent className="text-lg">
								Each player rolls a random number between two values. The first
								player to play has to roll a number between 1 and a value set by
								the game host. The next player has to roll a number between 1
								and the number the previous player rolled, and so on... The
								first player to hit 1 loses.
								<br />
								<br />
								Example:
								<br />
								Default value is 100.
								<br />
								Player1 rolls between 1 and 100 and obtains 42.
								<br />
								Player2 rolls between 1 and 42 and obtains 33.
								<br />
								Player3 rolls between 1 and 33 and obtains 12
								<br />
								Player4 rolls between 1 and 12 and obtains 8.
								<br />
								Player5 rolls between 1 and 8 and obtains 1.
								<br />
								<br />
								Player5 loses.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</main>
	);
};

export default Home;
