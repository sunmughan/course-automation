"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  PlusIcon,
  UsersIcon,
  ArrowRightIcon,
  GraduationCapIcon,
  MoreHorizontalIcon,
  CalendarIcon,
  TrashIcon,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  description?: string | null;
  course?: { id: string; title: string } | null;
  _count: { students: number; assignments: number };
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

export default function BatchesPage() {
  const { user } = useAuthContext();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  async function fetchBatches() {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/instructor/batches", { headers });
      if (!res.ok) throw new Error("Failed to fetch batches");
      const data = await res.json();
      setBatches(data.batches || []);
    } catch {
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBatches();
  }, []);

  async function handleCreate() {
    if (!newBatch.name.trim()) return;
    setCreating(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/instructor/batches", {
        method: "POST",
        headers,
        body: JSON.stringify(newBatch),
      });
      if (!res.ok) throw new Error("Failed to create batch");
      setShowCreate(false);
      setNewBatch({ name: "", description: "" });
      await fetchBatches();
    } catch {
      setError("Failed to create batch");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(batchId: string) {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/instructor/batches/${batchId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete batch");
      await fetchBatches();
    } catch {
      setError("Failed to delete batch");
    }
  }

  if (loading) return <BatchesSkeleton />;

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
          <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
          <p className="text-muted-foreground">
            Manage your student groups and courses
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger>
            <Button>
              <PlusIcon className="size-4 mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Create a new batch to group students together
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Name</label>
                <Input
                  placeholder="e.g., Full Stack Cohort 2026"
                  value={newBatch.name}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description (optional)
                </label>
                <Input
                  placeholder="Brief description of the batch"
                  value={newBatch.description}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, description: e.target.value })
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating || !newBatch.name.trim()}
              >
                {creating ? "Creating..." : "Create Batch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCapIcon className="size-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">No batches yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first batch to start managing students
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowCreate(true)}
            >
              <PlusIcon className="size-4 mr-2" />
              Create Your First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-lg">
                      {batch.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {batch.course?.title || "No course assigned"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={batch.isActive ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon className="size-4" />
                    <span>{batch._count.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="size-4" />
                    <span>
                      {batch.startDate
                        ? new Date(batch.startDate).toLocaleDateString()
                        : "No start date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      render={
                        <Link
                          href={`/dashboard/instructor/batches/${batch.id}`}
                        />
                      }
                    >
                      View Details
                      <ArrowRightIcon className="size-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(batch.id)}
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

function BatchesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
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
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-4 h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}