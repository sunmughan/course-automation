import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInactivityMotivationEmail } from "@/lib/email";

export async function GET() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const inactiveEnrollments = await (prisma as any).enrolledCourse.findMany({
      where: {
        enrolledAt: { lt: oneWeekAgo },
        progress: { lt: 100 },
        status: "active",
      },
      include: {
        user: true,
        course: true,
      },
      take: 50,
    });

    let sentCount = 0;
    for (const enrollment of inactiveEnrollments) {
      if (enrollment.user?.email && enrollment.course?.title) {
        await sendInactivityMotivationEmail(
          enrollment.user.email,
          enrollment.user.name || "Student",
          enrollment.course.title,
          Math.round(enrollment.progress || 0)
        );
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, processed: inactiveEnrollments.length, emailsSent: sentCount });
  } catch (error) {
    console.error("Inactivity cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
