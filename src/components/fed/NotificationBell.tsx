import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Clock, ExternalLink, ShieldAlert, Trophy, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNotifications, markNotificationRead, type NotificationRow } from "@/lib/notifications.functions";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  });

  const markMutation = useMutation({
    mutationFn: (notifId?: number | null) => markNotificationRead({ data: { notifId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getIcon = (kind: NotificationRow["kind"]) => {
    switch (kind) {
      case "approval":
        return <UserCheck className="size-4 text-blue-500" />;
      case "roster":
        return <ShieldAlert className="size-4 text-amber-500" />;
      case "match":
      case "certification":
        return <Trophy className="size-4 text-emerald-500" />;
      default:
        return <Bell className="size-4 text-primary" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-lg border-border">
        <div className="flex items-center justify-between border-b border-border p-3.5">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markMutation.mutate(null)}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read_at) markMutation.mutate(n.id);
                }}
                className={`p-3.5 transition-colors cursor-pointer hover:bg-muted/40 ${
                  !n.read_at ? "bg-muted/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">{getIcon(n.kind)}</div>
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`font-medium ${!n.read_at ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.read_at && (
                        <span className="size-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    {n.body && <p className="text-muted-foreground">{n.body}</p>}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono pt-1">
                      <Clock className="size-3" />
                      <span>{n.created_at}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
