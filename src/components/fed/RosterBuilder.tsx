import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Crown, Lock, ShieldAlert, XCircle } from "lucide-react";
import {
  getRoster,
  addRosterPlayer,
  removeRosterPlayer,
  transitionRoster,
} from "@/lib/federation.functions";
import { useProcedure } from "@/components/fed/useAction";
import { RosterStatusBadge, isFrozen } from "@/components/fed/RosterStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface RosterBuilderProps {
  teamId: number;
  teamName: string;
  rosterStatus: string | null;
  viewerRoleId?: number;
}

export function RosterBuilder({ teamId, teamName, rosterStatus, viewerRoleId = 1 }: RosterBuilderProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [squadRole, setSquadRole] = useState<"player" | "captain" | "vice_captain">("player");
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<
    "draft" | "submitted" | "approved" | "frozen"
  >("submitted");

  const { data, isLoading } = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => getRoster({ data: { teamId } }),
  });

  const addMutation = useProcedure(addRosterPlayer, ["roster", "teams"]);
  const removeMutation = useProcedure(removeRosterPlayer, ["roster", "teams"]);
  const transitionMutation = useProcedure(transitionRoster, ["roster", "teams"]);

  const frozen = isFrozen(rosterStatus);
  const players = data?.roster ?? [];
  const availablePlayers = data?.availablePlayers ?? [];

  // Squad Checklist Validations
  const playerCount = players.length;
  const hasMinPlayers = playerCount >= 12;
  const withinMaxPlayers = playerCount <= 20;
  // Look for any captain in the roster
  const captains = players.filter((p: any) => p.squad_role === "captain" || p.position === "captain");
  const hasExactOneCaptain = captains.length === 1;

  // Duplicate jerseys check
  const jerseyCounts = new Map<string, number>();
  for (const p of players) {
    if (p.jersey_no) {
      const j = String(p.jersey_no).trim();
      jerseyCounts.set(j, (jerseyCounts.get(j) ?? 0) + 1);
    }
  }
  const hasDuplicateJerseys = Array.from(jerseyCounts.values()).some((cnt) => cnt > 1);

  async function handleAddPlayer() {
    if (!selectedPlayer) return;
    const result = await addMutation.mutateAsync({
      teamId,
      playerId: Number(selectedPlayer),
      jerseyNo: jerseyNumber ? Number(jerseyNumber) : null,
    } as never);
    if (result.ok) {
      setSelectedPlayer("");
      setJerseyNumber("");
      setSquadRole("player");
    }
  }

  async function handleRemovePlayer(playerId: number) {
    await removeMutation.mutateAsync({ teamId, playerId } as never);
  }

  function openTransition(target: typeof transitionTarget) {
    setTransitionTarget(target);
    setTransitionReason("");
    setTransitionDialogOpen(true);
  }

  async function handleTransition() {
    const result = await transitionMutation.mutateAsync({
      teamId,
      targetStatus: transitionTarget,
      reason: transitionReason.trim(),
    } as never);
    if (result.ok) setTransitionDialogOpen(false);
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading roster…</div>;
  }

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif">{teamName} Roster</span>
            <RosterStatusBadge status={rosterStatus} size="lg" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {playerCount} of 12-20 registered athletes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frozen Lock Banner */}
        {frozen && (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-center gap-3">
              <Lock className="size-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Roster Officially Frozen & Certified</p>
                <p className="text-xs opacity-90">
                  Modifications are locked by federation regulations. Only National Administration may authorize an emergency unfreeze.
                </p>
              </div>
            </div>
            {viewerRoleId === 1 && (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs font-semibold"
                onClick={() => openTransition("draft")}
              >
                Emergency Unfreeze
              </Button>
            )}
          </div>
        )}

        {/* Squad Eligibility Checklist */}
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Roster Eligibility Checklist (INV-03 / INV-04)
          </h4>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="flex items-center gap-2">
              {hasMinPlayers && withinMaxPlayers ? (
                <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="size-4 text-amber-500 flex-shrink-0" />
              )}
              <span>
                Squad Size: <strong>{playerCount}</strong> (Min 12, Max 20)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasExactOneCaptain ? (
                <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="size-4 text-amber-500 flex-shrink-0" />
              )}
              <span>
                Captain: {hasExactOneCaptain ? <strong>{captains[0].full_name}</strong> : <span className="text-muted-foreground">None assigned</span>}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!hasDuplicateJerseys ? (
                <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="size-4 text-destructive flex-shrink-0" />
              )}
              <span>
                Jerseys: {!hasDuplicateJerseys ? <strong>Unique</strong> : <span className="text-destructive font-semibold">Duplicate detected</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Current Roster Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">Player Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Jersey #</TableHead>
                <TableHead className="text-xs font-semibold uppercase">Role / Position</TableHead>
                <TableHead className="w-[100px] text-right text-xs font-semibold uppercase">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => {
                const isCaptain = p.squad_role === "captain" || p.position === "captain";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-2">
                        {p.full_name ?? "—"}
                        {isCaptain && (
                          <Badge variant="secondary" className="gap-1 text-[10px] uppercase font-mono px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <Crown className="size-3" /> Captain
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.jersey_no ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">
                      {p.squad_role ?? p.position ?? "Player"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        disabled={frozen || removeMutation.isPending}
                        onClick={() => handleRemovePlayer(p.player_id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {players.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                    No athletes added to this roster yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Player Section */}
        {!frozen && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Add Athlete to Squad Roster
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Available Athletes</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select an accredited athlete" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((ap) => (
                      <SelectItem key={ap.id} value={ap.id.toString()} className="text-xs">
                        {ap.full_name ?? `Player #${ap.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-24 space-y-1.5">
                <Label className="text-xs">Jersey #</Label>
                <Input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="10"
                  className="h-9 text-xs"
                />
              </div>

              <Button
                onClick={handleAddPlayer}
                disabled={!selectedPlayer || addMutation.isPending}
                className="h-9 text-xs font-semibold self-end"
              >
                Add to Roster
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Status Lifecycle Transition Actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Roster Lifecycle Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {(!rosterStatus || rosterStatus === "draft") && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
                disabled={!hasMinPlayers}
                onClick={() => openTransition("submitted")}
                title={!hasMinPlayers ? "Minimum 12 players required to submit" : ""}
              >
                Submit Roster for Approval
              </Button>
            )}
            {rosterStatus === "submitted" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => openTransition("approved")}
                >
                  Approve Roster
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => openTransition("draft")}
                >
                  Return to Draft
                </Button>
              </>
            )}
            {rosterStatus === "approved" && (
              <Button
                variant="default"
                size="sm"
                className="text-xs font-semibold bg-primary"
                onClick={() => openTransition("frozen")}
              >
                Freeze Roster
              </Button>
            )}
          </div>
        </div>

        {/* Transition Confirmation Dialog */}
        <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
          <DialogContent className="border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="capitalize font-serif">
                Confirm: Move to {transitionTarget}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-xs">Reason for Authorization (required, min 3 characters)</Label>
              <Textarea
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="e.g. Squad validated, medicals cleared, submitted for state tournament..."
                rows={4}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                This authorization will be permanently recorded in the forensic SHA-256 audit ledger.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="secondary" size="sm" onClick={() => setTransitionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTransition}
                disabled={transitionReason.trim().length < 3 || transitionMutation.isPending}
              >
                {transitionMutation.isPending ? "Executing..." : "Authorize Transition"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
