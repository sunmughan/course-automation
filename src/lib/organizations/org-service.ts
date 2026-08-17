import { prisma } from "@/lib/db";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  customDomain?: string;
  creatorUserId: string;
}

export interface CreateBatchInput {
  organizationId?: string;
  departmentId?: string;
  instructorId: string;
  courseId?: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateDepartmentInput {
  organizationId: string;
  name: string;
  description?: string;
  parentId?: string;
}

export class OrganizationService {
  /**
   * Creates a new organization and assigns the creator as owner.
   */
  static async createOrganization(input: CreateOrganizationInput) {
    const { name, slug, description, logoUrl, primaryColor, accentColor, customDomain, creatorUserId } = input;

    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`Organization slug "${slug}" is already taken`);
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        logoUrl,
        primaryColor: primaryColor || "#3B82F6",
        accentColor: accentColor || "#8B5CF6",
        customDomain,
        members: {
          create: {
            userId: creatorUserId,
            role: "owner",
            permissions: JSON.stringify(["*"]),
          },
        },
      },
      include: {
        members: true,
      },
    });

    return org;
  }

  /**
   * Retrieves an organization with its hierarchy and summary counts.
   */
  static async getOrganization(idOrSlug: string) {
    return prisma.organization.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        departments: {
          include: {
            _count: { select: { teams: true, batches: true } },
          },
        },
        batches: {
          include: {
            instructor: { select: { id: true, name: true, email: true } },
            course: { select: { id: true, title: true } },
            _count: { select: { students: true } },
          },
        },
        _count: { select: { members: true, departments: true, batches: true } },
      },
    });
  }

  /**
   * Creates a department in the organization.
   */
  static async createDepartment(input: CreateDepartmentInput) {
    const { organizationId, name, description, parentId } = input;

    return prisma.department.create({
      data: {
        organizationId,
        name,
        description,
        parentId: parentId || null,
      },
    });
  }

  /**
   * Creates a batch scoped to an organization and optional department.
   */
  static async createBatch(input: CreateBatchInput) {
    const { organizationId, departmentId, instructorId, courseId, name, description, startDate, endDate } = input;

    // Verify instructor exists
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new Error(`Instructor ${instructorId} not found`);
    }

    const batch = await prisma.batch.create({
      data: {
        organizationId: organizationId || null,
        departmentId: departmentId || null,
        instructorId,
        courseId: courseId || null,
        name,
        description,
        startDate,
        endDate,
        isActive: true,
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return batch;
  }

  /**
   * Enrolls multiple students in a batch.
   */
  static async enrollStudentsInBatch(batchId: string, studentIds: string[]) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, organizationId: true },
    });

    if (!batch) throw new Error(`Batch ${batchId} not found`);

    const results = [];
    for (const studentId of studentIds) {
      const enrollment = await prisma.batchStudent.upsert({
        where: {
          batchId_studentId: { batchId, studentId },
        },
        create: {
          batchId,
          studentId,
          status: "active",
        },
        update: {
          status: "active",
        },
      });

      // If batch belongs to an organization, ensure student is registered as an org member
      if (batch.organizationId) {
        await prisma.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: batch.organizationId,
              userId: studentId,
            },
          },
          create: {
            organizationId: batch.organizationId,
            userId: studentId,
            role: "student",
          },
          update: {},
        });
      }

      results.push(enrollment);
    }

    return results;
  }

  /**
   * Assigns or updates the instructor for a batch.
   */
  static async assignInstructor(batchId: string, instructorId: string) {
    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor) throw new Error(`Instructor ${instructorId} not found`);

    return prisma.batch.update({
      where: { id: batchId },
      data: { instructorId },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Computes organization-level aggregated analytics across all departments and batches.
   */
  static async getOrganizationAnalytics(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        departments: { select: { id: true, name: true } },
        batches: {
          include: {
            students: { select: { studentId: true } },
          },
        },
      },
    });

    if (!org) throw new Error("Organization not found");

    const allStudentIds = [...new Set(org.batches.flatMap((b) => b.students.map((s) => s.studentId)))];

    const [progress, skills, aiSessions, executionEvents] = await Promise.all([
      allStudentIds.length
        ? prisma.studentProgress.findMany({
            where: { userId: { in: allStudentIds } },
            select: { status: true, score: true },
          })
        : [],
      allStudentIds.length
        ? prisma.studentSkill.findMany({
            where: { userId: { in: allStudentIds } },
            select: { score: true },
          })
        : [],
      allStudentIds.length
        ? prisma.aISession.count({
            where: { userId: { in: allStudentIds } },
          })
        : 0,
      allStudentIds.length
        ? prisma.analyticsEvent.count({
            where: { userId: { in: allStudentIds }, event: "code_execution" },
          })
        : 0,
    ]);

    const completedLessons = progress.filter((p) => p.status === "completed").length;
    const overallCompletionRate = progress.length > 0 ? Math.round((completedLessons / progress.length) * 100) : 0;

    const scores = progress.filter((p) => p.score !== null).map((p) => p.score!);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      organizationId: org.id,
      organizationName: org.name,
      totalDepartments: org.departments.length,
      totalBatches: org.batches.length,
      totalEnrolledStudents: allStudentIds.length,
      overallCompletionRate,
      averageScore,
      totalAiQuestions: aiSessions,
      totalCodeExecutions: executionEvents,
    };
  }

  /**
   * Verifies whether a user has access to an organization with required role.
   */
  static async verifyOrgAccess(userId: string, organizationId: string, requiredRoles: string[] = ["owner", "admin", "instructor", "member"]) {
    // Check if user is platform superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "admin") return true;

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!membership) return false;
    return requiredRoles.includes(membership.role);
  }
}
