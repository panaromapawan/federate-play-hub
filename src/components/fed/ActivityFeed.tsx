import { Activity, Clock, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivityItem } from "@/lib/dashboard.functions";

function formatActionName(action: string): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (action) {
    case "USER_APPROVAL_CHANGE":
      return { label: "User Approval", variant: "secondary" };
    case "ROSTER_LIFECYCLE_TRANSITION":
      return { label: "Roster Transition", variant: "default" };
    case "MATCH_SCORE_RECORDED":
      return { label: "Score Recorded", variant: "secondary" };
    case "MATCH_RESULT_CERTIFIED":
      return { label: "Result Certified", variant: "default" };
    case "RESULT_CORRECTED":
      return { label: "Result Corrected", variant: "destructive" };
    case "TOURNAMENT_REGISTRATION":
      return { label: "Team Registered", variant: "outline" };
    default:
      return { label: action.replace(/_/g, " "), variant: "outline" };
  }
}

export function ActivityFeed({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Activity className="size-5 text-primary" />
              Cryptographic Activity Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Recent forensic audit entries backed by SHA-256 tamper-evident chain
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            Live Stream
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <Shield className="size-6 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">No recent activity logged</p>
            <p className="text-xs text-muted-foreground mt-1">Audit log is initialized and waiting for state actions.</p>
          </div>
        ) : (
          <div className="relative space-y-4 before:absolute before:bottom-0 before:left-3.5 before:top-2 before:w-0.5 before:bg-border">
            {items.map((item) => {
              const { label, variant } = formatActionName(item.action);
              return (
                <div key={item.id} className="relative flex items-start gap-4 pl-8 text-sm">
                  <div className="absolute left-2.5 top-1 size-2 -translate-x-1/2 rounded-full border-2 border-primary bg-background ring-4 ring-card" />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{item.actor_name}</span>
                      <Badge variant={variant} className="text-[10px] uppercase font-mono px-1.5 py-0">
                        {label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        #{item.entity_type}:{item.entity_id}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-xs italic text-muted-foreground bg-muted/30 rounded p-1.5 border border-border/40">
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{item.created_at}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
