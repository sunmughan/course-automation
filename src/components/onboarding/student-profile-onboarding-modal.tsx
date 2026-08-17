"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Award,
  ArrowRight,
  Briefcase,
  Layers,
  Flame,
  Code2,
  Server,
  Smartphone,
  Database,
  Cpu,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/fetch-helpers";

const CAREER_TRACK_OPTIONS = [
  {
    id: "frontend",
    title: "🌐 Frontend Web Developer",
    slug: "html5-css3-masterclass",
    sequence: "HTML5 ➔ CSS3 ➔ JavaScript ➔ TypeScript ➔ React.js",
    desc: "Master client-side UI engineering, component state, and responsive web design.",
  },
  {
    id: "backend",
    title: "⚙️ Backend Enterprise Engineer",
    slug: "nodejs-backend-mastery",
    sequence: "Node.js (110 Ch) ➔ MySQL ➔ MongoDB ➔ PHP 8 ➔ Microservices",
    desc: "Build high-scale REST APIs, non-blocking runtimes, and secure transactional databases.",
  },
  {
    id: "fullstack",
    title: "🔗 Full-Stack (MERN & PERN) Engineer",
    slug: "complete-fullstack-enterprise-roadmap",
    sequence: "React ➔ Node/Express ➔ PostgreSQL/Mongo ➔ Next.js ➔ Git",
    desc: "End-to-end full-stack software development from browser UI to production cloud.",
  },
  {
    id: "android",
    title: "📱 Android Native Developer",
    slug: "android-native-architecture",
    sequence: "Java Core ➔ Kotlin ➔ Android Native SDK (268 Chapters)",
    desc: "Native mobile app engineering with Room DB, Coroutines, and Jetpack Compose.",
  },
  {
    id: "ios",
    title: "🍎 iOS Native Developer",
    slug: "ios-native-mastery",
    sequence: "Swift Core ➔ Objective-C ➔ iOS Native (212 Chapters)",
    desc: "Apple mobile architecture with UIKit, SwiftUI, CoreData, and CocoaTouch.",
  },
  {
    id: "datascience",
    title: "📊 Data Science & AI Engineer",
    slug: "python-professional-mastery",
    sequence: "Python 3 (203 Ch) ➔ R Programming ➔ AI Prompt Engineering",
    desc: "Data analysis, machine learning pipelines, and generative AI LLM systems.",
  },
  {
    id: "cs",
    title: "💻 Computer Science & Algorithms (DSA)",
    slug: "algorithms-dsa-mastery",
    sequence: "C Core ➔ C++ Modern Systems (148 Ch) ➔ Data Structures & Algorithms",
    desc: "Low-level systems programming, memory allocation, and algorithmic problem solving.",
  },
];

export function StudentProfileOnboardingModal() {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [legalName, setLegalName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(CAREER_TRACK_OPTIONS[0].id);
  const [organizationOrCollege, setOrganizationOrCollege] = useState("");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open_onboarding_modal", handleOpen);

    if (typeof window !== "undefined" && user) {
      const hasOnboarded = localStorage.getItem(`onboarded_v2_${user.id}`);
      if (!hasOnboarded) {
        setLegalName(user.name || "");
        setIsOpen(true);
      }
    }
    return () => window.removeEventListener("open_onboarding_modal", handleOpen);
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const chosenTrack = CAREER_TRACK_OPTIONS.find((t) => t.id === selectedTrack) || CAREER_TRACK_OPTIONS[0];

      // Save locally & store certificate name preference
      localStorage.setItem(`onboarded_v2_${user.id}`, "true");
      localStorage.setItem(`certificate_name_${user.id}`, legalName.trim() || user.name || "Student");
      localStorage.setItem(`target_role_${user.id}`, chosenTrack.title);

      // Auto-enroll in the first course of the chosen track
      try {
        const coursesRes = await fetch("/api/courses", { headers: getAuthHeaders() });
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const targetCourse = coursesData.courses?.find((c: any) => c.slug === chosenTrack.slug);
          if (targetCourse?.id) {
            await fetch(`/api/courses/${targetCourse.id}/enroll`, {
              method: "POST",
              headers: getAuthHeaders(),
            });
          }
        }
      } catch {
        // ignore enrollment network failure
      }

      setIsOpen(false);
      window.location.reload();
    } catch {
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Onboarding Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                Student Onboarding · Step {step} of 2
              </span>
              <h2 className="text-base font-bold text-white">Choose Your Engineering Track</h2>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-300 font-mono">
            {step === 1 ? "1. Certificate Name" : "2. Career Roadmap"}
          </Badge>
        </div>

        {/* Step 1: Legal Name for Certificate */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                <Award className="size-4" />
                Certificate Printing Guarantee
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Please enter your <strong>Full Legal / Professional Name</strong> exactly as you want it permanently embossed on your course completion certificates and employer transcripts.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Your Full Legal Certificate Name:</label>
              <Input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Sunmugan Swami"
                className="bg-slate-950 border-slate-800 text-sm font-semibold h-11 focus-visible:ring-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">College / University / Company (Optional):</label>
              <Input
                value={organizationOrCollege}
                onChange={(e) => setOrganizationOrCollege(e.target.value)}
                placeholder="e.g. IIT Bombay / Independent Engineer"
                className="bg-slate-950 border-slate-800 text-xs h-10"
              />
            </div>

            <Button
              onClick={() => {
                if (!legalName.trim()) {
                  alert("Please enter your name for certificate issuance");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-10 gap-1.5 mt-2 cursor-pointer"
            >
              Next: Select Target Career Track
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Step 2: Learning Goal & Target Roadmap Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Your Primary Career Roadmap:
              </label>
              <p className="text-[11px] text-slate-400">
                You will be enrolled directly in Step 1 of your chosen roadmap. You can add more courses anytime from the course catalog.
              </p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {CAREER_TRACK_OPTIONS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    selectedTrack === track.id
                      ? "bg-sky-950/80 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-md"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{track.title}</span>
                    {selectedTrack === track.id && (
                      <Badge className="bg-sky-500 text-slate-950 text-[9px] px-1.5 py-0 font-bold">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{track.desc}</p>
                  <span className="text-[10px] text-sky-300 font-mono block bg-slate-900/90 p-1 rounded">
                    {track.sequence}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="text-xs border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                Back
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-10 gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                {saving ? "Enrolling & Starting Roadmap..." : "Confirm & Start Career Roadmap ▶"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
