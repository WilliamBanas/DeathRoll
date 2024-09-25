import { Router } from "express";
import { RoomController } from "../controllers/room.controller";

const roomRouter = Router();

roomRouter.post("/create", RoomController.create); // Route pour créer une room
roomRouter.get("/:roomId/exist", RoomController.exists); // Route pour vérifier l'existence d'une room

export default roomRouter;