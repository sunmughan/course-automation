"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  Building2Icon,
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
  GlobeIcon,
} from "lucide-react";

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  customDomain: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", description: "" });
  const [creating, setCreating] = useState(false);

  async function fetchOrgs() {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/organizations", { headers });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      const data = await res.json();
      setOrgs(data.organizations || []);
    } catch {
      setError("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function handleCreate() {
    if (!newOrg.name.trim() || !newOrg.slug.trim()) return;
    setCreating(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers,
        body: JSON.stringify(newOrg),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create organization");
      }
      setShowCreate(false);
      setNewOrg({ name: "", slug: "", description: "" });
      await fetchOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(orgId: string) {
    if (!confirm("Are you sure you want to delete this organization?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchOrgs();
    } catch {
      setError("Failed to delete organization");
    }
  }

  if (loading) return <OrgsSkeleton />;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage multi-tenant organizations
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger>
            <Button>
              <PlusIcon className="size-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization for multi-tenant management
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., Acme Corp"
                  value={newOrg.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewOrg({
                      ...newOrg,
                      name,
                      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  placeholder="e.g., acme-corp"
                  value={newOrg.slug}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase() })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description (optional)
                </label>
                <Input
                  placeholder="Brief description"
                  value={newOrg.description}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, description: e.target.value })
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating || !newOrg.name.trim() || !newOrg.slug.trim()}
              >
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {orgs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2Icon className="size-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">No organizations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first organization to enable multi-tenancy
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowCreate(true)}
            >
              <PlusIcon className="size-4 mr-2" />
              Create First Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-lg">
                      {org.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {org.slug}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={org.isActive ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {org.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {org.customDomain && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GlobeIcon className="size-4" />
                      <span>{org.customDomain}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      render={
                        <Link
                          href={`/dashboard/admin/organizations/${org.id}`}
                        />
                      }
                    >
                      Manage
                      <ArrowRightIcon className="size-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(org.id)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}