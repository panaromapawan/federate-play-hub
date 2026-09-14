import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currentUser } from '@/lib/auth.functions';
import { getTeams } from '@/lib/federation.functions';
import type { Viewer } from '@/components/fed/Shell';
import { PlayerDirectory } from '@/components/fed/PlayerDirectory';
import { AthleteUploader } from '@/components/district/AthleteUploader';
import { RosterBuilder } from '@/components/fed/RosterBuilder';
import { RosterStatusBadge } from '@/components/fed/RosterStatusBadge';
import { StandingsTable } from '@/components/fed/StandingsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/_authed/admin/district')({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || user.role_id !== 3) throw redirect({ to: '/auth' });
    return { viewer: user as Viewer };
  },
  component: DistrictDashboard,
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

function DistrictDashboard() {
  const { viewer } = Route.useRouteContext() as unknown as { viewer: Viewer };

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">District Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage players, teams, and view local standings.</p>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="teams">Teams & Rosters</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="space-y-6">
          <AthleteUploader />
          <PlayerDirectory canRegister={false} />
        </TabsContent>
        
        <TabsContent value="teams" className="space-y-4">
          <TeamsTab />
        </TabsContent>
        
        <TabsContent value="standings" className="space-y-4 mt-4">
          <StandingsTable viewerRoleId={3} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
