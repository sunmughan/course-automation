import "dotenv/config";
import { prisma } from "../src/lib/db";
import { backendNodeJSCourse } from "../src/lib/curriculum/backend-nodejs-course";

async function main() {
  console.log("⚡ Seeding Clean Node.js Course (110 Chapters)...");

  const courseData = backendNodeJSCourse;

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
    const createdModule = await prisma.module.upsert({
      where: { courseId_slug: { courseId: course.id, slug: mod.slug } },
      update: { title: mod.title, description: mod.description, order: mIdx + 1, published: true },
      create: { title: mod.title, description: mod.description, slug: mod.slug, order: mIdx + 1, courseId: course.id, published: true },
    });

    for (let tIdx = 0; tIdx < mod.topics.length; tIdx++) {
      const topic = mod.topics[tIdx];
      const createdTopic = await prisma.topic.upsert({
        where: { moduleId_slug: { moduleId: createdModule.id, slug: topic.slug } },
        update: { title: topic.title, description: topic.description, difficulty: topic.difficulty, order: tIdx + 1, published: true },
        create: { title: topic.title, description: topic.description, slug: topic.slug, difficulty: topic.difficulty, order: tIdx + 1, moduleId: createdModule.id, published: true },
      });

      const createdLesson = await prisma.lesson.upsert({
        where: { topicId_slug: { topicId: createdTopic.id, slug: topic.slug } },
        update: {
          title: topic.lesson?.title ?? topic.title,
          content: topic.lesson?.content ?? topic.description,
          explanation: topic.lesson?.explanation ?? topic.description,
          difficultyLevel: topic.difficulty,
          published: true,
        },
        create: {
          title: topic.lesson?.title ?? topic.title,
          content: topic.lesson?.content ?? topic.description,
          explanation: topic.lesson?.explanation ?? topic.description,
          slug: topic.slug,
          order: tIdx + 1,
          difficultyLevel: topic.difficulty,
          topicId: createdTopic.id,
          published: true,
        },
      });

      if (topic.examples && topic.examples.length > 0) {
        await prisma.example.deleteMany({ where: { lessonId: createdLesson.id } });
        await prisma.example.createMany({
          data: topic.examples.map((e: any) => ({
            title: e.title,
            description: e.description,
            starterCode: e.starterCode,
            solutionCode: e.solutionCode,
            testCases: e.testCases ?? null,
            expectedOutput: e.expectedOutput ?? null,
            lessonId: createdLesson.id,
          })),
        });
      }

      if (topic.exercises && topic.exercises.length > 0) {
        await prisma.exercise.deleteMany({ where: { lessonId: createdLesson.id } });
        await prisma.exercise.createMany({
          data: topic.exercises.map((ex: any) => ({
            title: ex.title,
            description: ex.description,
            instructions: ex.instructions ?? ex.description,
            starterCode: ex.starterCode,
            solutionCode: ex.solutionCode || ex.starterCode || "",
            testCases: ex.testCases || null,
            hints: Array.isArray(ex.hints) ? ex.hints.join(", ") : (ex.hints ? String(ex.hints) : null),
            difficulty: ex.difficulty ?? topic.difficulty,
            lessonId: createdLesson.id,
          })),
        });
      }
    }
    console.log(`  ✓ Seeded Phase ${mIdx + 1}: ${mod.title}`);
  }

  console.log("🎉 Node.js 110 Chapters Clean Seed Completed Successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
