import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currentUser } from '@/lib/auth.functions';
import { getTeams } from '@/lib/federation.functions';
import type { Viewer } from '@/components/fed/Shell';
import { ApprovalQueue } from '@/components/fed/ApprovalQueue';
import { RosterBuilder } from '@/components/fed/RosterBuilder';
import { RosterStatusBadge } from '@/components/fed/RosterStatusBadge';
import { MatchCenter } from '@/components/fed/MatchCenter';
import { StandingsTable } from '@/components/fed/StandingsTable';
import { TournamentRegistration } from '@/components/fed/TournamentRegistration';
import { CmsManager } from '@/components/admin/CmsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/_authed/admin/national')({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || user.role_id !== 1) throw redirect({ to: '/auth' });
    return { viewer: user as Viewer };
  },
  component: NationalDashboard,
});

function TeamsTab() {
  const { data: teams = [], isLoading } = useQuery({ queryKey: ["teams"], queryFn: () => getTeams() });
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading teams...</div>;

  return (
    <div className="space-y-6 mt-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Players</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team: any) => (
              <TableRow 
                key={team.id} 
                onClick={() => setSelectedTeam(team)} 
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="capitalize">{team.level}</TableCell>
                <TableCell>
                  {[team.state_name, team.district_name].filter(Boolean).join(' / ') || '—'}
                </TableCell>
                <TableCell>
                  <RosterStatusBadge status={team.roster_status || 'draft'} />
                </TableCell>
                <TableCell>{team.player_count || 0}</TableCell>
              </TableRow>
            ))}
            {teams.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No teams found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedTeam && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Managing Roster: {selectedTeam.name}</h3>
          <RosterBuilder 
            teamId={selectedTeam.id} 
            teamName={selectedTeam.name} 
            rosterStatus={selectedTeam.roster_status || 'draft'} 
          />
        </div>
      )}
    </div>
  );
}

function NationalDashboard() {
  const { viewer } = Route.useRouteContext() as unknown as { viewer: Viewer };

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">National Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage federation applications, national teams, and tournaments.</p>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="teams">Teams & Rosters</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments & Standings</TabsTrigger>
          <TabsTrigger value="matches">Match Center</TabsTrigger>
          <TabsTrigger value="cms">CMS & Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="approvals" className="space-y-4">
          <ApprovalQueue heading="State Admin Membership Queue" />
        </TabsContent>
        
        <TabsContent value="teams" className="space-y-4">
          <TeamsTab />
        </TabsContent>
        
        <TabsContent value="tournaments" className="space-y-8 mt-4">
          <TournamentRegistration viewerRoleId={1} />
          <div className="pt-4 border-t">
            <StandingsTable viewerRoleId={1} />
          </div>
        </TabsContent>
        
        <TabsContent value="matches" className="space-y-4 mt-4">
          <MatchCenter viewerRoleId={1} viewerId={viewer.id} />
        </TabsContent>

        <TabsContent value="cms" className="space-y-4 mt-4">
          <CmsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
