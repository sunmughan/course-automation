import "dotenv/config";
import { seedCurriculum } from "../src/lib/curriculum/seed";

async function main() {
  console.log("Seeding database...");
  await seedCurriculum();
  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});