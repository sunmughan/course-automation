import { apiHandler } from "@/lib/api-handler";
import { getBillingPlans, seedDefaultPlans } from "@/lib/enterprise";

export const GET = apiHandler(async (ctx) => {
  await seedDefaultPlans();
  const plans = await getBillingPlans();
  return { plans };
}, { requireAdmin: true });