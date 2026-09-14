import { createFileRoute, redirect } from '@tanstack/react-router';
import { currentUser } from '@/lib/auth.functions';
import type { Viewer } from '@/components/fed/Shell';
import { MatchCenter } from '@/components/fed/MatchCenter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_authed/official/console')({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || user.role_id !== 4) throw redirect({ to: '/auth' });
    return { viewer: user as Viewer };
  },
  component: MatchOfficialConsole,
});

function MatchOfficialConsole() {
  const { viewer } = Route.useRouteContext() as unknown as { viewer: Viewer };

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Match Official Console</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {viewer.full_name}</CardTitle>
          <CardDescription>
            You are viewing your assigned fixtures. Submit scores using the Record Score button.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-8">
        <MatchCenter viewerRoleId={4} viewerId={viewer.id} />
      </div>
    </div>
  );
}
