"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { IssuedCertificate } from "@/lib/certificates/service";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  Share2,
  ExternalLink,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";

export default function PublicCertificateVerificationPage() {
  const params = useParams();
  const serialNumber = (params?.id as string) || "";
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(serialNumber)}`);
        const data = await res.json();
        if (data.verified && data.certificate) {
          setVerified(true);
          setCertificate(data.certificate);
        } else {
          setVerified(false);
        }
      } catch (err) {
        console.error(err);
        setVerified(false);
      } finally {
        setLoading(false);
      }
    }
    if (serialNumber) verify();
  }, [serialNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    if (!certificate) return;
    const text = encodeURIComponent(
      `Verified Certificate: ${certificate.studentName} has mastered ${certificate.courseTitle} at ${certificate.organizationName}. Serial: ${certificate.serialNumber}`
    );
    const url = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Public Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md">
            <Award className="size-5" />
          </span>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Codeair Academy
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Official Credential Registry &amp; Verification
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Student Dashboard
        </Link>
      </header>

      {/* Main Verification Card Area */}
      <main className="max-w-5xl mx-auto w-full space-y-6 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-full space-y-4 max-w-2xl">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : verified && certificate ? (
          <div className="w-full space-y-6 animate-in fade-in duration-500">
            {/* Authenticity Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      Authentic Credential Verified
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/20 border-emerald-500 text-emerald-300">
                      ID: {certificate.serialNumber}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    This certificate is authentic and registered in the Code Air Academy public blockchain/ledger registry.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareLinkedIn}
                  className="text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10 gap-1.5"
                >
                  <Share2 className="size-3.5" />
                  Share
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
                >
                  <Printer className="size-3.5" />
                  Print / Save PDF
                </Button>
              </div>
            </div>

            {/* High-Resolution Certificate Render */}
            <div className="py-2 overflow-x-auto">
              <CertificateCard certificate={certificate} />
            </div>

            {/* Verification Metadata Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-mono uppercase text-[10px] block">Issued To</span>
                <strong className="text-white text-sm block mt-0.5">{certificate.studentName}</strong>
                <span className="text-slate-400 font-mono text-[11px]">{certificate.studentEmail}</span>
              </div>

              <div>
                <span className="text-slate-400 font-mono uppercase text-[10px] block">Accredited Stream</span>
                <strong className="text-sky-400 text-sm block mt-0.5">{certificate.courseTitle}</strong>
                <span className="text-slate-400 font-mono text-[11px]">Grade: {certificate.grade}</span>
              </div>

              <div>
                <span className="text-slate-400 font-mono uppercase text-[10px] block">Authorized Issuer</span>
                <strong className="text-white text-sm block mt-0.5">{certificate.signatoryName || "Sunmughan Swamy"}</strong>
                <span className="text-slate-400 font-sans text-[11px]">{certificate.signatoryDesignation || "Founder & Chief Instructor"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-4 max-w-md">
            <span className="inline-flex p-3 rounded-full bg-rose-500/20 text-rose-400">
              <XCircle className="size-8" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Invalid or Unrecognized Certificate ID</h2>
              <p className="text-xs text-slate-400">
                The certificate serial number <code>"{serialNumber}"</code> could not be validated in the registry.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full border-t border-slate-800/80 pt-4 mt-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Codeair Academy. Official Cryptographic Verification System.
      </footer>
    </div>
  );
}
