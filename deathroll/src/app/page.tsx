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
				// Copier le lobbyId dans le presse-papier
				navigator.clipboard.writeText(lobbyId);
			});

			socket.on("lobbyJoined", ({ lobbyId, player }) => {
				console.log(`Lobby joined with ID: ${lobbyId}`);
				console.log(`Player data:`, player);
				router.push(`/lobby/${lobbyId}`);
			});

			socket.on("lobbyError", (errorMessage: string) => {
				setError(errorMessage);
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

	return (
		<main className="min-h-dvh flex flex-col items-center bg-background">
			<h1>Welcome to DEATHROLL!</h1>
			<div className="flex justify-center gap-6 w-2/3">
				<div className="bg-card rounded p-6 h-fit w-96 flex flex-col gap-3">
					{error && <p>{error}</p>}
					<Input
						type="text"
						placeholder="Enter Nickname"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						className="rounded"
					/>
					<Button
						disabled={nickname !== "" ? false : true}
						className="rounded"
						onClick={createLobby}
					>
						CREATE LOBBY
					</Button>
					<div className="flex gap-3">
						<Input
							type="text"
							placeholder="Enter Lobby ID"
							value={lobbyId}
							onChange={(e) => setLobbyId(e.target.value)}
							className="rounded"
						/>
						<Button
							disabled={nickname !== "" && lobbyId !== "" ? false : true}
							className="rounded"
							onClick={joinLobby}
              variant="outline"
						>
							JOIN LOBBY
						</Button>
					</div>
				</div>
				<div className="bg-card rounded px-6 w-96 h-fit bg-gradient bg-cover !">
					<Accordion type="single" collapsible>
						<AccordionItem value="item-1">
							<AccordionTrigger>What's the rules ?</AccordionTrigger>
							<AccordionContent>
								Each player rolls a random number between two values. The first
								player to play has to roll a number between 1 and a value set by
								the game host. The next player has to roll a number between 1
								and the number the previous player rolled, and so on... The
								first player to hit 1 loses.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</main>
	);
};

export default Home;
