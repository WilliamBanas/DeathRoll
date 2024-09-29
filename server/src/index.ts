import express from "express";
import cors from "cors";
import { createServer } from "http"; 
import { configureSocket } from "./websockets/socket";

const app = express();
const port = 3000;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.get("/", (req, res) => {
	res.send("Server is currently running");
});

const server = createServer(app);

configureSocket(server);

server.listen(port, () => {
  console.log(`Server running at: ${port}`);
});