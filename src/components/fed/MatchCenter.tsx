import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMatches,
  getMatchSquads,
  recordMatchResult,
  certifyMatchResult,
  correctCertifiedResult,
} from "@/lib/federation.functions";
import { useProcedure } from "@/components/fed/useAction";
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
import type { MatchRow } from "@/lib/federation.functions";

interface MatchCenterProps {
  viewerRoleId: number;
  viewerId: number;
}

function statusBadge(status: string | null) {
  const s = (status ?? "").toLowerCase();
  switch (s) {
    case "scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
    case "completed":
      return <Badge variant="default">Completed</Badge>;
    case "certified":
      return <Badge className="bg-success text-success-foreground">Certified</Badge>;
    case "corrected":
      return <Badge className="bg-destructive/80 text-destructive-foreground">Corrected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function MatchCenter({ viewerRoleId, viewerId }: MatchCenterProps) {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => getMatches(),
  });

  // Scorekeeper state
  const [scoreOpen, setScoreOpen] = useState(false);
  const [activeMatch, setActiveMatch] = useState<MatchRow | null>(null);
  const [t1Score, setT1Score] = useState("");
  const [t2Score, setT2Score] = useState("");
  const [momPlayer, setMomPlayer] = useState("");
  const [scoreSummary, setScoreSummary] = useState("");

  // Certify state
  const [certOpen, setCertOpen] = useState(false);
  const [certReason, setCertReason] = useState("");

  // Correction state
  const [correctOpen, setCorrectOpen] = useState(false);
  const [correctReason, setCorrectReason] = useState("");

  // MOM squads query — only when score dialog is open
  const { data: squads = [] } = useQuery({
    queryKey: ["matchSquads", activeMatch?.id],
    queryFn: () => getMatchSquads({ data: { matchId: activeMatch!.id } }),
    enabled: !!activeMatch && scoreOpen,
  });

  const scoreMutation = useProcedure(recordMatchResult, ["matches"]);
  const certifyMutation = useProcedure(certifyMatchResult, ["matches"]);
  const correctMutation = useProcedure(correctCertifiedResult, ["matches"]);

  function openScoreDialog(match: MatchRow) {
    setActiveMatch(match);
    setT1Score(match.team1_score?.toString() ?? "");
    setT2Score(match.team2_score?.toString() ?? "");
    setMomPlayer("");
    setScoreSummary("");
    setScoreOpen(true);
  }

  function openCertDialog(match: MatchRow) {
    setActiveMatch(match);
    setCertReason("");
    setCertOpen(true);
  }

  function openCorrectDialog(match: MatchRow) {
    setActiveMatch(match);
    setT1Score(match.team1_score?.toString() ?? "");
    setT2Score(match.team2_score?.toString() ?? "");
    setCorrectReason("");
    setCorrectOpen(true);
  }

  async function submitScore() {
    if (!activeMatch) return;
    const result = await scoreMutation.mutateAsync({
      matchId: activeMatch.id,
      team1Score: Number(t1Score),
      team2Score: Number(t2Score),
      manOfMatchPlayerId: momPlayer ? Number(momPlayer) : null,
      summary: scoreSummary.trim(),
    } as never);
    if (result.ok) setScoreOpen(false);
  }

  async function submitCertify() {
    if (!activeMatch) return;
    const result = await certifyMutation.mutateAsync({
      matchId: activeMatch.id,
      reason: certReason.trim(),
    } as never);
    if (result.ok) setCertOpen(false);
  }

  async function submitCorrection() {
    if (!activeMatch) return;
    const result = await correctMutation.mutateAsync({
      matchId: activeMatch.id,
      team1Score: Number(t1Score),
      team2Score: Number(t2Score),
      reason: correctReason.trim(),
    } as never);
    if (result.ok) setCorrectOpen(false);
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading matches…</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Match Center</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No matches found.
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{m.tournament_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {m.scheduled_at
                        ? new Date(m.scheduled_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.team1_name} vs {m.team2_name}
                    </TableCell>
                    <TableCell>
                      {m.team1_score !== null
                        ? `${m.team1_score} – ${m.team2_score}`
                        : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      {viewerRoleId === 4 &&
                        (m.status === "scheduled" || m.status === "in_progress") && (
                          <Button size="sm" onClick={() => openScoreDialog(m)}>
                            Record Score
                          </Button>
                        )}
                      {(viewerRoleId === 1 || viewerRoleId === 2) &&
                        m.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCertDialog(m)}
                          >
                            Certify
                          </Button>
                        )}
                      {viewerRoleId === 1 && m.status === "certified" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openCorrectDialog(m)}
                        >
                          Correct Score
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Scorekeeper Dialog */}
        <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Record Score: {activeMatch?.team1_name} vs {activeMatch?.team2_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>{activeMatch?.team1_name} Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t1Score}
                    onChange={(e) => setT1Score(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{activeMatch?.team2_name} Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t2Score}
                    onChange={(e) => setT2Score(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Man of the Match</Label>
                <Select value={momPlayer} onValueChange={setMomPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select MOM (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {squads.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.full_name ?? `Player #${p.id}`} ({p.team_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={scoreSummary}
                  onChange={(e) => setScoreSummary(e.target.value)}
                  placeholder="Brief match summary…"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setScoreOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitScore}
                disabled={
                  !t1Score ||
                  !t2Score ||
                  scoreSummary.trim().length < 3 ||
                  scoreMutation.isPending
                }
              >
                Submit Score
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Certification Dialog */}
        <Dialog open={certOpen} onOpenChange={setCertOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Certify Match Result</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Certification Reason</Label>
              <Textarea
                value={certReason}
                onChange={(e) => setCertReason(e.target.value)}
                placeholder="Scores verified against official match sheet…"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCertOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitCertify}
                disabled={certReason.trim().length < 3 || certifyMutation.isPending}
              >
                Certify Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Score Correction Dialog */}
        <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Correct Certified Score (National Admin)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>{activeMatch?.team1_name} New Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t1Score}
                    onChange={(e) => setT1Score(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{activeMatch?.team2_name} New Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t2Score}
                    onChange={(e) => setT2Score(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Correction</Label>
                <Textarea
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="Scoresheet transcription error identified…"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCorrectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={submitCorrection}
                disabled={
                  !t1Score ||
                  !t2Score ||
                  correctReason.trim().length < 3 ||
                  correctMutation.isPending
                }
              >
                Update Score
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
