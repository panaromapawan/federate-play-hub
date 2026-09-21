import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, RefreshCw, Shield, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardSummary } from "@/lib/dashboard.functions";
import { KpiCard } from "./KpiCard";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { ActivityFeed } from "./ActivityFeed";
import type { Viewer } from "./Shell";

export function OverviewTab({
  viewer,
  onNavigateTab,
}: {
  viewer: Viewer;
  onNavigateTab?: (tab: string) => void;
}) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-summary", viewer.id],
    queryFn: () => getDashboardSummary(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card/50 animate-pulse p-5">
              <div className="h-3 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-xl border border-border bg-card/50 animate-pulse" />
          <div className="h-72 rounded-xl border border-border bg-card/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mb-2" />
        <p className="font-semibold text-foreground">Could not load federation summary</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md">
          {(error as Error)?.message || "Database connection or procedure query encountered an issue."}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  const { counters, queue, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
            Federation Governance Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Jurisdiction scope: {viewer.role_id === 1 ? "National Apex" : viewer.role_id === 2 ? `State Association (State #${viewer.state_id})` : viewer.role_id === 3 ? `District Body (District #${viewer.district_id})` : "Official Scorer"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {viewer.role_id <= 2 && (
          <KpiCard
            title="Pending User Approvals"
            value={counters.pending_users}
            subtitle={counters.pending_users > 0 ? "Awaiting identity verification" : "Queue fully cleared"}
            icon={Users}
            badgeText={counters.pending_users > 0 ? "Action Required" : undefined}
            badgeVariant="destructive"
            actionLabel="View Queue"
            onAction={() => onNavigateTab?.("approvals")}
          />
        )}
        <KpiCard
          title="Sanctioned Teams"
          value={counters.teams_total}
          subtitle={`${counters.rosters_frozen} rosters frozen & certified`}
          icon={Shield}
          actionLabel="Manage Teams"
          onAction={() => onNavigateTab?.("teams")}
        />
        <KpiCard
          title="Rosters Awaiting Action"
          value={counters.rosters_awaiting_action}
          subtitle={counters.rosters_awaiting_action > 0 ? "Pending lifecycle approval" : "No pending transitions"}
          icon={Shield}
          badgeText={counters.rosters_awaiting_action > 0 ? "Attention" : undefined}
          badgeVariant="secondary"
          actionLabel="Roster Registry"
          onAction={() => onNavigateTab?.("teams")}
        />
        <KpiCard
          title="Upcoming Fixtures"
          value={counters.matches_upcoming}
          subtitle="Scheduled federation matches"
          icon={Calendar}
          actionLabel="Fixtures Schedule"
          onAction={() => onNavigateTab?.("matches")}
        />
        <KpiCard
          title="Uncertified Matches"
          value={counters.matches_awaiting_certification}
          subtitle={counters.matches_awaiting_certification > 0 ? "Awaiting official certification" : "All completed matches certified"}
          icon={Trophy}
          badgeText={counters.matches_awaiting_certification > 0 ? "Sign-off Needed" : undefined}
          badgeVariant="default"
          actionLabel="Match Centre"
          onAction={() => onNavigateTab?.("matches")}
        />
        <KpiCard
          title="Audit Ledger Events"
          value={recentActivity.length}
          subtitle="Cryptographically sealed actions"
          icon={Shield}
          badgeText="SHA-256"
          badgeVariant="outline"
          actionLabel={viewer.role_id === 1 ? "Audit Vault" : undefined}
          onAction={() => onNavigateTab?.("audit")}
        />
      </div>

      {/* Main Grid: Needs Attention Queue & Cryptographic Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <NeedsAttentionList items={queue} onNavigateTab={onNavigateTab} />
        <ActivityFeed items={recentActivity} />
      </div>
    </div>
  );
}
