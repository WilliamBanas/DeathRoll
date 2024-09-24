import { Router } from "express";
import {
	deleteUserById,
	getAllUsers,
	getUserById,
	updateUserById,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.put("/:id", updateUserById);
userRouter.delete("/:id", deleteUserById);

export default userRouter;
