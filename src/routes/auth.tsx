import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Trophy, AlertCircle, Clock, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, currentUser, type AuthResult } from "@/lib/auth.functions";

function dashboardPath(roleId: number): string {
  switch (roleId) {
    case 1: return "/admin/national";
    case 2: return "/admin/state";
    case 3: return "/admin/district";
    case 4: return "/official/console";
    default: return "/";
  }
}

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (user && user.status === "approved") {
      throw redirect({ to: dashboardPath(user.role_id) });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Extract<AuthResult, { ok: false }> | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await login({ data: { email, password } });
      if (res.ok) {
        window.location.href = dashboardPath(res.user.role_id);
      } else {
        setResult(res);
      }
    } catch {
      setResult({ ok: false, reason: "error", message: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  }

  // Status-specific screens
  if (result && result.reason === "pending") {
    return (
      <StatusScreen
        icon={<Clock className="size-12 text-warning" />}
        title="Awaiting Administrative Approval"
        description="Your membership application has been received and is under review. You will be notified once an administrator approves your account."
        action={<Button variant="secondary" onClick={() => setResult(null)}>Back to login</Button>}
      />
    );
  }

  if (result && result.reason === "suspended") {
    return (
      <StatusScreen
        icon={<ShieldX className="size-12 text-destructive" />}
        title="Account Suspended"
        description="Your federation account has been suspended by an administrator. If you believe this is an error, please contact your State or National administrator."
        action={<Button variant="secondary" onClick={() => setResult(null)}>Back to login</Button>}
      />
    );
  }

  if (result && result.reason === "rejected") {
    return (
      <StatusScreen
        icon={<ShieldX className="size-12 text-destructive" />}
        title="Account Not Active"
        description={result.message}
        action={<Button variant="secondary" onClick={() => setResult(null)}>Back to login</Button>}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="size-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Federation Login</CardTitle>
          <CardDescription>
            Sign in with your registered federation credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@federation.org"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {result && (result.reason === "invalid" || result.reason === "error") && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{result.message}</span>
              </div>
            )}
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold" disabled={loading}>
              {loading ? "Authenticating Session…" : "Sign In to Federation Console"}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block text-center">
              Quick 1-Click Role Login:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("nat@fed.in");
                  setPassword("password");
                }}
                className="text-[11px] text-left p-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-amber-500/50 hover:bg-slate-900 transition-colors"
              >
                <div className="font-bold text-amber-400">National Admin</div>
                <div className="text-slate-400 font-mono text-[10px]">nat@fed.in</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("state.rj@fed.in");
                  setPassword("password");
                }}
                className="text-[11px] text-left p-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-emerald-500/50 hover:bg-slate-900 transition-colors"
              >
                <div className="font-bold text-emerald-400">State Admin (RJ)</div>
                <div className="text-slate-400 font-mono text-[10px]">state.rj@fed.in</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("dist.jdh@fed.in");
                  setPassword("password");
                }}
                className="text-[11px] text-left p-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-blue-500/50 hover:bg-slate-900 transition-colors"
              >
                <div className="font-bold text-blue-400">District Admin (JDH)</div>
                <div className="text-slate-400 font-mono text-[10px]">dist.jdh@fed.in</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("official.1@fed.in");
                  setPassword("password");
                }}
                className="text-[11px] text-left p-2 rounded-lg border border-slate-800 bg-slate-900/70 hover:border-purple-500/50 hover:bg-slate-900 transition-colors"
              >
                <div className="font-bold text-purple-400">Match Official</div>
                <div className="text-slate-400 font-mono text-[10px]">official.1@fed.in</div>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400">Password for all test roles: <code className="text-amber-400">password</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusScreen({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/80 text-center backdrop-blur">
        <CardHeader>
          <div className="mx-auto mb-2">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent>{action}</CardContent>
      </Card>
    </div>
  );
}
