"use client";

import { useState, useEffect } from "react";
import { Award, ShieldCheck, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import type { IssuedCertificate } from "@/lib/certificates/service";

interface CertificateCardProps {
  certificate: IssuedCertificate;
  className?: string;
  isPrintMode?: boolean;
}

export function CertificateCard({
  certificate,
  className = "",
  isPrintMode = false,
}: CertificateCardProps) {
  const [qrSvg, setQrSvg] = useState<string>("");

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const verifyUrl = certificate.verificationUrl || `http://localhost:3000/verify/certificate/${certificate.serialNumber}`;

  useEffect(() => {
    // Generate high-resolution scannable SVG QR Code (Black on White)
    QRCode.toString(verifyUrl, {
      type: "svg",
      width: 140,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((svgString) => setQrSvg(svgString))
      .catch(() => {
        // Fallback Data URL
        QRCode.toDataURL(verifyUrl, {
          width: 140,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        }).then((dataUrl) => {
          setQrSvg(`<img src="${dataUrl}" alt="QR Code" class="w-full h-full object-contain" />`);
        });
      });
  }, [verifyUrl]);

  return (
    <div
      id="certificate-print-area"
      className={`relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border-8 border-amber-500/40 bg-gradient-to-b from-[#0e1628] via-[#090d16] to-[#06080e] text-white p-8 sm:p-12 shadow-2xl transition-all ${className}`}
    >
      {/* Decorative Guilloche-style Corner Accents */}
      <div className="absolute top-3 left-3 w-16 h-16 border-t-2 border-l-2 border-amber-400/80 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-3 right-3 w-16 h-16 border-t-2 border-r-2 border-amber-400/80 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-16 h-16 border-b-2 border-l-2 border-amber-400/80 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-16 h-16 border-b-2 border-r-2 border-amber-400/80 rounded-br-xl pointer-events-none" />

      {/* Subtle Inner Security Border */}
      <div className="absolute inset-4 border border-amber-500/20 rounded-2xl pointer-events-none" />

      {/* Main Certificate Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Top Header: Brand & Accreditation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest font-mono">
            <ShieldCheck className="size-3.5" />
            Official Verified Credential
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            {certificate.organizationName || "Codeair Academy"}
          </h3>
          <p className="text-xs text-slate-400 tracking-wider uppercase font-mono">
            Center for Advanced Software Engineering &amp; AI Systems
          </p>
        </div>

        {/* Certificate Title */}
        <div className="space-y-1 pt-2">
          <span className="text-xs font-serif italic text-amber-300 tracking-wider uppercase">
            Certificate of Accomplishment
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 font-serif">
            CERTIFICATE OF MASTERY
          </h1>
        </div>

        {/* Recipient Section */}
        <div className="space-y-2 max-w-xl">
          <p className="text-xs sm:text-sm text-slate-400 italic font-serif">
            This certificate is proudly awarded to
          </p>
          <div className="relative inline-block px-8 py-2">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-normal font-sans border-b-2 border-amber-400/50 pb-2">
              {certificate.studentName}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed pt-1">
            for successfully completing the rigorous curriculum and demonstrating professional mastery in
          </p>
          <h3 className="text-lg sm:text-2xl font-bold text-sky-400 font-sans">
            {certificate.courseTitle}
          </h3>
        </div>

        {/* Skills Mastered Badges */}
        {certificate.skillsMastered && certificate.skillsMastered.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl pt-1">
            {certificate.skillsMastered.map((skill, sIdx) => (
              <span
                key={sIdx}
                className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-mono"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        )}

        {/* Bottom Signatures, Scannable QR & Seal Section */}
        <div className="w-full pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end border-t border-slate-800/80">
          {/* Left: Issue Date, Verification ID, Scannable QR & Clickable Hyperlink */}
          <div className="text-left space-y-1">
            <div className="flex items-start gap-3">
              {/* Scannable Live Black-and-White QR Code with High Contrast */}
              <div className="p-1 rounded-xl bg-white shadow-xl ring-2 ring-amber-400/50 shrink-0 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center overflow-hidden">
                {qrSvg ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`}
                    alt="Scan to Verify"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] text-slate-400 uppercase font-mono block">Date of Issue:</span>
                <p className="text-[11px] font-semibold text-slate-200 font-mono">{formattedDate}</p>
                <span className="text-[9px] text-slate-400 uppercase font-mono block pt-1">Credential ID:</span>
                <p className="text-[11px] font-bold text-amber-400 font-mono tracking-wider truncate">{certificate.serialNumber}</p>
                
                {/* Hyperlinked 'Verify: Click Here ↗' button */}
                <div className="pt-1.5">
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-400/50 text-[11px] font-bold text-sky-300 hover:text-white hover:bg-sky-500/35 transition-all cursor-pointer font-sans shadow-sm"
                    title="Click to open public verification page"
                  >
                    <span>Verify: Click Here ↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Golden Seal Badge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-600 p-1 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center border-2 border-amber-300/80">
                <Award className="size-6 text-yellow-400" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-300 font-mono mt-0.5">
                  VERIFIED
                </span>
              </div>
            </div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-2">
              Official Academic Seal
            </span>
          </div>

          {/* Right: Instructor Signature */}
          <div className="text-right space-y-1">
            <div className="h-10 flex items-end justify-end">
              {certificate.signatorySignatureUrl ? (
                <img
                  src={certificate.signatorySignatureUrl}
                  alt="Signature"
                  className="max-h-10 object-contain filter invert"
                />
              ) : (
                <span className="font-serif italic text-xl text-amber-300 font-semibold tracking-wide">
                  {certificate.signatoryName || "Sunmughan Swamy"}
                </span>
              )}
            </div>
            <div className="w-48 ml-auto border-b border-slate-700 pt-1" />
            <p className="text-xs font-bold text-white font-sans">{certificate.signatoryName || "Sunmughan Swamy"}</p>
            <p className="text-[10px] text-slate-400 font-sans">{certificate.signatoryDesignation || "Founder & Chief Instructor"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
