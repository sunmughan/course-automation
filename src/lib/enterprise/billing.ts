import { prisma } from "@/lib/db";

export interface BillingPlanData {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxStudents: number;
  maxInstructors: number;
  maxTeams: number;
  features: string[];
  isActive: boolean;
}

export interface SubscriptionData {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export async function seedDefaultPlans(): Promise<void> {
  const existing = await prisma.billingPlan.count();
  if (existing > 0) return;

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      priceMonthly: 0,
      priceYearly: 0,
      maxStudents: 10,
      maxInstructors: 1,
      maxTeams: 3,
      features: JSON.stringify([
        "Up to 10 students",
        "1 instructor",
        "3 teams",
        "Basic curriculum",
        "Community support",
        "Standard analytics",
      ]),
    },
    {
      name: "Professional",
      description: "For growing training programs",
      priceMonthly: 49,
      priceYearly: 490,
      maxStudents: 50,
      maxInstructors: 5,
      maxTeams: 10,
      features: JSON.stringify([
        "Up to 50 students",
        "5 instructors",
        "10 teams",
        "Full curriculum access",
        "Advanced analytics",
        "AI assignment generation",
        "Priority support",
        "Custom branding",
      ]),
    },
    {
      name: "Enterprise",
      description: "For large organizations and institutes",
      priceMonthly: 199,
      priceYearly: 1990,
      maxStudents: 500,
      maxInstructors: 25,
      maxTeams: 50,
      features: JSON.stringify([
        "Up to 500 students",
        "25 instructors",
        "50 teams",
        "Full curriculum access",
        "Custom curriculum builder",
        "White-label branding",
        "SSO integration",
        "Audit logs",
        "Dedicated support",
        "Custom AI models",
        "API access",
        "SLA guarantee",
      ]),
    },
  ];

  for (const plan of plans) {
    await prisma.billingPlan.create({ data: plan });
  }
}

export async function getBillingPlans(): Promise<BillingPlanData[]> {
  const plans = await prisma.billingPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
  });
  return plans.map(formatPlan);
}

export async function getBillingPlan(planId: string): Promise<BillingPlanData | null> {
  const plan = await prisma.billingPlan.findUnique({ where: { id: planId } });
  if (!plan) return null;
  return formatPlan(plan);
}

export async function createSubscription(
  organizationId: string,
  planId: string,
  billingCycle: "monthly" | "yearly" = "monthly"
): Promise<SubscriptionData> {
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const existing = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (existing) {
    const updated = await prisma.subscription.update({
      where: { organizationId },
      data: {
        planId,
        billingCycle,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      include: {
        organization: { select: { name: true } },
        plan: { select: { name: true } },
      },
    });
    return formatSubscription(updated);
  }

  const subscription = await prisma.subscription.create({
    data: {
      organizationId,
      planId,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    include: {
      organization: { select: { name: true } },
      plan: { select: { name: true } },
    },
  });
  return formatSubscription(subscription);
}

export async function getSubscription(
  organizationId: string
): Promise<SubscriptionData | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      organization: { select: { name: true } },
      plan: { select: { name: true } },
    },
  });
  if (!subscription) return null;
  return formatSubscription(subscription);
}

export async function cancelSubscription(organizationId: string): Promise<void> {
  await prisma.subscription.update({
    where: { organizationId },
    data: { cancelAtPeriodEnd: true, status: "canceled" },
  });
}

function formatPlan(plan: {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxStudents: number;
  maxInstructors: number;
  maxTeams: number;
  features: string;
  isActive: boolean;
}): BillingPlanData {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    maxStudents: plan.maxStudents,
    maxInstructors: plan.maxInstructors,
    maxTeams: plan.maxTeams,
    features: JSON.parse(plan.features),
    isActive: plan.isActive,
  };
}

function formatSubscription(sub: {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  organization: { name: string };
  plan: { name: string };
}): SubscriptionData {
  return {
    id: sub.id,
    organizationId: sub.organizationId,
    organizationName: sub.organization.name,
    planId: sub.planId,
    planName: sub.plan.name,
    status: sub.status,
    billingCycle: sub.billingCycle,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}