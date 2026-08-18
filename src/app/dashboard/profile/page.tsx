"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Play,
  Zap,
  Loader2,
} from "lucide-react";

interface TrackItem {
  id: string;
  title: string;
  slug: string;
  tag: string;
  sequence: string;
  description: string;
}

const CAREER_TRACKS: TrackItem[] = [
  {
    id: "frontend",
    title: "🌐 Complete Frontend Engineering Career Roadmap",
    slug: "complete-frontend-career-roadmap",
    tag: "HTML5 ➔ CSS3 ➔ JavaScript ➔ TypeScript ➔ React.js (60 Ch)",
    sequence: "Phase 1: HTML5 ➔ Phase 2-3: CSS3 ➔ Phase 4: JS Core ➔ Phase 5: TS ➔ Phase 6: React.js",
    description: "Complete frontend curriculum from HTML5/CSS3 to modern React.js with hooks and TypeScript.",
  },
  {
    id: "backend",
    title: "⚙️ Complete Node.js & Express Backend Enterprise Mastery",
    slug: "nodejs-backend-mastery",
    tag: "Node.js (110 Chapters) ➔ Express ➔ REST APIs ➔ Databases",
    sequence: "V8 Internals ➔ Modules ➔ Async/Streams ➔ Express ➔ DB Integrations ➔ PM2 DevOps",
    description: "110 chapters of exhaustive Node.js backend engineering, APIs, databases, and microservices.",
  },
  {
    id: "fullstack",
    title: "🔗 Complete Full-Stack (MERN & PERN) Enterprise Roadmap",
    slug: "complete-fullstack-enterprise-roadmap",
    tag: "React ➔ Node.js ➔ Express ➔ PostgreSQL ➔ MongoDB ➔ Next.js",
    sequence: "Modern UI ➔ Backend APIs ➔ Full-Stack Architecture ➔ Enterprise Deployment",
    description: "End-to-end full-stack development mastering frontend, backend, databases, and cloud DevOps.",
  },
  {
    id: "ai",
    title: "🤖 AI, Large Language Models & Prompt Engineering Enterprise Mastery",
    slug: "ai-prompt-engineering",
    tag: "Prompt Engineering ➔ LLMs ➔ Autonomous Agents ➔ MCP Protocol",
    sequence: "Prompt Design ➔ Context Windows ➔ Tool Calling ➔ Autonomous RAG Agents",
    description: "Master AI workflows, LLM orchestration, prompt optimization, and AI agents.",
  },
  {
    id: "android",
    title: "📱 Android Native Architecture & Kotlin Mastery",
    slug: "android-native-architecture",
    tag: "Java Core ➔ Kotlin ➔ Android SDK (268 Chapters)",
    sequence: "UI Components ➔ Activities & Fragments ➔ Jetpack ➔ Retrofit ➔ Play Store",
    description: "268 chapters covering deep native Android app architecture and mobile engineering.",
  },
  {
    id: "ios",
    title: "🍎 iOS Native Development Mastery & Swift",
    slug: "ios-native-mastery",
    tag: "Swift Core ➔ Objective-C ➔ iOS SDK (212 Chapters)",
    sequence: "Swift Syntax ➔ UIKit & SwiftUI ➔ CoreData ➔ Networking ➔ App Store",
    description: "212 chapters of deep Apple iOS native development and architecture.",
  },
  {
    id: "python",
    title: "📊 Python 3 Professional Mastery & Data Science",
    slug: "python-professional-mastery",
    tag: "Python Core ➔ OOP ➔ Data Structures ➔ Libraries (203 Chapters)",
    sequence: "Python Fundamentals ➔ OOP ➔ Pandas/Numpy ➔ Data Engineering",
    description: "203 chapters covering full Python language mastery, data processing, and scripting.",
  },
  {
    id: "cs",
    title: "💻 Computer Science & Algorithms (DSA)",
    slug: "algorithms-dsa-mastery",
    tag: "C Core ➔ C++ Modern (148 Ch) ➔ Algorithms (58 Ch)",
    sequence: "Data Structures ➔ Sorting & Searching ➔ Graphs & Trees ➔ Dynamic Programming",
    description: "Foundational computer science, data structures, and algorithmic problem solving.",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [legalName, setLegalName] = useState("");
  const [targetRole, setTargetRole] = useState(CAREER_TRACKS[0].title);
  const [collegeOrOrg, setCollegeOrOrg] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saved, setSaved] = useState(false);
  const [switchingTrackId, setSwitchingTrackId] = useState<string | null>(null);
  const [switchSuccessMsg, setSwitchSuccessMsg] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const fetchCoursesData = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const res = await fetch("/api/courses", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const courses = data.courses || [];
        setAllCourses(courses);
        const enrolled = courses.filter((c: any) => c.isEnrolled || c.progress > 0);
        setEnrolledCourses(enrolled);
      }
    } catch {
      // silent
    } finally {
      setLoadingCourses(false);
    }
  }, []);

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
    fetchCoursesData();
  }, [fetchCoursesData]);

  const handleSave = async () => {
    if (!user) return;
    localStorage.setItem(`certificate_name_${user.id}`, legalName.trim());
    localStorage.setItem(`target_role_${user.id}`, targetRole);
    localStorage.setItem(`org_${user.id}`, collegeOrOrg.trim());
    localStorage.setItem(`phone_${user.id}`, phoneNumber.trim());

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Instant 1-Click Track Switch & Auto-Enrollment
  const handleSwitchTrack = async (track: TrackItem) => {
    setSwitchingTrackId(track.id);
    setSwitchSuccessMsg(null);

    try {
      // Find course in catalog by slug
      const targetCourse = allCourses.find((c) => c.slug === track.slug) || { id: track.slug };
      const enrollUrl = `/api/courses/${targetCourse.id || track.slug}/enroll`;

      const res = await fetch(enrollUrl, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setTargetRole(track.title);
        if (user) {
          localStorage.setItem(`target_role_${user.id}`, track.title);
        }
        await fetchCoursesData();
        setSwitchSuccessMsg(`✓ Switched to "${track.title}"! All phases and lessons are now unlocked.`);
      } else {
        // Fallback: update local role
        setTargetRole(track.title);
        if (user) {
          localStorage.setItem(`target_role_${user.id}`, track.title);
        }
        setSwitchSuccessMsg(`✓ Active track switched to "${track.title}".`);
      }
    } catch {
      setTargetRole(track.title);
      setSwitchSuccessMsg(`✓ Active track switched to "${track.title}".`);
    } finally {
      setSwitchingTrackId(null);
      setTimeout(() => setSwitchSuccessMsg(null), 6000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Student Account &amp; Course Switcher
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Profile &amp; Course Switching
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Switch your active course anytime or jump straight into Frontend, React, Node.js, AI, and Mobile classrooms.
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

      {switchSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-mono flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
            <span>{switchSuccessMsg}</span>
          </div>
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shrink-0 cursor-pointer"
            onClick={() => {
              const matched = CAREER_TRACKS.find((t) => t.title === targetRole);
              if (matched) router.push(`/dashboard/courses/${matched.slug}`);
            }}
          >
            Open Course ▶
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Course Switcher & Credentials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: 1-Click Course & Career Track Switcher */}
          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="size-4 text-amber-400 fill-current" />
                  <span>Instant Course &amp; Track Switcher (1-Click)</span>
                </CardTitle>
                <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/30 text-[10px] font-mono font-bold">
                  Free Track Switching
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Agar aapko kisi dusre course (jaise Frontend Complete, React, Node.js) me switch karna hai, to niche kisi bhi course par click karke turant switch karein!
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              {CAREER_TRACKS.map((t) => {
                const isSelected = targetRole === t.title;
                const isSwitching = switchingTrackId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`w-full p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs ${
                      isSelected
                        ? "bg-sky-950/80 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-md"
                        : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white font-mono leading-tight">
                          {t.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 font-bold font-mono">
                              Active Track ✓
                            </Badge>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold cursor-pointer rounded-lg flex items-center gap-1 shadow-xs"
                              onClick={() => router.push(`/dashboard/courses/${t.slug}`)}
                            >
                              <Play className="size-3 fill-current" />
                              <span>Go to Course ▶</span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isSwitching}
                            onClick={() => handleSwitchTrack(t)}
                            className="h-7 px-3 text-[11px] bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-200 border border-slate-700 font-mono font-bold cursor-pointer rounded-lg flex items-center gap-1 transition-all"
                          >
                            {isSwitching ? (
                              <>
                                <Loader2 className="size-3 animate-spin" />
                                <span>Enrolling...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="size-3 text-amber-400 fill-current" />
                                <span>Enroll</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-sky-300 font-mono bg-slate-900/90 border border-slate-800/80 p-2 rounded-xl flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold shrink-0">PATH:</span>
                      <span className="truncate">{t.sequence}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Card 2: Official Certificate Credentials */}
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
        </div>

        {/* Right 1 Col: Live Certificate Preview & Active Enrollments */}
        <div className="space-y-6">
          {/* Active Enrollments Overview */}
          <Card className="bg-slate-900/80 border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                <BookOpen className="size-3.5 text-emerald-400" />
                <span>My Enrolled Courses ({enrolledCourses.length})</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-sky-400 hover:text-white cursor-pointer"
                onClick={fetchCoursesData}
              >
                <RefreshCw className="size-3 mr-1" />
                Refresh
              </Button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {enrolledCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white truncate">{c.title}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-300 text-[9px] shrink-0 font-mono">
                      {Math.round(c.progress || 0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{c.stream || "Course"}</span>
                    <Link
                      href={`/dashboard/courses/${c.slug || c.id}`}
                      className="text-[10px] font-mono font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
                    >
                      <span>Open Classroom</span>
                      <ArrowRight className="size-2.5" />
                    </Link>
                  </div>
                </div>
              ))}
              {enrolledCourses.length === 0 && !loadingCourses && (
                <p className="text-xs text-slate-500 text-center py-4 font-mono">
                  No courses enrolled yet. Select a course on the left to switch &amp; enroll!
                </p>
              )}
            </div>
          </Card>

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
              <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-mono max-w-full truncate">
                {targetRole}
              </Badge>
              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>ISSUER: SKILLFORGE</span>
                <span>STATUS: AUTHENTICATED</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
