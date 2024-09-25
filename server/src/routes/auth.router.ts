import { Router } from "express";
import { login, signup, check, logout } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.get("/check", check);
authRouter.post("/logout", logout)

export default authRouter;