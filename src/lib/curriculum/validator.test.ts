import { describe, it, expect, vi } from "vitest";
import { auditCourseQuality } from "@/lib/curriculum/validator";
import { prisma } from "@/lib/db";

describe("6-Dimensional Deep Pedagogical Curriculum Validator", () => {
  it("audits courses across content, pedagogy, executability, visualization, assessment, and mastery", async () => {
    // Mock prisma course with complete lessons
    vi.spyOn(prisma.course, "findUnique").mockResolvedValueOnce({
      id: "course_1",
      title: "Fullstack Next.js",
      modules: [
        {
          id: "mod_1",
          title: "Next.js Fundamentals",
          topics: [
            {
              id: "topic_1",
              title: "Server Components & App Router",
              slug: "server-components",
              description: "Deep dive into React Server Components and App Router architecture with strict streaming boundaries",
              difficulty: 3,
              order: 0,
              prerequisites: [],
              lessons: [
                {
                  id: "les_1",
                  title: "RSC Architecture",
                  concepts: [
                    {
                      title: "Server vs Client",
                      description: "Server components render on server without client-side bundle impact, enabling direct database and secret access.",
                    },
                    {
                      title: "Streaming & Suspense",
                      description: "Progressive rendering allows fast Time To First Byte and streams HTML chunks directly as promises resolve.",
                    },
                  ],
                  examples: [
                    {
                      title: "Async Server Component",
                      description: "Fetching data directly inside async component without client-side state hooks or loading spinners.",
                      starterCode: "async function Page() {}",
                      solutionCode: "export default async function Page() { const data = await db.user.findMany(); return <div>{data.length}</div>; }",
                    },
                  ],
                  exercises: [
                    {
                      title: "Build Server Feed",
                      starterCode: "export default async function Feed() {}",
                      testCases: "Feed renders list from db",
                    },
                  ],
                  visualizations: [
                    {
                      type: "flowchart",
                      title: "RSC Data Flow",
                      config: JSON.stringify({ nodes: [{ id: "srv", label: "Server" }, { id: "clt", label: "Client" }] }),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as any);

    const audit = await auditCourseQuality("course_1");
    expect(audit.courseTitle).toBe("Fullstack Next.js");
    expect(audit.totalTopics).toBe(1);
    expect(audit.overallScore).toBeGreaterThanOrEqual(85);
    expect(audit.certifiedTopicsCount).toBe(1);
    expect(audit.incompleteTopics.length).toBe(0);
  });
});
