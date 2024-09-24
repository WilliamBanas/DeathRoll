import { PrismaClient } from "@prisma/client";
import data from "./data.json";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

type Role = {
	name: string;
};

type User = {
	email: string;
	password: string;
	nickname: string;
	roleId: number;
};

async function main() {
	console.log("🌱 Seeding roles...");
	await Promise.all(
		data.roles.map((role: Role) => {
			 return prisma.role.upsert({
				where: { name: role.name },
				update: {},
				create: {
					name: role.name,
				},
			});
		})
	).then(() => console.info('[SEED] Successfully seeded roles'))
  .catch(e => console.error('[SEED] Failed to seed roles', e))

	console.log("🌱 Seeding users...");
	await Promise.all(
		data.users.map((user: User) => {
			return prisma.user.upsert({
				where: { email: user.email },
				update: {},
				create: {
					email: user.email,
					password: hashSync(user.password),
					nickname: user.nickname,
					roleId: user.roleId,
				},
			});
		})
	).then(() => console.info('[SEED] Successfully seeded users'))
  .catch(e => console.error('[SEED] Failed to seed users', e))
}

main()
	.catch(async (e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
