"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { ScrollTextIcon, RefreshCwIcon, SearchIcon } from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    action: "",
    resource: "",
    userId: "",
  });

  async function fetchLogs() {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const params = new URLSearchParams();
      if (filter.action) params.set("action", filter.action);
      if (filter.resource) params.set("resource", filter.resource);
      if (filter.userId) params.set("userId", filter.userId);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/audit?${params.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

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
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all administrative actions across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCwIcon className="size-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Action</label>
              <Input
                placeholder="e.g., organizations:create"
                value={filter.action}
                onChange={(e) =>
                  setFilter({ ...filter, action: e.target.value })
                }
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Resource</label>
              <Input
                placeholder="e.g., organization"
                value={filter.resource}
                onChange={(e) =>
                  setFilter({ ...filter, resource: e.target.value })
                }
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="User ID"
                value={filter.userId}
                onChange={(e) =>
                  setFilter({ ...filter, userId: e.target.value })
                }
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchLogs}>
                <SearchIcon className="size-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {total} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ScrollTextIcon className="size-12 text-muted-foreground/30" />
              <p className="mt-4 font-medium">No audit entries found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {entry.action}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {entry.resource}
                      </Badge>
                      {entry.resourceId && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {entry.resourceId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">
                      {entry.userName || entry.userId || "System"}
                    </p>
                    {entry.details && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-lg">
                        {entry.details}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}