import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const userClient = new PrismaClient().user;

// get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await userClient.findMany();
    res.status(200).json({ data: allUsers });
  } catch (error) {
    console.log(error);
  }
}

// get user by id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userClient.findUnique({
      where: { id: userId },
    });
    res.status(200).json({ data: user });
  } catch (error) {
    console.log(error);
  }
}

// update user by id
export const updateUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const userData = req.body;
    const user = await userClient.update({
      where: { id: userId },
      data: {
        email: userData.email,
        password: userData.password,
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
}

// delete user by id
export const deleteUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userClient.delete({
      where: { id: userId },
    });
    res.status(200).json({ data: {} });
  } catch (error) {
    console.log(error);
  }
}