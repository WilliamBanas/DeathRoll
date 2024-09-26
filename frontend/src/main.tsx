import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./contexts/socket.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<SocketProvider>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</SocketProvider>
	</StrictMode>
);
