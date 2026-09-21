import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = "secondary",
  actionLabel,
  onAction,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="relative overflow-hidden border-border bg-card transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tracking-tight text-foreground">{value}</span>
              {badgeText && (
                <Badge variant={badgeVariant} className="text-[10px] uppercase font-mono px-1.5 py-0.5">
                  {badgeText}
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
        {actionLabel && onAction && (
          <div className="mt-4 border-t border-border/50 pt-3">
            <button
              type="button"
              onClick={onAction}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {actionLabel} &rarr;
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
