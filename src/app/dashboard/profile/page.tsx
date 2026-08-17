"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  Award,
  Sparkles,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Phone,
  Mail,
  Building,
  RefreshCw,
} from "lucide-react";

const CAREER_TRACKS = [
  { id: "frontend", title: "🌐 Frontend Web Developer", slug: "html5-css3-masterclass", sequence: "HTML5 ➔ CSS3 ➔ JavaScript ➔ TypeScript ➔ React.js" },
  { id: "backend", title: "⚙️ Backend Enterprise Engineer", slug: "nodejs-backend-mastery", sequence: "Node.js (110 Ch) ➔ MySQL ➔ MongoDB ➔ PHP 8" },
  { id: "fullstack", title: "🔗 Full-Stack (MERN & PERN) Engineer", slug: "complete-fullstack-enterprise-roadmap", sequence: "React ➔ Node/Express ➔ PostgreSQL/Mongo ➔ Next.js" },
  { id: "android", title: "📱 Android Native Developer", slug: "android-native-architecture", sequence: "Java Core ➔ Kotlin ➔ Android SDK (268 Chapters)" },
  { id: "ios", title: "🍎 iOS Native Developer", slug: "ios-native-mastery", sequence: "Swift Core ➔ Objective-C ➔ iOS Native (212 Chapters)" },
  { id: "datascience", title: "📊 Data Science & AI Engineer", slug: "python-professional-mastery", sequence: "Python 3 (203 Ch) ➔ R ➔ AI Prompt Engineering" },
  { id: "cs", title: "💻 Computer Science & Algorithms (DSA)", slug: "algorithms-dsa-mastery", sequence: "C Core ➔ C++ Modern (148 Ch) ➔ Algorithms (58 Ch)" },
];

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [legalName, setLegalName] = useState("");
  const [targetRole, setTargetRole] = useState(CAREER_TRACKS[0].title);
  const [collegeOrOrg, setCollegeOrOrg] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saved, setSaved] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const savedName = localStorage.getItem(`certificate_name_${user.id}`) || user.name || "";
      const savedRole = localStorage.getItem(`target_role_${user.id}`) || CAREER_TRACKS[0].title;
      const savedOrg = localStorage.getItem(`org_${user.id}`) || "";
      const savedPhone = localStorage.getItem(`phone_${user.id}`) || "";

      setLegalName(savedName);
      setTargetRole(savedRole);
      setCollegeOrOrg(savedOrg);
      setPhoneNumber(savedPhone);
    }
  }, [user]);

  useEffect(() => {
    async function fetchEnrolled() {
      try {
        const res = await fetch("/api/courses", { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const enrolled = (data.courses || []).filter((c: any) => c.isEnrolled || c.progress > 0);
          setEnrolledCourses(enrolled);
        }
      } catch {
        // silent
      }
    }
    fetchEnrolled();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    localStorage.setItem(`certificate_name_${user.id}`, legalName.trim());
    localStorage.setItem(`target_role_${user.id}`, targetRole);
    localStorage.setItem(`org_${user.id}`, collegeOrOrg.trim());
    localStorage.setItem(`phone_${user.id}`, phoneNumber.trim());

    // Switch track enrollment if needed
    const matchedTrack = CAREER_TRACKS.find((t) => t.title === targetRole);
    if (matchedTrack) {
      try {
        const coursesRes = await fetch("/api/courses", { headers: getAuthHeaders() });
        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          const targetCourse = cData.courses?.find((c: any) => c.slug === matchedTrack.slug);
          if (targetCourse?.id) {
            await fetch(`/api/courses/${targetCourse.id}/enroll`, {
              method: "POST",
              headers: getAuthHeaders(),
            });
          }
        }
      } catch {
        // silent
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Student Account &amp; Engineering Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Profile &amp; Career Roadmap Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your legal certificate name, primary career track, and enrolled curriculum.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-10 px-5 gap-1.5 cursor-pointer shadow-lg"
        >
          <CheckCircle2 className="size-4" />
          {saved ? "Profile Saved ✓" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Official Certificate Credentials */}
          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="size-4 text-amber-400" />
                Official Certificate Legal Name
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                This name will be embossed on all course completion certificates and employer transcripts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Legal Name:</label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Sunmugan Swami"
                  className="bg-slate-950 border-slate-800 text-sm font-bold h-11 text-white focus-visible:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Building className="size-3 text-slate-400" />
                    College / University / Company:
                  </label>
                  <Input
                    value={collegeOrOrg}
                    onChange={(e) => setCollegeOrOrg(e.target.value)}
                    placeholder="e.g. IIT Bombay"
                    className="bg-slate-950 border-slate-800 text-xs h-10 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Phone className="size-3 text-slate-400" />
                    Phone / WhatsApp (Optional):
                  </label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="bg-slate-950 border-slate-800 text-xs h-10 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Active Career Specialization Track */}
          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="size-4 text-sky-400" />
                Primary Engineering Career Track
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Switching your track auto-enrolls you into the prerequisite courses of your chosen path.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {CAREER_TRACKS.map((t) => {
                const isSelected = targetRole === t.title;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTargetRole(t.title)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? "bg-sky-950/80 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{t.title}</span>
                      {isSelected && (
                        <Badge className="bg-sky-500 text-slate-950 text-[9px] px-1.5 py-0 font-bold">
                          Active Path
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-sky-300 font-mono block bg-slate-900/90 p-1 rounded">
                      {t.sequence}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Live Certificate Preview & Active Enrollments */}
        <div className="space-y-6">
          {/* Certificate Live Mockup */}
          <Card className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <Award className="size-3.5" />
                Live Certificate Preview
              </span>
              <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300">
                Verified ID
              </Badge>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/20 text-center space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                Certificate of Engineering Excellence
              </span>
              <h3 className="text-base font-extrabold text-amber-300 font-serif tracking-wide">
                {legalName.trim() || user?.name || "Student Name"}
              </h3>
              <p className="text-[10px] text-slate-400">
                has demonstrated professional mastery in
              </p>
              <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {targetRole}
              </Badge>
              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>ISSUER: SKILLFORGE ACADEMY</span>
                <span>STATUS: AUTHENTICATED</span>
              </div>
            </div>
          </Card>

          {/* Active Enrollments Overview */}
          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase">
              <BookOpen className="size-3.5 text-emerald-400" />
              Enrolled Courses ({enrolledCourses.length})
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {enrolledCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <span className="font-medium text-slate-200 truncate pr-2">{c.title}</span>
                  <Badge className="bg-emerald-500/10 text-emerald-300 text-[9px] shrink-0">
                    {Math.round(c.progress || 0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
