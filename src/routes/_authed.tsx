import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUser } from "@/lib/auth.functions";
import { Shell, type Viewer } from "@/components/fed/Shell";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user) throw redirect({ to: "/auth" });
    if (user.status !== "approved") throw redirect({ to: "/auth" });
    return { viewer: user as Viewer };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { viewer } = Route.useRouteContext() as unknown as { viewer: Viewer };

  const titleMap: Record<number, string> = {
    1: "National Administration",
    2: "State Administration",
    3: "District Administration",
    4: "Official Console",
  };

  const subtitleMap: Record<number, string> = {
    1: "Full federation oversight — all states, districts, tournaments, and match corrections.",
    2: "State-scoped management — district approvals, tournament registrations, match certification.",
    3: "District-scoped management — grassroots player pool, roster submissions, team management.",
    4: "Live match assignment console — scorekeeper sheet for assigned fixtures.",
  };

  return (
    <Shell
      viewer={viewer}
      title={titleMap[viewer.role_id] ?? "Dashboard"}
      subtitle={subtitleMap[viewer.role_id] ?? "Welcome to the Federation platform."}
    >
      <Outlet />
    </Shell>
  );
}
