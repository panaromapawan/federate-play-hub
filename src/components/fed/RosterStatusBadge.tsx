import { Lock, Unlock, FileCheck, Send, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Lock; className: string }
> = {
  draft: {
    label: "DRAFT",
    icon: PenLine,
    className:
      "bg-muted text-muted-foreground border-border",
  },
  submitted: {
    label: "SUBMITTED",
    icon: Send,
    className:
      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  approved: {
    label: "APPROVED",
    icon: FileCheck,
    className:
      "bg-success/15 text-success border-success/30",
  },
  frozen: {
    label: "FROZEN",
    icon: Lock,
    className:
      "bg-destructive/15 text-destructive border-destructive/40",
  },
};

export function RosterStatusBadge({
  status,
  size = "default",
}: {
  status: string | null;
  size?: "default" | "lg";
}) {
  const key = (status ?? "draft").toLowerCase();
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG["draft"]!;
  const Icon = config.icon;
  const large = size === "lg";

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${large ? "px-3 py-1.5 text-sm gap-1.5" : "gap-1"}`}
    >
      <Icon className={large ? "size-4" : "size-3"} aria-hidden />
      {config.label}
    </Badge>
  );
}

export function isFrozen(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "frozen";
}
