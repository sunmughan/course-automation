"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  Building2Icon,
  ArrowLeftIcon,
  UsersIcon,
  SettingsIcon,
  KeyIcon,
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  GlobeIcon,
  PaintbrushIcon,
} from "lucide-react";

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customDomain: string | null;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  permissions: string[];
  joinedAt: string;
}

interface SSOConfig {
  id: string;
  provider: string;
  isEnabled: boolean;
  domain: string | null;
}

export default function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orgId } = use(params);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ssoConfigs, setSSOConfigs] = useState<SSOConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  async function fetchData() {
    try {
      const headers = getAuthHeaders();
      const [orgRes, membersRes, ssoRes] = await Promise.all([
        fetch(`/api/admin/organizations/${orgId}`, { headers }),
        fetch(`/api/admin/organizations/${orgId}/members`, { headers }),
        fetch(`/api/admin/sso?organizationId=${orgId}`, { headers }),
      ]);

      if (!orgRes.ok) {
        if (orgRes.status === 404) throw new Error("Organization not found");
        throw new Error("Failed to fetch organization");
      }

      const orgData = await orgRes.json();
      setOrg(orgData.organization);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      if (ssoRes.ok) {
        const ssoData = await ssoRes.json();
        setSSOConfigs(ssoData.configs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [orgId]);

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          render={<Link href="/dashboard/admin/organizations" />}
        >
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Organizations
        </Button>
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
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/dashboard/admin/organizations" />}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            <p className="text-muted-foreground">
              {org.slug} &middot; {members.length} members
            </p>
          </div>
        </div>
        <Badge variant={org.isActive ? "default" : "secondary"}>
          {org.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{org.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Slug</p>
                  <p className="text-sm text-muted-foreground">{org.slug}</p>
                </div>
                {org.description && (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {org.description}
                    </p>
                  </div>
                )}
                {org.customDomain && (
                  <div>
                    <p className="text-sm font-medium">Custom Domain</p>
                    <p className="text-sm text-muted-foreground">
                      <GlobeIcon className="size-3 inline mr-1" />
                      {org.customDomain}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>White-label settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Primary Color</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="size-6 rounded border"
                      style={{ backgroundColor: org.primaryColor }}
                    />
                    <p className="text-sm text-muted-foreground">
                      {org.primaryColor}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Accent Color</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="size-6 rounded border"
                      style={{ backgroundColor: org.accentColor }}
                    />
                    <p className="text-sm text-muted-foreground">
                      {org.accentColor}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                {members.length} members in this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members yet
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-sm font-bold">
                        {(m.userName || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {m.userName || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.userEmail}
                        </p>
                      </div>
                      <Badge variant="outline">{m.role}</Badge>
                      {m.permissions.length > 0 && (
                        <div className="flex gap-1">
                          {m.permissions.slice(0, 3).map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sso" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SSO Configuration</CardTitle>
              <CardDescription>
                Single Sign-On providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ssoConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <KeyIcon className="size-12 text-muted-foreground/50" />
                  <p className="mt-4 font-medium">No SSO configured</p>
                  <p className="text-sm text-muted-foreground">
                    Configure SSO via the API
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ssoConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <KeyIcon className="size-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">
                          {config.provider}
                        </p>
                        {config.domain && (
                          <p className="text-xs text-muted-foreground">
                            {config.domain}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={config.isEnabled ? "default" : "secondary"}
                      >
                        {config.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-9" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}