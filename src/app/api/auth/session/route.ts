import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (ctx) => {
  return { user: ctx.user };
}, { requireAuth: true });