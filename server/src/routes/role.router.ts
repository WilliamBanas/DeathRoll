import { Router } from "express";
import {
	createRole,
	deleteRoleById,
	getAllRoles,
	getRoleById,
	updateRoleById,
} from "../controllers/role.controller";

const roleRouter = Router();

roleRouter.get("/", getAllRoles);
roleRouter.get("/:id", getRoleById);
roleRouter.post("/", createRole);
roleRouter.put("/:id", updateRoleById);
roleRouter.delete("/:id", deleteRoleById);

export default roleRouter;
