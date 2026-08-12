import "dotenv/config";
import { seedCurriculum } from "@/lib/curriculum/seed";
import { prisma } from "@/lib/db";

async function main() {
  console.log("Seeding curriculum data...");
  await seedCurriculum();
  console.log("Curriculum seeded successfully!");

  const courseCount = await prisma.course.count();
  const moduleCount = await prisma.module.count();
  const topicCount = await prisma.topic.count();
  const lessonCount = await prisma.lesson.count();

  console.log("Database summary:");
  console.log(`  Courses: ${courseCount}`);
  console.log(`  Modules: ${moduleCount}`);
  console.log(`  Topics: ${topicCount}`);
  console.log(`  Lessons: ${lessonCount}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });