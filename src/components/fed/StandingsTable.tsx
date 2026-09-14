import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTournaments,
  getStandings,
  recalculateStandings,
} from "@/lib/federation.functions";
import { useProcedure } from "@/components/fed/useAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StandingsTableProps {
  viewerRoleId: number;
}

export function StandingsTable({ viewerRoleId }: StandingsTableProps) {
  const [selectedTournament, setSelectedTournament] = useState("");

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => getTournaments(),
  });

  const tournamentId = selectedTournament ? Number(selectedTournament) : 0;

  const { data: standings = [], isLoading } = useQuery({
    queryKey: ["standings", tournamentId],
    queryFn: () => getStandings({ data: { tournamentId } }),
    enabled: tournamentId > 0,
  });

  const recalcMutation = useProcedure(recalculateStandings, ["standings"]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tournament Standings</CardTitle>
        {(viewerRoleId === 1 || viewerRoleId === 2) && tournamentId > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={recalcMutation.isPending}
            onClick={() =>
              recalcMutation.mutate({ tournamentId } as never)
            }
          >
            Recalculate
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-64 space-y-2">
          <Label>Select Tournament</Label>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tournamentId > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">T</TableHead>
                  <TableHead className="text-center font-bold">Pts</TableHead>
                  <TableHead className="text-center">SD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Loading standings…
                    </TableCell>
                  </TableRow>
                ) : standings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No standings available for this tournament.
                    </TableCell>
                  </TableRow>
                ) : (
                  standings.map((s, i) => (
                    <TableRow key={s.team_name}>
                      <TableCell className="text-center font-medium">{i + 1}</TableCell>
                      <TableCell className="font-semibold">{s.team_name}</TableCell>
                      <TableCell className="text-center">{s.played}</TableCell>
                      <TableCell className="text-center">{s.won}</TableCell>
                      <TableCell className="text-center">{s.lost}</TableCell>
                      <TableCell className="text-center">{s.tied}</TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        {s.points}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.score_difference > 0 ? "+" : ""}
                        {s.score_difference}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
