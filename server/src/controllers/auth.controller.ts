import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { compareSync, hashSync } from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets";

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
	try {
		const userData = req.body;
		const existingEmail = await prisma.user.findUnique({
			where: { email: userData.email },
		});
		if (existingEmail) {
			return res.json({
				error: "Email is taken already",
			});
		}
    const existingNickname = await prisma.user.findUnique({
      where: { nickname: userData.nickname },
    })
    if (existingNickname) {
      return res.json({
        error: "Nickname is taken already",
      });
    }
		const user = await prisma.user.create({
			data: {
				email: userData.email,
				password: hashSync(userData.password),
				nickname: userData.nickname,
				role: {
					connect: { id: userData.roleId },
				},
			},
		});
		res.status(201).json({ data: user });
	} catch (error) {
		console.log(error);
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const userData = req.body;
		const user = await prisma.user.findUnique({
			where: {
				email: userData.email,
			},
		});

		if (!user) {
			res.json({ error: "User not found" });
		}

    const match = compareSync(userData.password, user!.password);
    if (match) {
      jwt.sign(
        {
          userId: user?.id,
          email: user?.email,
          nickname: user?.nickname,
        },
        JWT_SECRET,
        { expiresIn: "1h" },
        (error, token) => {
          if (error) throw error;
          res.cookie("token", token).json(user);
        }
      );
    }
		if (!match) {
			res.json({ error: "Incorrect password" });
		}
	} catch (error) {
    console.log(error);
  }

};
