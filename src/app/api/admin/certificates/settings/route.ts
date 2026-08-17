import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  getCertificateSettings,
  updateCertificateSettings,
  type CertificateSettings,
} from "@/lib/certificates/service";

export const GET = apiHandler(async () => {
  const settings = getCertificateSettings();
  return { settings };
}, { requireAdmin: true });

const updateSettingsSchema = z.object({
  organizationName: z.string().min(1).optional(),
  brandLogoUrl: z.string().optional(),
  signatoryName: z.string().min(1).optional(),
  signatoryDesignation: z.string().min(1).optional(),
  signatorySignatureUrl: z.string().optional(),
  certificateTheme: z.enum(["gold", "obsidian", "emerald", "minimal"]).optional(),
  accreditationText: z.string().optional(),
  allowPublicVerification: z.boolean().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const body = (ctx as any).body as z.infer<typeof updateSettingsSchema>;
  const updated = updateCertificateSettings(body);
  return {
    success: true,
    message: "Certificate template & signatory settings updated successfully",
    settings: updated,
  };
}, { requireAdmin: true, bodySchema: updateSettingsSchema });
