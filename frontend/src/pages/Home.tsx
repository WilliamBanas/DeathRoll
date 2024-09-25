import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "../contexts/socket";

const Home: React.FC = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [roomId, setRoomId] = useState<string>("");
	const socket = useSocket();
	const navigate = useNavigate();
  const API_URL = "http://localhost:3000";

	const checkAuth = () => {
		fetch(`${API_URL}/auth/check`, {
			method: "GET",
			credentials: "include",
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error("Network response was not ok");
				}
				return response.json();
			})
			.then((data) => {
				setIsAuthenticated(data.authenticated);
			})
			.catch(() => {
				setIsAuthenticated(false);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	const createRoom = () => {
		const id = uuidv4();
		if (socket) {
			socket.emit("createRoom", id);
		}
		navigate(`/room/${id}`);
	};

	const joinRoom = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (roomId.trim() !== "") {
			navigate(`/room/${roomId}`);
		}
	};

	useEffect(() => {
		checkAuth();
	}, []);

	useEffect(() => {
    if (socket) {
      socket.emit("checkRoom", roomId);

      socket.on("roomExists", (data: { exists: boolean }) => {
        if (!data.exists) {
          navigate("/"); // Rediriger si la room n'existe pas
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("roomExists");
      }
    };
  }, [roomId, navigate, socket]);

	const logout = () => {
		fetch(`${API_URL}/auth/logout`, {
			method: "POST",
			credentials: "include", // Inclure les cookies
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error("Logout failed");
				}
				return response.json();
			})
			.then((data) => {
				console.log(data);
				// Optionnel : rediriger vers la page de login après déconnexion
				navigate("/login");
			})
			.catch((error) => {
				console.error("Error while logging out:", error);
			});
	};

	if (loading) return <div>Loading...</div>;

	return (
		<div>
      <h1 className="text-3xl font-bold underline">Welcome to the Room App!</h1>
      <div>
        <button onClick={createRoom}>Create Room</button>
      </div>
      <form onSubmit={joinRoom}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button type="submit">Join Room</button>
      </form>
      <button onClick={logout}>Logout</button>
    </div>
	);
};

export default Home;