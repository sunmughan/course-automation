import nodemailer from "nodemailer";

// SMTP configuration for updates@codeair.tech
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "127.0.0.1",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || "",
      }
    : undefined,
  tls: {
    rejectUnauthorized: false,
  },
});

const SENDER_EMAIL = process.env.SMTP_FROM || "CodeCraft Classroom <updates@codeair.tech>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://classroom.codeair.tech";

/**
 * 1. Send Welcome Email on Account Creation / Onboarding
 */
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 24px; font-weight: 800; font-family: monospace; color: #38bdf8; margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px; }
        .btn { display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 12px; }
        .footer { margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">CodeCraft</div>
        <h1>Welcome to CodeCraft Classroom, ${name}! 🚀</h1>
        <p>Aapka account successfully setup ho chuka hai. Ab aap enterprise-grade curriculums, interactive coding playgrounds, real-time visual execution diagrams aur senior industry capstone projects access kar sakte hain.</p>
        <p>Apna career track explore karein aur pehla interactive lesson start karein:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/dashboard/courses" class="btn">Explore All Courses ▶</a>
        </div>
        <p>Happy Learning &amp; Coding,<br><strong>CodeCraft Academic &amp; Engineering Team</strong></p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CodeCraft.ai · Automated Educational Notifications from updates@codeair.tech
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject: "Welcome to CodeCraft! Start your Engineering Mastery Journey 🚀",
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}

/**
 * 2. Send Official Certificate of Completion Email
 */
export async function sendCertificateEmail(
  to: string,
  name: string,
  courseTitle: string,
  certificateId: string
) {
  try {
    const certUrl = `${BASE_URL}/verify/${certificateId}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 24px; font-weight: 800; font-family: monospace; color: #38bdf8; margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 8px; font-weight: 700; font-size: 12px; margin-bottom: 16px; font-family: monospace; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px; }
        .cert-box { background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .cert-id { font-family: monospace; font-size: 13px; color: #38bdf8; font-weight: bold; margin-top: 8px; }
        .btn { display: inline-block; background: #10b981; color: #020617; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 14px; margin-top: 12px; }
        .footer { margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">CodeCraft</div>
        <div class="badge">OFFICIAL VERIFIED CREDENTIAL</div>
        <h1>Congratulations, ${name}! 🎓</h1>
        <p>Aapne successfully <strong>${courseTitle}</strong> ke sabhi learning phases, live flow diagrams aur practical coding modules complete kar liye hain!</p>
        <div class="cert-box">
          <div style="font-size: 16px; font-weight: bold; color: #ffffff;">Verified Certificate of Completion</div>
          <div class="cert-id">Certificate ID: ${certificateId}</div>
          <a href="${certUrl}" class="btn">View &amp; Download Verified Certificate 📜</a>
        </div>
        <p>Aap is verified link ko apne LinkedIn profile, resume aur portfolio me share kar sakte hain.</p>
        <p>Best wishes for your career,<br><strong>CodeCraft Examination &amp; Certification Board</strong></p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CodeCraft.ai · Cryptographically Verified Credential via updates@codeair.tech
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject: `🎓 Congratulations! Your Certificate for ${courseTitle} is ready`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send certificate email:", error);
    return { success: false, error };
  }
}

/**
 * 3. Send Motivational Inactivity Reminder (> 7 Days Inactive)
 */
export async function sendInactivityMotivationEmail(
  to: string,
  name: string,
  courseTitle: string,
  progressPercentage: number
) {
  try {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 24px; font-weight: 800; font-family: monospace; color: #38bdf8; margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px; }
        .progress-box { background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .btn { display: inline-block; background: #f59e0b; color: #020617; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 14px; margin-top: 12px; }
        .footer { margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">CodeCraft</div>
        <h1>Hey ${name}, Keep the Momentum Going! ⚡</h1>
        <p>Great developers daily thoda-thoda code karke mastery achieve karte hain. Aapne <strong>${courseTitle}</strong> me already <strong>${progressPercentage}%</strong> progress bana li hai!</p>
        <div class="progress-box">
          <div style="font-size: 13px; color: #cbd5e1; font-family: monospace;">Current Track: <strong>${courseTitle}</strong> (${progressPercentage}% Completed)</div>
          <div style="font-size: 12px; color: #38bdf8; margin-top: 6px;">Next target: Finish the next interactive phase today!</div>
        </div>
        <p>Sirf 15-20 minute nikal kar agla lesson complete karein aur apne goal ke aur kareeb pahuchein:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/dashboard/courses" class="btn">Resume Learning Now ▶</a>
        </div>
        <p>We are always here to support your engineering journey,<br><strong>Your Mentors at CodeCraft</strong></p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CodeCraft.ai · Personalized Student Motivation from updates@codeair.tech
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject: `⚡ Keep going, ${name}! Your next milestone in ${courseTitle} is waiting`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send inactivity motivation email:", error);
    return { success: false, error };
  }
}
