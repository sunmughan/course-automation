import { prisma } from "@/lib/db";

export interface AdminMetrics {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  students: number;
  instructors: number;
  activeSubscriptions: number;
  recentAuditCount: number;
}

export interface InstructorMetrics {
  totalBatches: number;
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageCompletion: number;
  activeInterventions: number;
  notStartedStudents: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const activeSince = new Date();
  activeSince.setDate(activeSince.getDate() - 30);

  const auditSince = new Date();
  auditSince.setDate(auditSince.getDate() - 7);

  const [
    totalOrganizations,
    totalUsers,
    students,
    instructors,
    activeAuditLogs,
    activeSubscriptions,
    recentAuditCount,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "student" } }),
    prisma.user.count({ where: { role: "instructor" } }),
    prisma.auditLog.findMany({
      where: {
        createdAt: { gte: activeSince },
        userId: { not: null },
      },
      select: { userId: true },
    }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.auditLog.count({ where: { createdAt: { gte: auditSince } } }),
  ]);

  return {
    totalOrganizations,
    totalUsers,
    activeUsers: new Set(
      activeAuditLogs.flatMap((entry) =>
        entry.userId === null ? [] : [entry.userId]
      )
    ).size,
    students,
    instructors,
    activeSubscriptions,
    recentAuditCount,
  };
}

export async function getInstructorMetrics(
  instructorId: string
): Promise<InstructorMetrics> {
  const [totalBatches, batches, activeInterventions] = await Promise.all([
    prisma.batch.count({ where: { instructorId } }),
    prisma.batch.findMany({
      where: { instructorId },
      select: {
        isActive: true,
        students: { select: { studentId: true, status: true } },
      },
    }),
    prisma.intervention.count({
      where: { instructorId, status: "active" },
    }),
  ]);

  const memberships = batches.flatMap((batch) => batch.students);
  const studentIds = [...new Set(memberships.map((student) => student.studentId))];
  const activeStudentIds = new Set(
    memberships
      .filter((student) => student.status === "active")
      .map((student) => student.studentId)
  );

  const progress = studentIds.length
    ? await prisma.studentProgress.findMany({
        where: { userId: { in: studentIds } },
        select: { userId: true, status: true, score: true },
      })
    : [];

  const completedStudents = new Set(
    progress
      .filter((item) => item.status === "completed")
      .map((item) => item.userId)
  ).size;
  const studentsWithProgress = new Set(
    progress
      .filter((item) => item.status !== "not_started")
      .map((item) => item.userId)
  );
  const progressByStudent = new Map<string, typeof progress>();

  for (const item of progress) {
    const entries = progressByStudent.get(item.userId) ?? [];
    entries.push(item);
    progressByStudent.set(item.userId, entries);
  }

  const averageCompletion = studentIds.length
    ? Math.round(
        studentIds.reduce((sum, studentId) => {
          const entries = progressByStudent.get(studentId) ?? [];
          const studentCompleted = entries.filter(
            (item) => item.status === "completed"
          ).length;
          return sum + (entries.length ? studentCompleted / entries.length : 0);
        }, 0) /
          studentIds.length *
          100
      )
    : 0;

  return {
    totalBatches,
    totalStudents: studentIds.length,
    activeStudents: activeStudentIds.size,
    completionRate: studentIds.length
      ? Math.round((completedStudents / studentIds.length) * 100)
      : 0,
    averageCompletion,
    activeInterventions,
    notStartedStudents: studentIds.length - studentsWithProgress.size,
  };
}
