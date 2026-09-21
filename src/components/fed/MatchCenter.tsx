import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Award, CheckCircle2, Clock, Play, Plus, ShieldAlert, Trophy } from "lucide-react";
import {
  getMatches,
  getMatchSquads,
  recordMatchResult,
  certifyMatchResult,
  correctCertifiedResult,
} from "@/lib/federation.functions";
import { startMatch, logMatchEvent, getMatchEvents, type MatchEventRow } from "@/lib/match_events.functions";
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
      return <Badge variant="secondary" className="font-mono text-[10px]">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-mono text-[10px] animate-pulse">In Progress</Badge>;
    case "completed":
      return <Badge variant="default" className="font-mono text-[10px]">Completed</Badge>;
    case "certified":
      return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-mono text-[10px]">Certified</Badge>;
    case "corrected":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-mono text-[10px]">Corrected</Badge>;
    default:
      return <Badge variant="outline" className="font-mono text-[10px]">{status}</Badge>;
  }
}

export function MatchCenter({ viewerRoleId, viewerId }: MatchCenterProps) {
  const queryClient = useQueryClient();
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => getMatches(),
  });

  // Scorekeeper & Live console state
  const [activeMatch, setActiveMatch] = useState<MatchRow | null>(null);
  const [liveConsoleOpen, setLiveConsoleOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
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

  // MOM squads query — only when score dialog or live console is open
  const { data: squads = [] } = useQuery({
    queryKey: ["matchSquads", activeMatch?.id],
    queryFn: () => getMatchSquads({ data: { matchId: activeMatch!.id } }),
    enabled: !!activeMatch && (scoreOpen || liveConsoleOpen),
  });

  // Live match events query
  const { data: liveEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ["matchEvents", activeMatch?.id],
    queryFn: () => getMatchEvents({ data: { matchId: activeMatch!.id } }),
    enabled: !!activeMatch && liveConsoleOpen,
    refetchInterval: 10000,
  });

  const scoreMutation = useProcedure(recordMatchResult, ["matches"]);
  const certifyMutation = useProcedure(certifyMatchResult, ["matches", "standings"]);
  const correctMutation = useProcedure(correctCertifiedResult, ["matches", "standings"]);

  const startMutation = useMutation({
    mutationFn: (matchId: number) => startMatch({ data: { matchId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const logEventMutation = useMutation({
    mutationFn: (args: {
      matchId: number;
      teamId: number;
      playerId?: number | null;
      eventType: "point" | "card_yellow" | "card_red" | "substitution" | "timeout" | "note";
      value?: number;
      note?: string;
    }) => logMatchEvent({ data: args }),
    onSuccess: () => {
      refetchEvents();
    },
  });

  function openScoreDialog(match: MatchRow) {
    setActiveMatch(match);
    // Tally points from live events if any
    setT1Score(match.team1_score?.toString() ?? "");
    setT2Score(match.team2_score?.toString() ?? "");
    setMomPlayer("");
    setScoreSummary("");
    setScoreOpen(true);
  }

  function openLiveConsole(match: MatchRow) {
    setActiveMatch(match);
    setLiveConsoleOpen(true);
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
    if (result.ok) {
      setScoreOpen(false);
      setLiveConsoleOpen(false);
    }
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

  // Tally live points
  const t1Points = liveEvents
    .filter((e) => e.team_id === activeMatch?.team1_id && e.event_type === "point")
    .reduce((sum, e) => sum + e.value, 0);

  const t2Points = liveEvents
    .filter((e) => e.team_id === activeMatch?.team2_id && e.event_type === "point")
    .reduce((sum, e) => sum + e.value, 0);

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground text-xs">Loading matches…</div>;
  }

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg">Match Centre &amp; Live Scoring</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {matches.length} fixtures
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs uppercase font-semibold">Tournament</TableHead>
                <TableHead className="text-xs uppercase font-semibold">Date</TableHead>
                <TableHead className="text-xs uppercase font-semibold">Match Fixture</TableHead>
                <TableHead className="text-xs uppercase font-semibold">Score</TableHead>
                <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                <TableHead className="text-right text-xs uppercase font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No matches found in records.
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((m) => {
                  const isScorer = m.recorded_by === viewerId;
                  return (
                    <TableRow key={m.id} className="text-xs hover:bg-muted/40">
                      <TableCell className="text-muted-foreground font-medium">
                        {m.tournament_name ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {m.scheduled_at
                          ? new Date(m.scheduled_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {m.team1_name} vs {m.team2_name}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {m.team1_score !== null
                          ? `${m.team1_score} – ${m.team2_score}`
                          : "—"}
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell className="space-x-1.5 text-right whitespace-nowrap">
                        {/* Role 4 Official actions */}
                        {(viewerRoleId === 4 || viewerRoleId === 1) && m.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => startMutation.mutate(m.id)}
                            disabled={startMutation.isPending}
                          >
                            <Play className="size-3" /> Start Match
                          </Button>
                        )}

                        {(viewerRoleId === 4 || viewerRoleId === 1) && m.status === "in_progress" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => openLiveConsole(m)}
                          >
                            <Play className="size-3" /> Live Console
                          </Button>
                        )}

                        {(viewerRoleId === 4 || viewerRoleId === 1) &&
                          (m.status === "scheduled" || m.status === "in_progress") && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => openScoreDialog(m)}
                            >
                              Finalize Score
                            </Button>
                          )}

                        {/* Certification (Role 1 or 2) */}
                        {(viewerRoleId === 1 || viewerRoleId === 2) && m.status === "completed" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs gap-1"
                            onClick={() => openCertDialog(m)}
                            disabled={isScorer}
                            title={isScorer ? "Separation of duties: Scorer cannot certify own match (INV-09)" : ""}
                          >
                            <CheckCircle2 className="size-3" /> Certify
                          </Button>
                        )}

                        {/* National Admin score correction */}
                        {viewerRoleId === 1 && m.status === "certified" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => openCorrectDialog(m)}
                          >
                            Correct Score
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Live Scoring Console Modal */}
        <Dialog open={liveConsoleOpen} onOpenChange={setLiveConsoleOpen}>
          <DialogContent className="border-border sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between font-serif">
                <span>Live Match Scoring Console</span>
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 animate-pulse text-[10px]">
                  LIVE ON FIELD
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Running Scoreboard */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/20 p-5 text-center">
                <div className="space-y-2">
                  <p className="font-serif font-bold text-sm truncate">{activeMatch?.team1_name}</p>
                  <p className="font-serif text-4xl font-bold tracking-tight text-primary">{t1Points}</p>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() =>
                      logEventMutation.mutate({
                        matchId: activeMatch!.id,
                        teamId: activeMatch!.team1_id,
                        eventType: "point",
                        value: 1,
                      })
                    }
                  >
                    <Plus className="size-3" /> Point (+1)
                  </Button>
                </div>

                <div className="space-y-2 border-l border-border/60 pl-4">
                  <p className="font-serif font-bold text-sm truncate">{activeMatch?.team2_name}</p>
                  <p className="font-serif text-4xl font-bold tracking-tight text-primary">{t2Points}</p>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() =>
                      logEventMutation.mutate({
                        matchId: activeMatch!.id,
                        teamId: activeMatch!.team2_id,
                        eventType: "point",
                        value: 1,
                      })
                    }
                  >
                    <Plus className="size-3" /> Point (+1)
                  </Button>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Logged Match Events ({liveEvents.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-lg border border-border p-2 text-xs">
                  {liveEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-xs">No events logged yet.</p>
                  ) : (
                    liveEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-muted/40 font-mono text-[11px]">
                        <span>{ev.team_name}: {ev.event_type.replace("_", " ").toUpperCase()}</span>
                        <span className="text-muted-foreground">+{ev.value} pt</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="secondary" size="sm" onClick={() => setLiveConsoleOpen(false)}>
                Close Console
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setLiveConsoleOpen(false);
                  if (activeMatch) {
                    setT1Score(String(t1Points));
                    setT2Score(String(t2Points));
                    setScoreOpen(true);
                  }
                }}
              >
                Proceed to Finalize Scoreline &rarr;
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Finalize Scorekeeper Dialog */}
        <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
          <DialogContent className="border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">
                Record Final Score: {activeMatch?.team1_name} vs {activeMatch?.team2_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{activeMatch?.team1_name} Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t1Score}
                    onChange={(e) => setT1Score(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{activeMatch?.team2_name} Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t2Score}
                    onChange={(e) => setT2Score(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Man of the Match — strictly filtered to active participating squad roster */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Award className="size-3.5 text-amber-500" />
                  Man of the Match (Participating Squad Roster)
                </Label>
                <Select value={momPlayer} onValueChange={setMomPlayer}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select accredited player (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {squads.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                        {p.player_name} ({p.team_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Match Summary / Official Notes</Label>
                <Textarea
                  value={scoreSummary}
                  onChange={(e) => setScoreSummary(e.target.value)}
                  placeholder="e.g. Excellent competitive fixture. Zero injuries recorded."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="secondary" size="sm" onClick={() => setScoreOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={submitScore}
                disabled={t1Score === "" || t2Score === "" || scoreMutation.isPending}
              >
                {scoreMutation.isPending ? "Submitting…" : "Record Final Result"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Certify Result Dialog */}
        <Dialog open={certOpen} onOpenChange={setCertOpen}>
          <DialogContent className="border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">
                Certify Match Result: {activeMatch?.team1_name} vs {activeMatch?.team2_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-foreground">Scoreline: {activeMatch?.team1_score} – {activeMatch?.team2_score}</p>
                <p className="text-muted-foreground mt-1">
                  Certifying this match will lock the scoreline, publish official results, and automatically recalculate group standings.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Certification Notes / Verification Statement (required)</Label>
                <Textarea
                  value={certReason}
                  onChange={(e) => setCertReason(e.target.value)}
                  placeholder="Official scoresheets reviewed and certified accurate."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCertOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={submitCertify}
                disabled={certReason.trim().length < 3 || certifyMutation.isPending}
              >
                {certifyMutation.isPending ? "Certifying…" : "Certify & Recalculate Standings"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Score Correction Dialog */}
        <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
          <DialogContent className="border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-destructive flex items-center gap-2">
                <ShieldAlert className="size-5" />
                Emergency Score Correction (National Admin)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{activeMatch?.team1_name} Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t1Score}
                    onChange={(e) => setT1Score(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">{activeMatch?.team2_name} Score</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t2Score}
                    onChange={(e) => setT2Score(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reason for Forensic Correction (required, min 5 characters)</Label>
                <Textarea
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="Mandatory justification for overturning certified match result…"
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCorrectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={submitCorrection}
                disabled={correctReason.trim().length < 5 || correctMutation.isPending}
              >
                {correctMutation.isPending ? "Correcting…" : "Apply Correction & Rehash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
