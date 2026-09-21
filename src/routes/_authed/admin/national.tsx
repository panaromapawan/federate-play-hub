import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currentUser } from '@/lib/auth.functions';
import { getTeams } from '@/lib/federation.functions';
import { listTeams, type TeamListRow } from '@/lib/tables.functions';
import type { Viewer } from '@/components/fed/Shell';
import { OverviewTab } from '@/components/fed/OverviewTab';
import { ApprovalQueue } from '@/components/fed/ApprovalQueue';
import { PlayerDirectory } from '@/components/fed/PlayerDirectory';
import { RosterBuilder } from '@/components/fed/RosterBuilder';
import { RosterStatusBadge } from '@/components/fed/RosterStatusBadge';
import { MatchCenter } from '@/components/fed/MatchCenter';
import { StandingsTable } from '@/components/fed/StandingsTable';
import { TournamentRegistration } from '@/components/fed/TournamentRegistration';
import { DocumentCenter } from '@/components/fed/DocumentCenter';
import { CmsManager } from '@/components/admin/CmsManager';
import { AuditLogViewer } from '@/components/fed/AuditLogViewer';
import { DataTable, type ColumnDef } from '@/components/fed/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/_authed/admin/national')({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || user.role_id !== 1) throw redirect({ to: '/auth' });
    return { viewer: user as Viewer };
  },
  component: NationalDashboard,
});

function TeamsTab() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTeam, setSelectedTeam] = useState<TeamListRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teams-paginated', search, levelFilter, statusFilter, page, pageSize],
    queryFn: () =>
      listTeams({
        data: {
          search: search || undefined,
          level: levelFilter === 'all' ? undefined : levelFilter,
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
      header: 'Jurisdiction',
      cell: (row) => (
        <span className="text-muted-foreground">
          {[row.state_name, row.district_name].filter(Boolean).join(' / ') || 'National'}
        </span>
      ),
    },
    {
      header: 'Roster Status',
      cell: (row) => <RosterStatusBadge status={row.roster_status || 'draft'} />,
    },
    {
      header: 'Athletes',
      cell: (row) => <span className="font-mono">{row.player_count}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold">Federation Team Registry</h3>
          <p className="text-xs text-muted-foreground">
            Select a team row to inspect, validate squad sizes, and manage roster lifecycle transitions.
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
              id: 'level',
              label: 'Level',
              value: levelFilter,
              options: [
                { label: 'All Levels', value: 'all' },
                { label: 'National', value: 'national' },
                { label: 'State', value: 'state' },
                { label: 'District', value: 'district' },
              ],
              onChange: (v) => {
                setLevelFilter(v);
                setPage(0);
              },
            },
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
          exportFilename="federation-teams.csv"
          emptyMessage="No teams found matching current criteria."
        />
      </div>

      {selectedTeam && (
        <div className="mt-8 border-t border-border pt-6">
          <RosterBuilder
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
            rosterStatus={selectedTeam.roster_status || 'draft'}
            viewerRoleId={1}
          />
        </div>
      )}
    </div>
  );
}

function NationalDashboard() {
  const { viewer } = Route.useRouteContext() as unknown as { viewer: Viewer };
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs">Approvals</TabsTrigger>
          <TabsTrigger value="players" className="text-xs">Athletes</TabsTrigger>
          <TabsTrigger value="teams" className="text-xs">Teams &amp; Rosters</TabsTrigger>
          <TabsTrigger value="tournaments" className="text-xs">Tournaments</TabsTrigger>
          <TabsTrigger value="matches" className="text-xs">Match Centre</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Governance</TabsTrigger>
          <TabsTrigger value="cms" className="text-xs">CMS &amp; Settings</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">Cryptographic Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab viewer={viewer} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <ApprovalQueue heading="State Association Membership &amp; Credentials Queue" />
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <PlayerDirectory canRegister={true} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-8">
          <TournamentRegistration viewerRoleId={1} />
          <div className="pt-4 border-t border-border">
            <StandingsTable viewerRoleId={1} />
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <MatchCenter viewerRoleId={1} viewerId={viewer.id} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentCenter />
        </TabsContent>

        <TabsContent value="cms" className="space-y-4">
          <CmsManager />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
