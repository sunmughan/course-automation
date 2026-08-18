import "dotenv/config";
import { prisma } from "../src/lib/db";
import { frontendCareerRoadmapCourse } from "../src/lib/curriculum/frontend-career-roadmap";

async function main() {
  console.log("⚡ Seeding Frontend Career Roadmap with Clear Phase Titles...");

  const courseData = frontendCareerRoadmapCourse;

  const course = await prisma.course.upsert({
    where: { slug: courseData.slug },
    update: {
      title: courseData.title,
      description: courseData.description,
      stream: courseData.stream,
      imageUrl: courseData.imageUrl,
      order: courseData.order,
      published: true,
    },
    create: {
      title: courseData.title,
      description: courseData.description,
      slug: courseData.slug,
      stream: courseData.stream,
      imageUrl: courseData.imageUrl,
      order: courseData.order,
      published: true,
    },
  });

  console.log(`✓ Upserted Course: ${course.title} (ID: ${course.id})`);

  for (let mIdx = 0; mIdx < courseData.modules.length; mIdx++) {
    const mod = courseData.modules[mIdx];
    
    // First find by order or slug
    let existingMod = await prisma.module.findFirst({
      where: { courseId: course.id, order: mIdx + 1 }
    });

    let createdModule;
    if (existingMod) {
      createdModule = await prisma.module.update({
        where: { id: existingMod.id },
        data: { title: mod.title, description: mod.description, slug: mod.slug, order: mIdx + 1, published: true }
      });
    } else {
      createdModule = await prisma.module.create({
        data: { title: mod.title, description: mod.description, slug: mod.slug, order: mIdx + 1, courseId: course.id, published: true }
      });
    }

    console.log(`  ✓ Updated Phase ${mIdx + 1}: ${createdModule.title}`);
  }

  console.log("🎉 Frontend Career Roadmap Clean Phase Names Seeded Successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
