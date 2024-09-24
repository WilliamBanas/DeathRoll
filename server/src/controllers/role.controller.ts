import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const roleClient = new PrismaClient().role;

// get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const allRoles = await roleClient.findMany();
    res.status(200).json({ data: allRoles});
  } catch (error) {
    console.log(error);
  }
}

// get role by id
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id, 10);
    const role = await roleClient.findUnique({
      where: {id: roleId},
  });
    res.status(200).json({ data: role });
  } catch (error) {
    console.log(error);
  }
}

// create role
export const createRole = async (req: Request, res: Response) => {
  try {
    const roleData = req.body;
    const role = await roleClient.create({
      data: {
        name: roleData.name
      },
    });
    res.status(201).json({ data: role });
  } catch (error) {
    console.log(error);
  }
}

// update role by id
export const updateRoleById = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id, 10);
    const roleData = req.body;
    const role = await roleClient.update({
      where: { id: roleId },
      data: {
        name: roleData.name
      },
    });
    res.status(201).json({ data: role });
  } catch (error) {
    console.log(error);
  }
}

// delete role by id
export const deleteRoleById = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id, 10);
    const role = await roleClient.delete({
      where: { id: roleId },
    });
    res.status(200).json({ data: {} });
  } catch (error) {
    console.log(error);
  }
}
