"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { CreditCardIcon, CheckIcon, UsersIcon, GraduationCapIcon } from "lucide-react";

interface BillingPlan {
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

export default function BillingPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const headers = getAuthHeaders();
        const res = await fetch("/api/admin/billing/plans", { headers });
        if (!res.ok) throw new Error("Failed to fetch plans");
        const data = await res.json();
        setPlans(data.plans || []);
      } catch {
        setError("Failed to load billing plans");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  if (loading) return <BillingSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing Plans</h1>
        <p className="text-muted-foreground">
          Manage subscription plans and pricing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.name === "Professional" ? "border-blue-500/50 ring-1 ring-blue-500/20" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.name === "Professional" && (
                  <Badge>Popular</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
                {plan.priceYearly > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ${plan.priceYearly}/year (save ~17%)
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="size-4 text-muted-foreground" />
                  <span>Up to {plan.maxStudents} students</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCapIcon className="size-4 text-muted-foreground" />
                  <span>{plan.maxInstructors} instructors</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="size-4 text-muted-foreground" />
                  <span>{plan.maxTeams} teams</span>
                </div>
                <hr className="my-2" />
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="size-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-10 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}