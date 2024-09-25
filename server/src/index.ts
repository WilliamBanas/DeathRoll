import express from "express";
import roleRouter from "./routes/role.router";
import userRouter from "./routes/user.router";
import authRouter from "./routes/auth.router";
import cookieParser from "cookie-parser";
import mysql from "mysql2";
import { DATABASE_URL } from "./secrets";
import cors from "cors";

const app = express();
const port = 3000;
const db_con = mysql.createConnection(DATABASE_URL);
db_con.connect((err) => {
	if (err) {
		console.error("Database couldn't connect", err);
	} else {
		console.log("Connected to database");
	}
});

const corsOptions = {
  origin: 'http://localhost:5173', // Remplace par l'URL de ton frontend
  credentials: true, // Permet d'envoyer les cookies
};

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use("/roles", roleRouter);
app.use("/users", userRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
	res.send("Server is currently running");
});

app.listen(port, () => {
	console.log(`Server running at: ${port}`);
});
