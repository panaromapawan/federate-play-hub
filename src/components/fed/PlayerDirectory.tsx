import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerPlayer } from "@/lib/federation.functions";
import { listPlayers, type PlayerRow } from "@/lib/tables.functions";
import { DataTable, type ColumnDef } from "./DataTable";
import { useProcedure } from "./useAction";

export function PlayerDirectory({ canRegister }: { canRegister: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading } = useQuery({
    queryKey: ["players-paginated", search, statusFilter, page, pageSize],
    queryFn: () =>
      listPlayers({
        data: {
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: pageSize,
          offset: page * pageSize,
        },
      }),
  });

  // Player registration state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const mutation = useProcedure(registerPlayer, ["players", "players-paginated"]);

  async function submit() {
    const result = await mutation.mutateAsync({ data: { fullName, dob, gender } } as never);
    if (result.ok) {
      setFullName("");
      setDob("");
    }
  }

  const columns: ColumnDef<PlayerRow>[] = [
    {
      header: "Player Name",
      accessorKey: "name",
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.name}</div>
          {row.playing_position && (
            <div className="text-[10px] text-muted-foreground">{row.playing_position}</div>
          )}
        </div>
      ),
    },
    {
      header: "DOB / Age",
      accessorKey: "dob",
      cell: (row) => (
        <span className="font-mono text-muted-foreground">
          {row.dob ? new Date(row.dob).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      header: "Gender",
      accessorKey: "gender",
      cell: (row) => (
        <span className="capitalize">{row.gender === "M" ? "Male" : row.gender === "F" ? "Female" : row.gender}</span>
      ),
    },
    {
      header: "District / State",
      cell: (row) => (
        <span className="text-muted-foreground">
          {[row.district_name, row.state_name].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge
          variant={row.status === "active" ? "default" : "secondary"}
          className="capitalize font-mono text-[10px]"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className={`grid gap-6 ${canRegister ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold">Player Registry</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grassroots athletes accredited and registered inside your federation jurisdiction.
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
          searchPlaceholder="Search player by name or position..."
          filters={[
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
                { label: "Retired", value: "retired" },
              ],
              onChange: (v) => {
                setStatusFilter(v);
                setPage(0);
              },
            },
          ]}
          exportFilename="federation-players.csv"
          emptyMessage="No athletes registered matching criteria."
        />
      </div>

      {canRegister && (
        <aside className="rounded-xl border border-border bg-card p-5 shadow-sm h-fit space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold">Register New Athlete</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a new player to your grassroots district pool.
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date of Birth</Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !fullName.trim() || !dob}
              className="w-full text-xs font-semibold h-9 mt-2"
            >
              {mutation.isPending ? "Registering…" : "Register Athlete"}
            </Button>
          </form>
        </aside>
      )}
    </div>
  );
}
