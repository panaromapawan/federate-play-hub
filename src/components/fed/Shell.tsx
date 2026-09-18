import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth.functions";
import { ROLE_LABELS } from "./roles";

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <Trophy className="size-6 text-primary" aria-hidden />
          <div className="mr-auto">
            <p className="eyebrow">Sports &amp; Gaming Federation</p>
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{viewer.full_name}</p>
              <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3" aria-hidden />
                {ROLE_LABELS[viewer.role_id] ?? "Member"}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut className="size-4" aria-hidden /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}
