import { describe, expect, it, vi, beforeEach } from "vitest";
import { OrganizationService } from "./org-service";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    department: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    batch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    batchStudent: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    organizationMember: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    studentProgress: {
      findMany: vi.fn(),
    },
    studentSkill: {
      findMany: vi.fn(),
    },
    aISession: {
      count: vi.fn(),
    },
    analyticsEvent: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

describe("Wave 19: Organization & Batch System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrganization", () => {
    it("creates an organization and assigns creator as owner", async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);
      prismaMock.organization.create.mockResolvedValue({
        id: "org-1",
        name: "Acme Tech Academy",
        slug: "acme-academy",
        members: [{ userId: "user-1", role: "owner" }],
      });

      const org = await OrganizationService.createOrganization({
        name: "Acme Tech Academy",
        slug: "acme-academy",
        creatorUserId: "user-1",
      });

      expect(org.id).toBe("org-1");
      expect(prismaMock.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Acme Tech Academy",
            slug: "acme-academy",
            members: {
              create: expect.objectContaining({
                userId: "user-1",
                role: "owner",
              }),
            },
          }),
        })
      );
    });

    it("throws error if organization slug already exists", async () => {
      prismaMock.organization.findUnique.mockResolvedValue({ id: "org-existing" });

      await expect(
        OrganizationService.createOrganization({
          name: "Acme Duplicate",
          slug: "acme-academy",
          creatorUserId: "user-1",
        })
      ).rejects.toThrow("already taken");
    });
  });

  describe("createBatch & enrollStudentsInBatch", () => {
    it("creates batch with instructor and course", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "inst-1", name: "Prof. Oak" });
      prismaMock.batch.create.mockResolvedValue({
        id: "batch-1",
        name: "Cohort 2026",
        organizationId: "org-1",
        instructorId: "inst-1",
      });

      const batch = await OrganizationService.createBatch({
        organizationId: "org-1",
        instructorId: "inst-1",
        name: "Cohort 2026",
      });

      expect(batch.id).toBe("batch-1");
      expect(prismaMock.batch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org-1",
            instructorId: "inst-1",
            name: "Cohort 2026",
          }),
        })
      );
    });

    it("enrolls students and ensures organization membership", async () => {
      prismaMock.batch.findUnique.mockResolvedValue({
        id: "batch-1",
        organizationId: "org-1",
      });

      prismaMock.batchStudent.upsert.mockResolvedValue({
        id: "bs-1",
        batchId: "batch-1",
        studentId: "s1",
        status: "active",
      });
      prismaMock.organizationMember.upsert.mockResolvedValue({});

      const result = await OrganizationService.enrollStudentsInBatch("batch-1", ["s1", "s2"]);

      expect(result).toHaveLength(2);
      expect(prismaMock.batchStudent.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.organizationMember.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe("getOrganizationAnalytics", () => {
    it("aggregates analytics across all org departments and batches", async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: "org-1",
        name: "Tech University",
        departments: [{ id: "d1", name: "Computer Science" }],
        batches: [
          {
            id: "b1",
            students: [{ studentId: "s1" }, { studentId: "s2" }],
          },
        ],
      });

      prismaMock.studentProgress.findMany.mockResolvedValue([
        { status: "completed", score: 90 },
        { status: "completed", score: 80 },
        { status: "in_progress", score: 50 },
      ]);

      prismaMock.studentSkill.findMany.mockResolvedValue([
        { score: 85 },
      ]);

      prismaMock.aISession.count.mockResolvedValue(45);
      prismaMock.analyticsEvent.count.mockResolvedValue(120);

      const analytics = await OrganizationService.getOrganizationAnalytics("org-1");

      expect(analytics.organizationName).toBe("Tech University");
      expect(analytics.totalDepartments).toBe(1);
      expect(analytics.totalBatches).toBe(1);
      expect(analytics.totalEnrolledStudents).toBe(2);
      expect(analytics.overallCompletionRate).toBe(67); // 2 of 3 completed = 66.67 -> 67%
      expect(analytics.averageScore).toBe(73); // (90+80+50)/3 = 73.33 -> 73%
      expect(analytics.totalAiQuestions).toBe(45);
      expect(analytics.totalCodeExecutions).toBe(120);
    });
  });

  describe("verifyOrgAccess", () => {
    it("authorizes platform superadmin automatically", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ role: "admin" });

      const hasAccess = await OrganizationService.verifyOrgAccess("admin-1", "org-1");
      expect(hasAccess).toBe(true);
    });

    it("verifies organization membership role", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ role: "instructor" });
      prismaMock.organizationMember.findUnique.mockResolvedValue({
        role: "instructor",
      });

      const hasAccess = await OrganizationService.verifyOrgAccess("inst-1", "org-1", ["owner", "admin", "instructor"]);
      expect(hasAccess).toBe(true);
    });

    it("denies access when user is not a member of organization", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ role: "student" });
      prismaMock.organizationMember.findUnique.mockResolvedValue(null);

      const hasAccess = await OrganizationService.verifyOrgAccess("stranger-1", "org-1");
      expect(hasAccess).toBe(false);
    });
  });
});
