import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { currentUser } from '@/lib/auth.functions';
import type { Viewer } from '@/components/fed/Shell';
import { OverviewTab } from '@/components/fed/OverviewTab';
import { MatchCenter } from '@/components/fed/MatchCenter';
import { DocumentCenter } from '@/components/fed/DocumentCenter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="matches" className="text-xs">Assigned Match Centre &amp; Live Scoring</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Official Rulebooks &amp; Circulars</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab viewer={viewer} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <MatchCenter viewerRoleId={4} viewerId={viewer.id} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
