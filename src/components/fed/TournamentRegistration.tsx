import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTournaments,
  getTeams,
  registerTournamentTeam,
} from "@/lib/federation.functions";
import { useProcedure } from "@/components/fed/useAction";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TournamentRegistrationProps {
  viewerRoleId: number;
}

export function TournamentRegistration({ viewerRoleId }: TournamentRegistrationProps) {
  const [tournamentId, setTournamentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [reason, setReason] = useState("");

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => getTournaments(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => getTeams(),
  });

  const registerMutation = useProcedure(registerTournamentTeam, ["tournaments"]);

  // INV-06 UX: only frozen-roster teams are eligible
  const eligibleTeams = teams.filter((t) => t.roster_status === "frozen");
  const hasIneligibleTeams = teams.some((t) => t.roster_status !== "frozen");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentId || !teamId || groupName.trim().length < 1 || reason.trim().length < 3)
      return;
    const result = await registerMutation.mutateAsync({
      tournamentId: Number(tournamentId),
      teamId: Number(teamId),
      groupName: groupName.trim(),
      reason: reason.trim(),
    } as never);
    if (result.ok) {
      setTournamentId("");
      setTeamId("");
      setGroupName("");
      setReason("");
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Register Team for Tournament</CardTitle>
        <CardDescription>
          Enrol a team with a frozen roster into an active tournament.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Tournament</Label>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select tournament" />
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

          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {eligibleTeams.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasIneligibleTeams && (
              <p className="mt-1 text-sm text-muted-foreground">
                ⚠ Only teams with frozen rosters are eligible for tournament registration.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Group A"
            />
          </div>

          <div className="space-y-2">
            <Label>Reason / Notes</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Team eligibility confirmed, frozen roster verified…"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              !tournamentId ||
              !teamId ||
              groupName.trim().length < 1 ||
              reason.trim().length < 3 ||
              registerMutation.isPending
            }
          >
            Register Team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
