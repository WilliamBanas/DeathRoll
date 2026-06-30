export interface Player {
	playerId: string;
	socketId: string;
	nickname: string;
	host: boolean;
	avatar: number;
	loser: boolean;
	connected: boolean;
	ready: boolean;
	returnedToLobby: boolean;
}

export interface Lobby {
	lobbyId: string;
	players: Player[];
}

export interface Game {
	status: "WAITING" | "PLAYING" | "FINISHED";
	turnOrder: string[];
	currentPlayerId: string | null;
	startingNumber: number | null;
	isFirstTurn: boolean;
	playerNumbers: Record<string, number>;
}