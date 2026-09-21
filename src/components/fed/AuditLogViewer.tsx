import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, Clock, Filter, Key, RefreshCw, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditFeed, verifyAuditChain, type AuditEntry } from "@/lib/audit.functions";

export function AuditLogViewer() {
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const { data: records = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit-feed", actionFilter, entityTypeFilter],
    queryFn: () =>
      getAuditFeed({
        data: {
          action: actionFilter || undefined,
          entityType: entityTypeFilter || undefined,
        },
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyAuditChain(),
  });

  return (
    <div className="space-y-6">
      {/* Forensic Verification Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <Key className="size-5 text-primary" />
                Forensic Audit Trail & Cryptographic Chain
              </CardTitle>
              <CardDescription className="text-xs">
                Zero-trust audit ledger sealed with recursive SHA-256 hashing across all federation mutations
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant={verifyMutation.data?.status === "VERIFIED" ? "outline" : "default"}
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              className="gap-2 text-xs font-semibold self-start sm:self-center"
            >
              {verifyMutation.isPending ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" /> Verifying Chain...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Verify Cryptographic Integrity
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {verifyMutation.data && (
            <div
              className={`rounded-lg border p-4 text-xs ${
                verifyMutation.data.status === "VERIFIED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-start gap-3">
                {verifyMutation.data.status === "VERIFIED" ? (
                  <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    {verifyMutation.data.status === "VERIFIED"
                      ? "Cryptographic Verification Passed (SHA-256)"
                      : "Audit Chain Integrity Compromised!"}
                  </p>
                  <p>{verifyMutation.data.message}</p>
                  <div className="flex flex-wrap gap-4 font-mono text-[11px] pt-1">
                    <span>Records Verified: {verifyMutation.data.checked_records}</span>
                    {verifyMutation.data.latest_hash && (
                      <span className="truncate max-w-md">
                        Chain Head Hash: {verifyMutation.data.latest_hash}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 w-48 text-xs"
          />
          <Input
            placeholder="Filter by entity (TEAM, USER, MATCH)..."
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="h-9 w-52 text-xs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 text-xs gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Records Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs uppercase font-semibold">ID / Timestamp</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Actor</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Action</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Entity</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Reason</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Hash Seal (SHA-256)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-5 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                  No audit entries found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id} className="text-xs hover:bg-muted/40">
                  <TableCell className="font-mono text-muted-foreground">
                    <div>#{r.id}</div>
                    <div className="text-[10px]">{r.created_at}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{r.actor_name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.actor_role ?? "system"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {r.entity_type} #{r.entity_id}
                  </TableCell>
                  <TableCell className="italic text-muted-foreground max-w-xs truncate">
                    {r.reason || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]" title={r.current_hash}>
                    {r.current_hash.slice(0, 12)}...
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
