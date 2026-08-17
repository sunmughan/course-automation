import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { seedCurriculum } from "../src/lib/curriculum/seed";

async function main() {
  console.log("Seeding demo users first...");
  const passwordHash = await hashPassword("Password123!");

  const demoUsers = [
    {
      email: "student@skillforge.com",
      name: "Demo Student",
      role: "student",
      passwordHash,
    },
    {
      email: "instructor@skillforge.com",
      name: "Prof. Alex Rivers",
      role: "instructor",
      passwordHash,
    },
    {
      email: "admin@skillforge.com",
      name: "System Admin",
      role: "admin",
      passwordHash,
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: user,
      update: {
        name: user.name,
        role: user.role,
        passwordHash: user.passwordHash,
      },
    });
    console.log(`  ✓ Seeded user: ${user.email} (${user.role})`);
  }

  console.log("Seeding curriculum courses...");
  await seedCurriculum();

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});