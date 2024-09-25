import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { compareSync, hashSync } from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets";

const prisma = new PrismaClient();

interface UserPayload {
  id: number;
  email: string;
  nickname: string;
  roleId: number;
}

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

		res.cookie("token", token, {
			httpOnly: true,
			sameSite: "strict",
			maxAge: 3600 * 1000,
		});
    
    return res.status(200).json({ message: "Login successful" });

	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const check = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  const options: jwt.VerifyOptions = {
    algorithms: ['HS256'],
  };
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, options) as UserPayload;
      return res.status(200).json({ authenticated: true, user: decoded });
    } catch (err) {
      return res.status(401).json({ authenticated: false });
    }
  } else {
    return res.status(401).json({ authenticated: false });
  }
}

export const logout = async (req: Request, res: Response) => {
  console.log("Logout request received");
  try {
    res.clearCookie("token"); // Supprime le cookie contenant le token
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
