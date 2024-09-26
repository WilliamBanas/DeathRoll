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
		});
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
			return res.status(404).json({ error: "User not found" });
		}

		const match = compareSync(userData.password, user!.password);
		if (!match) {
			return res.status(401).json({ error: "Incorrect password" });
		}

		const token = jwt.sign(
			{
				userId: user?.id,
				email: user?.email,
				nickname: user?.nickname,
				role: user?.roleId,
			},
			JWT_SECRET,
			{ expiresIn: "1h" }
		);

    console.log('Token créé:', token);
    
    return res.status(200).json({ message: "Login successful", token });

	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Internal server error" });
	}
};
