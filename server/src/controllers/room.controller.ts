import { PrismaClient } from '@prisma/client';
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const RoomController = {
  // Fonction utilitaire pour créer une salle dans la base de données
  _createRoomInDB: async (roomId: string) => {
    return await prisma.room.create({
      data: {
        id: roomId, // Assurez-vous que votre modèle de base de données permet cela
      },
    });
  },

  create: async (req: Request, res: Response) => {
    const { roomId } = req.body;
    try {
      const room = await RoomController._createRoomInDB(roomId); // Appel à la fonction utilitaire
      return res.status(201).json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Méthode pour vérifier si une salle existe
  exists: async (roomId: string) => {
    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      return room !== null; // Renvoie vrai ou faux
    } catch (error) {
      console.error("Error checking room existence:", error);
      throw new Error("Internal Server Error"); // Lance une erreur en cas d'échec
    }
  },
};