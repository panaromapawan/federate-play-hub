import { AlertCircle, AlertTriangle, CheckCircle2, Clock, ShieldAlert, Trophy, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkQueueItem } from "@/lib/dashboard.functions";

export function NeedsAttentionList({
  items,
  onNavigateTab,
}: {
  items: WorkQueueItem[];
  onNavigateTab?: (tab: string) => void;
}) {
  const getIcon = (type: WorkQueueItem["type"]) => {
    switch (type) {
      case "user_approval":
        return <UserCheck className="size-4 text-blue-500" />;
      case "roster_approval":
      case "roster_action":
        return <ShieldAlert className="size-4 text-amber-500" />;
      case "match_certification":
      case "match_scoring":
        return <Trophy className="size-4 text-emerald-500" />;
      default:
        return <AlertCircle className="size-4 text-primary" />;
    }
  };

  const getActionTarget = (item: WorkQueueItem) => {
    if (item.type === "user_approval") return "approvals";
    if (item.type.includes("roster")) return "teams";
    if (item.type.includes("match")) return "matches";
    return "overview";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <AlertTriangle className="size-5 text-amber-500" />
              Needs Attention Queue
            </CardTitle>
            <CardDescription className="text-xs">
              High-priority state transitions and lifecycle tasks awaiting your authorization
            </CardDescription>
          </div>
          <Badge variant={items.length > 0 ? "secondary" : "outline"} className="font-mono">
            {items.length} {items.length === 1 ? "task" : "tasks"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 mb-2">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">All queues clear</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              No items require immediate administrative action within your jurisdiction.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {items.map((item, idx) => {
              const isOld = item.age_days >= 7;
              const isMedium = item.age_days >= 3;
              return (
                <div
                  key={`${item.type}-${item.entity_id}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-muted p-2">{getIcon(item.type)}</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.label}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="size-3" />
                          {item.age_days === 0
                            ? "Created today"
                            : `${item.age_days}d ago`}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{item.status.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isOld ? (
                      <Badge variant="destructive" className="text-[10px] uppercase font-mono px-2 py-0.5">
                        Overdue ({item.age_days}d)
                      </Badge>
                    ) : isMedium ? (
                      <Badge variant="secondary" className="border-amber-500/50 text-amber-600 bg-amber-500/10 text-[10px] uppercase font-mono px-2 py-0.5">
                        Urgent ({item.age_days}d)
                      </Badge>
                    ) : null}

                    {onNavigateTab && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold"
                        onClick={() => onNavigateTab(getActionTarget(item))}
                      >
                        Action &rarr;
                      </Button>
                    )}
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
