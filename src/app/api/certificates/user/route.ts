import { apiHandler } from "@/lib/api-handler";
import { getUserCertificates } from "@/lib/certificates/service";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const certificates = getUserCertificates(user.id);
  return { certificates };
});
