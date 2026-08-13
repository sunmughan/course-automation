"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  BookOpenIcon,
  BrainIcon,
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  Building2Icon,
} from "lucide-react";

interface OrgOption {
  id: string;
  name: string;
  slug: string;
}

interface Curriculum {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface ModuleData {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  order: number;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface AIModel {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  model: string;
  capabilities: string[];
  maxTokens: number;
  costPer1K: number;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

interface Policy {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  description: string | null;
  rules: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
}

export default function CustomizationPage() {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchOrgs() {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/organizations", { headers });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      const data = await res.json();
      const list = data.organizations || [];
      setOrgs(list);
      if (list.length > 0 && !orgId) {
        setOrgId(list[0].id);
      }
    } catch {
      setError("Failed to load organizations");
    } finally {
      setOrgsLoading(false);
    }
  }

  async function fetchResources(selectedOrgId: string) {
    if (!selectedOrgId) return;
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [curRes, aiRes, polRes] = await Promise.all([
        fetch(`/api/admin/curriculum?organizationId=${selectedOrgId}`, { headers }),
        fetch(`/api/admin/ai-models?organizationId=${selectedOrgId}`, { headers }),
        fetch(`/api/admin/policies?organizationId=${selectedOrgId}`, { headers }),
      ]);

      if (curRes.ok) {
        const d = await curRes.json();
        setCurriculums(d.curriculums || []);
      }
      if (aiRes.ok) {
        const d = await aiRes.json();
        setAIModels(d.models || []);
      }
      if (polRes.ok) {
        const d = await polRes.json();
        setPolicies(d.policies || []);
      }
    } catch {
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (orgId) fetchResources(orgId);
  }, [orgId]);

  if (orgsLoading) return <CustomizationSkeleton />;

