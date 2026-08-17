import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    organizationMember: { findMany: vi.fn() },
    team: { count: vi.fn() },
    department: { count: vi.fn() },
    customCurriculum: { count: vi.fn() },
    customAIModel: { count: vi.fn() },
    policy: { count: vi.fn() },
    session: { findMany: vi.fn() },
    studentProgress: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getOrgOverview } from "@/lib/enterprise/analytics";

describe("organization analytics metrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates active users and completion rate from known Prisma data", async () => {
    prismaMock.organizationMember.findMany.mockResolvedValue([
      { userId: "instructor-1", role: "instructor" },
      { userId: "student-1", role: "member" },
      { userId: "student-2", role: "member" },
    ]);
    prismaMock.team.count.mockResolvedValue(1);
    prismaMock.department.count.mockResolvedValue(1);
    prismaMock.customCurriculum.count.mockResolvedValue(1);
    prismaMock.customAIModel.count.mockResolvedValue(1);
    prismaMock.policy.count.mockResolvedValue(1);
    prismaMock.session.findMany.mockResolvedValue([
      { userId: "instructor-1" },
      { userId: "student-1" },
      { userId: "student-1" },
    ]);
    prismaMock.studentProgress.findMany.mockResolvedValue([
      { status: "completed" },
      { status: "in_progress" },
      { status: "completed" },
      { status: "not_started" },
    ]);

    await expect(getOrgOverview("org-1")).resolves.toMatchObject({
      members: 3,
      instructors: 1,
      students: 2,
      activeUsers: 2,
      completionRate: 50,
    });
  });
});
