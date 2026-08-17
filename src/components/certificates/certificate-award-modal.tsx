"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  X,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificateCard } from "./certificate-card";
import type { IssuedCertificate } from "@/lib/certificates/service";

interface CertificateAwardModalProps {
  certificate: IssuedCertificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateAwardModal({
  certificate,
  isOpen,
  onClose,
}: CertificateAwardModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleCopyVerificationUrl = () => {
    navigator.clipboard.writeText(certificate.verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(
      `I am excited to share that I have successfully completed ${certificate.courseTitle} at ${certificate.organizationName} and earned my official certification! Verified Credential ID: ${certificate.serialNumber}`
    );
    const url = encodeURIComponent(certificate.verificationUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      {/* Confetti Particle Sparkles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: -50,
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
              rotate: 0,
              scale: 0.5,
            }}
            animate={{
              opacity: [0, 1, 0.8, 0],
              y: (typeof window !== "undefined" ? window.innerHeight : 800) + 100,
              rotate: Math.random() * 360,
              scale: [0.5, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
            className="absolute size-3 rounded-full"
            style={{
              backgroundColor: ["#F59E0B", "#38BDF8", "#10B981", "#EC4899", "#8B5CF6"][i % 5],
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md">
              <Award className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Official Completion Award
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Verified ✓
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-white">Congratulations, {certificate.studentName}!</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Certificate Card Preview */}
        <div className="overflow-x-auto py-2">
          <CertificateCard certificate={certificate} />
        </div>

        {/* Action Controls: Download, Print, Copy Link, LinkedIn */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Tracking URL:</span>
            <code className="text-sky-400 font-semibold truncate max-w-xs">{certificate.verificationUrl}</code>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyVerificationUrl}
              className="text-xs gap-1.5 border-slate-800 text-slate-300 hover:text-white"
            >
              {copiedUrl ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copiedUrl ? "Copied Link!" : "Copy Verification URL"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLinkedIn}
              className="text-xs gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
            >
              <Share2 className="size-3.5" />
              Share to LinkedIn
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              Print / Download PDF
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