  if (error && orgs.length === 0) {
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

  if (orgs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2Icon className="size-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium">No organizations yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an organization first to configure customization
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Enterprise Customization
        </h1>
        <p className="text-muted-foreground">
          Configure custom curriculum, AI models, and policies per organization
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium shrink-0">Organization</label>
        <Select value={orgId} onValueChange={(v) => setOrgId(v ?? "")}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">
            <BookOpenIcon className="size-4 mr-1" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="ai-models">
            <BrainIcon className="size-4 mr-1" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="policies">
            <ShieldCheckIcon className="size-4 mr-1" />
            Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="mt-6">
          <CurriculumPanel
            orgId={orgId}
            curriculums={curriculums}
            loading={loading}
            onRefresh={() => fetchResources(orgId)}
          />
        </TabsContent>

        <TabsContent value="ai-models" className="mt-6">
          <AIModelsPanel
            orgId={orgId}
            aiModels={aiModels}
            loading={loading}
            onRefresh={() => fetchResources(orgId)}
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <PoliciesPanel
            orgId={orgId}
            policies={policies}
            loading={loading}
            onRefresh={() => fetchResources(orgId)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CurriculumPanel({
  orgId,
  curriculums,
  loading,
  onRefresh,
}: {
  orgId: string;
  curriculums: Curriculum[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, ModuleData[]>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/curriculum", {
        method: "POST",
        headers,
        body: JSON.stringify({ organizationId: orgId, name, description }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create curriculum");
      }
      setName("");
      setDescription("");
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this curriculum and all its modules?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/curriculum/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete");
      onRefresh();
    } catch {
      alert("Failed to delete curriculum");
    }
  }

  async function toggleModules(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!modules[id]) {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`/api/admin/curriculum/${id}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch modules");
        const data = await res.json();
        setModules((prev) => ({ ...prev, [id]: data.modules || [] }));
      } catch {
        alert("Failed to load modules");
      }
    }
  }

  async function handleAddModule(curriculumId: string) {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch(`/api/admin/curriculum/${curriculumId}/modules`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: newModuleTitle }),
      });
      if (!res.ok) throw new Error("Failed to add module");
      setNewModuleTitle("");
      const refetch = await fetch(`/api/admin/curriculum/${curriculumId}`, {
        headers: getAuthHeaders(),
      });
      if (refetch.ok) {
        const data = await refetch.json();
        setModules((prev) => ({ ...prev, [curriculumId]: data.modules || [] }));
      }
    } catch {
      alert("Failed to add module");
    } finally {
      setAddingModule(false);
    }
  }

  async function handleRemoveModule(curriculumId: string, moduleId: string) {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(
        `/api/admin/curriculum/${curriculumId}/modules/${moduleId}`,
        { method: "DELETE", headers }
      );
      if (!res.ok) throw new Error("Failed to remove module");
      const refetch = await fetch(`/api/admin/curriculum/${curriculumId}`, {
        headers: getAuthHeaders(),
      });
      if (refetch.ok) {
        const data = await refetch.json();
        setModules((prev) => ({ ...prev, [curriculumId]: data.modules || [] }));
      }
    } catch {
      alert("Failed to remove module");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New Curriculum</CardTitle>
          <CardDescription>
            Create a custom learning curriculum for this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Curriculum name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            <PlusIcon className="size-4 mr-2" />
            {creating ? "Creating..." : "Create Curriculum"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : curriculums.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <BookOpenIcon className="size-12 text-muted-foreground/30" />
            <p className="mt-3 font-medium">No curriculums yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first curriculum above
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {curriculums.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{c.name}</CardTitle>
                    {c.description && (
                      <CardDescription className="mt-1">
                        {c.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{c.status}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModules(c.id)}
                    >
                      {expandedId === c.id ? "Hide" : "Modules"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedId === c.id && (
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Module title"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddModule(c.id)}
                      disabled={addingModule || !newModuleTitle.trim()}
                    >
                      <PlusIcon className="size-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {(modules[c.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No modules yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(modules[c.id] || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {m.title}
                            </p>
                            {m.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {m.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            #{m.order}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveModule(c.id, m.id)}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AIModelsPanel({
  orgId,
  aiModels,
  loading,
  onRefresh,
}: {
  orgId: string;
  aiModels: AIModel[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !provider.trim() || !model.trim()) return;
    setCreating(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers,
        body: JSON.stringify({ organizationId: orgId, name, provider, model }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create AI model");
      }
      setName("");
      setProvider("");
      setModel("");
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch(`/api/admin/ai-models/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onRefresh();
    } catch {
      alert("Failed to update AI model");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this AI model?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/ai-models/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete");
      onRefresh();
    } catch {
      alert("Failed to delete AI model");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New AI Model</CardTitle>
          <CardDescription>
            Register a custom AI model for this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Provider (e.g., openai)"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
            <Input
              placeholder="Model (e.g., gpt-4o)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={
              creating || !name.trim() || !provider.trim() || !model.trim()
            }
          >
            <PlusIcon className="size-4 mr-2" />
            {creating ? "Creating..." : "Create AI Model"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : aiModels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <BrainIcon className="size-12 text-muted-foreground/30" />
            <p className="mt-3 font-medium">No AI models yet</p>
            <p className="text-sm text-muted-foreground">
              Register a custom model above
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {aiModels.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{m.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {m.provider} / {m.model}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={m.isActive}
                        onCheckedChange={() => handleToggle(m.id, m.isActive)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">max {m.maxTokens} tokens</Badge>
                  <Badge variant="outline">${m.costPer1K}/1K</Badge>
                  {m.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PoliciesPanel({
  orgId,
  policies,
  loading,
  onRefresh,
}: {
  orgId: string;
  policies: Policy[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !type.trim()) return;
    setCreating(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({ organizationId: orgId, name, type, description }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create policy");
      }
      setName("");
      setType("");
      setDescription("");
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, isEnabled: boolean) {
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch(`/api/admin/policies/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onRefresh();
    } catch {
      alert("Failed to update policy");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this policy?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/policies/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete");
      onRefresh();
    } catch {
      alert("Failed to delete policy");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New Policy</CardTitle>
          <CardDescription>
            Define an organization governance policy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Policy name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Type (e.g., content-filter)"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !type.trim()}
          >
            <PlusIcon className="size-4 mr-2" />
            {creating ? "Creating..." : "Create Policy"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheckIcon className="size-12 text-muted-foreground/30" />
            <p className="mt-3 font-medium">No policies yet</p>
            <p className="text-sm text-muted-foreground">
              Define a policy above
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{p.name}</CardTitle>
                    <CardDescription className="mt-1">{p.type}</CardDescription>
                    {p.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {p.isEnabled ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        checked={p.isEnabled}
                        onCheckedChange={() => handleToggle(p.id, p.isEnabled)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomizationSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <Skeleton className="h-8 w-[260px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
