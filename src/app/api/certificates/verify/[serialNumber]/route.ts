import { apiHandler } from "@/lib/api-handler";
import { getCertificateBySerial } from "@/lib/certificates/service";

export const GET = apiHandler(async (ctx) => {
  const params = (ctx as any).params as { serialNumber: string };
  const serialNumber = params.serialNumber;

  const certificate = getCertificateBySerial(serialNumber);

  if (!certificate) {
    return {
      verified: false,
      message: "Certificate serial number not found or invalid",
    };
  }

  return {
    verified: true,
    certificate,
    verifiedAt: new Date().toISOString(),
  };
}, { requireAuth: false });
