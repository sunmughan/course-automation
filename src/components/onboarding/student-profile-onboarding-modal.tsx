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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/providers/auth-provider";

export function StudentProfileOnboardingModal() {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [legalName, setLegalName] = useState("");
  const [targetRole, setTargetRole] = useState("Full-Stack Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("Student / Aspiring Engineer");
  const [organizationOrCollege, setOrganizationOrCollege] = useState("");

  useEffect(() => {
    // Check if user has completed onboarding / set legal certificate name
    if (typeof window !== "undefined" && user) {
      const hasOnboarded = localStorage.getItem(`onboarded_${user.id}`);
      if (!hasOnboarded) {
        setLegalName(user.name || "");
        setIsOpen(true);
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Save locally & store certificate name preference
      localStorage.setItem(`onboarded_${user.id}`, "true");
      localStorage.setItem(`certificate_name_${user.id}`, legalName.trim() || user.name || "Student");
      localStorage.setItem(`target_role_${user.id}`, targetRole);

      // Attempt to sync name with user session if applicable
      setIsOpen(false);
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
        className="w-full max-w-lg bg-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white"
      >
        {/* Onboarding Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                Student Profile Onboarding · Step {step} of 2
              </span>
              <h2 className="text-base font-bold text-white">Setup Your Official Engineering Profile</h2>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-300 font-mono">
            {step === 1 ? "Certificate Name" : "Career Goals"}
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
                Please enter your <strong>Full Legal / Professional Name</strong> exactly as you want it permanently embossed on your course completion certificates and employer verification transcripts.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Your Full Certificate Name:</label>
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
                placeholder="e.g. IIT Bombay / Freelance Developer"
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
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-10 gap-1.5 mt-2"
            >
              Continue to Career Goals
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Step 2: Learning Goal & Target Role */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Select Your Target Engineering Specialization:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Full-Stack Software Engineer",
                  "Backend & Systems Architect",
                  "Frontend Architecture Specialist",
                  "AI Platform & ML Engineer",
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => setTargetRole(role)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      targetRole === role
                        ? "bg-sky-500/20 border-sky-400 text-sky-200 font-bold shadow-xs"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Your Current Experience Level:</label>
              <div className="grid grid-cols-3 gap-2">
                {["Beginner", "Intermediate", "Professional"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setExperienceLevel(lvl)}
                    className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                      experienceLevel === lvl
                        ? "bg-indigo-500/20 border-indigo-400 text-indigo-200 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="text-xs border-slate-800 text-slate-400 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-10 gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                {saving ? "Saving Profile..." : "Complete Setup & Enter Classroom"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
