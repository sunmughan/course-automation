import { prisma } from "@/lib/db";
import { ALL_COURSES } from "./course-catalog";

export async function seedCurriculum() {
  console.log(`Starting database seeding for ${ALL_COURSES.length} enterprise courses...`);

  for (const course of ALL_COURSES as any[]) {
    console.log(`Creating course: ${course.title} (${course.stream})`);

    const createdCourse = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        stream: course.stream,
        imageUrl: course.imageUrl ?? null,
        order: course.order ?? 0,
        published: true,
      },
      create: {
        title: course.title,
        description: course.description,
        slug: course.slug,
        stream: course.stream,
        imageUrl: course.imageUrl ?? null,
        order: course.order ?? 0,
        published: true,
      },
    });

    const modulesList = course.modules || [];
    for (let mIdx = 0; mIdx < modulesList.length; mIdx++) {
      const module = modulesList[mIdx];
      const createdModule = await prisma.module.upsert({
        where: {
          courseId_slug: {
            courseId: createdCourse.id,
            slug: module.slug,
          },
        },
        update: {
          title: module.title,
          description: module.description,
          order: mIdx + 1,
          published: true,
        },
        create: {
          title: module.title,
          description: module.description,
          slug: module.slug,
          order: mIdx + 1,
          courseId: createdCourse.id,
          published: true,
        },
      });

      for (let i = 0; i < (module.topics || []).length; i++) {
        const topic = module.topics[i];

        const createdTopic = await prisma.topic.upsert({
          where: {
            moduleId_slug: {
              moduleId: createdModule.id,
              slug: topic.slug,
            },
          },
          update: {
            title: topic.title,
            description: topic.description,
            difficulty: topic.difficulty,
            published: true,
            order: i + 1,
          },
          create: {
            title: topic.title,
            description: topic.description,
            slug: topic.slug,
            difficulty: topic.difficulty,
            moduleId: createdModule.id,
            order: i + 1,
            published: true,
          },
        });

        const createdLesson = await prisma.lesson.upsert({
          where: {
            topicId_slug: {
              topicId: createdTopic.id,
              slug: topic.slug,
            },
          },
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
            order: i + 1,
            difficultyLevel: topic.difficulty,
            topicId: createdTopic.id,
            published: true,
          },
        });

        await prisma.concept.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.concepts && topic.concepts.length > 0) {
          await prisma.concept.createMany({
            data: topic.concepts.map((c: any, idx: number) => ({
              title: c.title,
              description: c.description,
              lessonId: createdLesson.id,
              order: idx + 1,
            })),
          });
        }

        await prisma.example.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.examples && topic.examples.length > 0) {
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

        await prisma.exercise.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.exercises && topic.exercises.length > 0) {
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

        await prisma.visualization.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.visualizations && topic.visualizations.length > 0) {
          await prisma.visualization.createMany({
            data: topic.visualizations.map((v: any) => ({
              type: v.type,
              title: v.title,
              config: v.config,
              lessonId: createdLesson.id,
            })),
          });
        }
      }
    }
  }

  console.log("✨ All courses seeded successfully!");
}
