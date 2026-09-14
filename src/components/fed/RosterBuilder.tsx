import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getRoster,
  addRosterPlayer,
  removeRosterPlayer,
  transitionRoster,
} from "@/lib/federation.functions";
import { useProcedure } from "@/components/fed/useAction";
import { RosterStatusBadge, isFrozen } from "@/components/fed/RosterStatusBadge";
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
}

export function RosterBuilder({ teamId, teamName, rosterStatus }: RosterBuilderProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<
    "draft" | "submitted" | "approved" | "frozen"
  >("submitted");

  const { data, isLoading } = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => getRoster({ data: { teamId } }),
  });

  const addMutation = useProcedure(addRosterPlayer, ["roster"]);
  const removeMutation = useProcedure(removeRosterPlayer, ["roster"]);
  const transitionMutation = useProcedure(transitionRoster, ["roster", "teams"]);

  const frozen = isFrozen(rosterStatus);
  const players = data?.roster ?? [];
  const availablePlayers = data?.availablePlayers ?? [];

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{teamName} Roster</span>
          <RosterStatusBadge status={rosterStatus} size="lg" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {frozen && (
          <div className="rounded-md bg-destructive/10 p-3 text-center font-semibold text-destructive">
            🔒 This roster is frozen. No modifications are permitted.
          </div>
        )}

        {/* Current roster */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player Name</TableHead>
              <TableHead>Jersey #</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                <TableCell>{p.jersey_no ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={frozen || removeMutation.isPending}
                    onClick={() => handleRemovePlayer(p.player_id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {players.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No players on this roster yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Add player section */}
        {!frozen && (
          <div className="flex items-end gap-4 rounded-md border bg-muted/50 p-4">
            <div className="flex-1 space-y-2">
              <Label>Available Players</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.map((ap) => (
                    <SelectItem key={ap.id} value={ap.id.toString()}>
                      {ap.full_name ?? `Player #${ap.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 space-y-2">
              <Label>Jersey #</Label>
              <Input
                type="number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="10"
              />
            </div>
            <Button
              onClick={handleAddPlayer}
              disabled={!selectedPlayer || addMutation.isPending}
            >
              Add Player
            </Button>
          </div>
        )}

        <Separator />

        {/* Status transitions */}
        <div className="flex flex-wrap gap-2">
          {(!rosterStatus || rosterStatus === "draft") && (
            <Button variant="outline" onClick={() => openTransition("submitted")}>
              Submit Roster
            </Button>
          )}
          {rosterStatus === "submitted" && (
            <Button variant="outline" onClick={() => openTransition("approved")}>
              Approve Roster
            </Button>
          )}
          {rosterStatus === "approved" && (
            <Button variant="default" onClick={() => openTransition("frozen")}>
              Freeze Roster
            </Button>
          )}
          {rosterStatus === "frozen" && (
            <Button variant="destructive" onClick={() => openTransition("draft")}>
              Emergency Unfreeze to Draft
            </Button>
          )}
        </div>

        {/* Transition dialog */}
        <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                Confirm: move to {transitionTarget}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Reason (required, min 3 characters)</Label>
              <Textarea
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="Roster verified and ready for submission…"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setTransitionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTransition}
                disabled={transitionReason.trim().length < 3 || transitionMutation.isPending}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
