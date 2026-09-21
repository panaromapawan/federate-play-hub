import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currentUser } from '@/lib/auth.functions';
import { listTeams, type TeamListRow } from '@/lib/tables.functions';
import type { Viewer } from '@/components/fed/Shell';
import { OverviewTab } from '@/components/fed/OverviewTab';
import { PlayerDirectory } from '@/components/fed/PlayerDirectory';
import { AthleteUploader } from '@/components/district/AthleteUploader';
import { RosterBuilder } from '@/components/fed/RosterBuilder';
import { RosterStatusBadge } from '@/components/fed/RosterStatusBadge';
import { StandingsTable } from '@/components/fed/StandingsTable';
import { DocumentCenter } from '@/components/fed/DocumentCenter';
import { DataTable, type ColumnDef } from '@/components/fed/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/_authed/admin/district')({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || user.role_id !== 3) throw redirect({ to: '/auth' });
    return { viewer: user as Viewer };
  },
  component: DistrictDashboard,
});

function TeamsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTeam, setSelectedTeam] = useState<TeamListRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teams-paginated-dist', search, statusFilter, page, pageSize],
    queryFn: () =>
      listTeams({
        data: {
          search: search || undefined,
          rosterStatus: statusFilter === 'all' ? undefined : statusFilter,
          limit: pageSize,
          offset: page * pageSize,
        },
      }),
  });

  const columns: ColumnDef<TeamListRow>[] = [
    {
      header: 'Team Name',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="text-[10px] text-muted-foreground">{row.sport_name ?? 'Sepak Takraw'} &bull; {row.season}</div>
        </div>
      ),
    },
    {
      header: 'Level',
      accessorKey: 'level',
      cell: (row) => <span className="capitalize">{row.level}</span>,
    },
    {
      header: 'Roster Status',
      cell: (row) => <RosterStatusBadge status={row.roster_status || 'draft'} />,
    },
    {
      header: 'Athletes Registered',
      cell: (row) => <span className="font-mono">{row.player_count}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold">District Club Teams</h3>
          <p className="text-xs text-muted-foreground">
            Select a team to add registered grassroots athletes, designate team captain, and submit roster for state approval.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={data?.rows ?? []}
          total={data?.total ?? 0}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchPlaceholder="Search team name..."
          filters={[
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              options: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Approved', value: 'approved' },
                { label: 'Frozen', value: 'frozen' },
              ],
              onChange: (v) => {
                setStatusFilter(v);
                setPage(0);
              },
            },
          ]}
          onRowClick={(row) => setSelectedTeam(row)}
          exportFilename="district-teams.csv"
          emptyMessage="No district teams found matching current criteria."
        />
      </div>

      {selectedTeam && (
        <div className="mt-8 border-t border-border pt-6">
          <RosterBuilder
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
            rosterStatus={selectedTeam.roster_status || 'draft'}
            viewerRoleId={3}
          />
        </div>
      )}
    </div>
  );
}

function DistrictDashboard() {
  const { viewer } = Route.useRouteContext() as unknown as { viewer: Viewer };
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="players" className="text-xs">Grassroots Athletes</TabsTrigger>
          <TabsTrigger value="athlete-photos" className="text-xs">Athlete Registry &amp; Photos</TabsTrigger>
          <TabsTrigger value="teams" className="text-xs">Teams &amp; Rosters</TabsTrigger>
          <TabsTrigger value="standings" className="text-xs">Standings</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab viewer={viewer} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <PlayerDirectory canRegister={true} />
        </TabsContent>

        <TabsContent value="athlete-photos" className="space-y-4">
          <AthleteUploader />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="standings" className="space-y-4">
          <StandingsTable viewerRoleId={3} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
