import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Globe, Home, LogOut, ShieldCheck, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth.functions";
import { ROLE_LABELS } from "./roles";
import { NotificationBell } from "./NotificationBell";

export type Viewer = {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  state_id: number | null;
  district_id: number | null;
  status: string;
};

export function Shell({
  viewer,
  title,
  subtitle,
  children,
}: {
  viewer: Viewer;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await logout();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Federation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Trophy className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Federation Apex</p>
                <h1 className="font-serif text-sm font-bold tracking-tight text-foreground sm:text-base">
                  {title}
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mr-1"
              title="Visit Public Spectator Portal"
            >
              <Globe className="size-3.5" />
              <span>Public Portal</span>
            </Link>

            <NotificationBell />

            <div className="hidden md:block text-right border-l border-border pl-3 ml-1">
              <p className="text-xs font-semibold text-foreground">{viewer.full_name}</p>
              <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground font-mono">
                <ShieldCheck className="size-3 text-emerald-500" aria-hidden />
                {ROLE_LABELS[viewer.role_id] ?? "Member"}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="h-8 text-xs gap-1.5 font-medium ml-1"
            >
              <LogOut className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Trail */}
      <div className="border-b border-border/50 bg-muted/20 px-4 py-2 text-xs sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 text-muted-foreground">
          <Link to="/" className="hover:text-foreground flex items-center gap-1">
            <Home className="size-3" />
            <span>Home</span>
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground font-medium">{title}</span>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <p className="mb-6 max-w-3xl text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border/60 bg-card py-4 text-center text-xs text-muted-foreground">
        <p>Rajasthan Sepak Takraw Association &bull; Dual-Sport Federation Management Portal &bull; Zero-Trust Stored Procedure Engine</p>
      </footer>
    </div>
  );
}
