import { createServerFn } from "@tanstack/react-start";

export type DashboardCounters = {
  pending_users: number;
  teams_total: number;
  rosters_frozen: number;
  rosters_awaiting_action: number;
  matches_upcoming: number;
  matches_awaiting_certification: number;
};

export type WorkQueueItem = {
  type: "user_approval" | "roster_approval" | "roster_action" | "match_certification" | "match_scoring";
  entity_id: number;
  label: string;
  age_days: number;
  severity: "default" | "warning" | "destructive";
  status: string;
  action_url: string;
  sort_date: string;
};

export type RecentActivityItem = {
  id: number;
  actor_id: number;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  reason: string | null;
  created_at: string;
};

export type DashboardSummary = {
  counters: DashboardCounters;
  queue: WorkQueueItem[];
  recentActivity: RecentActivityItem[];
};

export const getDashboardSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardSummary> => {
    const { requireUser } = await import("./session.server");
    const { callProcMulti } = await import("./db.server");
    const user = await requireUser([1, 2, 3, 4]);

    const [countersRows, queueRows, activityRows] = await callProcMulti<
      DashboardCounters,
      WorkQueueItem,
      RecentActivityItem
    >("sp_dashboard_summary", [user.id]);

    const counters = countersRows[0] ?? {
      pending_users: 0,
      teams_total: 0,
      rosters_frozen: 0,
      rosters_awaiting_action: 0,
      matches_upcoming: 0,
      matches_awaiting_certification: 0,
    };

    return {
      counters: {
        pending_users: Number(counters.pending_users ?? 0),
        teams_total: Number(counters.teams_total ?? 0),
        rosters_frozen: Number(counters.rosters_frozen ?? 0),
        rosters_awaiting_action: Number(counters.rosters_awaiting_action ?? 0),
        matches_upcoming: Number(counters.matches_upcoming ?? 0),
        matches_awaiting_certification: Number(counters.matches_awaiting_certification ?? 0),
      },
      queue: (queueRows ?? []).map((q) => ({
        ...q,
        age_days: Number(q.age_days ?? 0),
      })),
      recentActivity: activityRows ?? [],
    };
  }
);
