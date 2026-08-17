"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { CertificateCard } from "@/components/certificates/certificate-card";
import type { CertificateSettings, IssuedCertificate } from "@/lib/certificates/service";
import {
  Award,
  Save,
  CheckCircle2,
  Sparkles,
  PenTool,
  Building2,
  Eye,
  RefreshCw,
  Palette,
  ShieldCheck,
  User,
} from "lucide-react";

export default function AdminCertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<CertificateSettings>({
    organizationName: "Codeair Academy",
    brandLogoUrl: "/brand-logo.svg",
    signatoryName: "Sunmughan Swamy",
    signatoryDesignation: "Founder & Chief Instructor",
    signatorySignatureUrl: "",
    certificateTheme: "gold",
    accreditationText: "This certifies that the recipient has successfully demonstrated comprehensive mastery of professional software engineering competencies.",
    allowPublicVerification: true,
  });

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/certificates/settings", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/certificates/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save certificate configuration");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Mock certificate instance for live preview
  const previewCertificate: IssuedCertificate = {
    id: "cert_preview_mock",
    serialNumber: "CA-2026-N8X92Q",
    userId: "preview_user",
    studentName: "Alex Mercer",
    studentEmail: "alex.mercer@example.com",
    courseId: "preview_course",
    courseTitle: "Node.js 15+ & Express Production Backend Engineering",
    courseStream: "Backend Engineering",
    totalLessonsCompleted: 24,
    grade: "A+ / Distinguished",
    skillsMastered: ["Express Middleware", "Non-Blocking I/O", "REST API Security", "PostgreSQL & Prisma", "Distributed Caching"],
    issuedAt: new Date().toISOString(),
    verificationUrl: "http://localhost:3000/verify/certificate/CA-2026-N8X92Q",
    signatoryName: settings.signatoryName || "Sunmughan Swamy",
    signatoryDesignation: settings.signatoryDesignation || "Founder & Chief Instructor",
    signatorySignatureUrl: settings.signatorySignatureUrl || "",
    brandLogoUrl: settings.brandLogoUrl || "/brand-logo.svg",
    organizationName: settings.organizationName || "Codeair Academy",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Certificate Template &amp; Signatory Control</h1>
              <p className="text-sm text-slate-400">
                Configure official certificate credentials, signatory details (Sunmugan Swami), brand logo, and public tracking
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-2">
          <Save className="size-4" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Certificate template and signatory settings saved successfully!</span>
        </div>
      )}

      {/* Main Settings & Live Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="size-4 text-amber-400" />
                Signatory &amp; Issuer Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                These credentials will appear on all awarded student certificates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Signatory Full Name:</label>
                <Input
                  value={settings.signatoryName}
                  onChange={(e) => setSettings((s) => ({ ...s, signatoryName: e.target.value }))}
                  placeholder="e.g. Sunmugan Swami"
                  className="bg-slate-900 border-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Signatory Designation / Title:</label>
                <Input
                  value={settings.signatoryDesignation}
                  onChange={(e) => setSettings((s) => ({ ...s, signatoryDesignation: e.target.value }))}
                  placeholder="e.g. Founder & Chief Instructor"
                  className="bg-slate-900 border-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Signature Image URL (Optional):</label>
                <Input
                  value={settings.signatorySignatureUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, signatorySignatureUrl: e.target.value }))}
                  placeholder="https://.../signature.png (leave empty for calligraphic text)"
                  className="bg-slate-900 border-slate-800 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500">If blank, the system automatically renders an authentic calligraphic handwritten signature.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-4 text-sky-400" />
                Academy &amp; Brand Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Organization / Academy Name:</label>
                <Input
                  value={settings.organizationName}
                  onChange={(e) => setSettings((s) => ({ ...s, organizationName: e.target.value }))}
                  placeholder="e.g. Code Air Academy"
                  className="bg-slate-900 border-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Accreditation Statement:</label>
                <textarea
                  value={settings.accreditationText}
                  onChange={(e) => setSettings((s) => ({ ...s, accreditationText: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 resize-none font-sans"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Interactive Certificate Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Eye className="size-3.5 text-sky-400" />
              Live Student Certificate Preview
            </span>
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">
              Gold Mastery Edition
            </Badge>
          </div>

          <div className="p-2 sm:p-4 rounded-3xl bg-slate-900/50 border border-slate-800 overflow-x-auto">
            <CertificateCard certificate={previewCertificate} />
          </div>
        </div>
      </div>
    </div>
  );
}
