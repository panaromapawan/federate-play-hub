import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Calendar,
  Medal,
  CheckCircle2,
  MapPin,
  Radio,
  ExternalLink,
  Shield,
  Layers,
  Zap,
  Flame,
} from "lucide-react";

import { getPublicPortal, type PublicPortal } from "@/lib/federation.functions";
import { PublicNav } from "@/components/fed/PublicNav";
import { PublicFooter } from "@/components/fed/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/common/SEOHead";
import { SafeImage } from "@/components/common/SafeImage";

export const Route = createFileRoute("/competitions")({
  component: CompetitionsPage,
});

export function CompetitionsPage() {
  const [activeSport, setActiveSport] = useState<number>(1);

  const { data, isLoading } = useQuery<PublicPortal>({
    queryKey: ["publicPortal"],
    queryFn: () => getPublicPortal(),
  });

  const tournaments = data?.tournaments ?? [];
  const standings = data?.standings ?? [];
  const recaps = data?.recaps ?? [];
  const fixtures = data?.fixtures ?? [];

  const filteredStandings = standings.filter((s) => s.sport_id === activeSport);

  const historicalChampionships = [
    { year: "2025", title: "National Sepak Takraw Senior Regu Championship", champion: "Rajasthan State Regu", runnerUp: "Gujarat State Regu", venue: "Sawai Mansingh Stadium, Jaipur", sport: "Sepak Takraw" },
    { year: "2024", title: "Asmita Women's Sepak Takraw League", champion: "Rajasthan Strikers", runnerUp: "Haryana Spikers", venue: "Jodhpur Sports Complex", sport: "Sepak Takraw" },
    { year: "2024", title: "All-India Aatya Paatya National Trophy", champion: "Rajasthan Warriors Aatya Paatya", runnerUp: "Maharashtra Paatya Club", venue: "Sawai Mansingh Stadium, Jaipur", sport: "Aatya Paatya" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <SEOHead title="RSTA Tournaments & Standings | Sepak Takraw & Aatya Paatya" />
      <PublicNav />

      {/* Hero Header */}
      <section className="relative py-20 border-b border-border bg-background overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25">
          <SafeImage
            src="/assets/hero/stadium-arena.jpg"
            alt="RSTA Arena"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge className="bg-primary text-primary-foreground border-primary text-xs px-3 py-1 font-mono">
            RSTA TOURNAMENT ARENA & LIVE SCORECARD
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight uppercase">
            Championships & Live Standings
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            Official standings, certified match scorecards, and roll of honor for <strong>Sepak Takraw</strong> (Regu, Doubles, Team) and <strong>Aatya Paatya</strong> state tournaments.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Active Tournament Live Standings */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Trophy className="size-5 text-amber-400" /> State Championship Standings
              </h2>
              <p className="text-xs text-slate-400">
                Live calculated table under Zero-Trust Invariant INV-09.
              </p>
            </div>

            {/* Sport Filter */}
            <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveSport(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeSport === 1 ? "bg-emerald-600 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="size-3" /> Sepak Takraw
              </button>
              <button
                onClick={() => setActiveSport(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeSport === 2 ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="size-3" /> Aatya Paatya
              </button>
            </div>
          </div>

          <Card className="border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-slate-800 text-xs">
                    <TableHead className="w-16 text-center text-slate-400 font-bold">POS</TableHead>
                    <TableHead className="text-slate-400 font-bold">Squad Name</TableHead>
                    <TableHead className="text-center text-slate-400 font-bold">Played</TableHead>
                    <TableHead className="text-center text-slate-400 font-bold">Won</TableHead>
                    <TableHead className="text-center text-slate-400 font-bold">Lost</TableHead>
                    <TableHead className="text-center text-slate-400 font-bold">Tied</TableHead>
                    <TableHead className="text-center text-slate-400 font-bold">Diff</TableHead>
                    <TableHead className="text-center text-amber-400 font-black">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStandings.length > 0 ? (
                    filteredStandings.map((row, idx) => (
                      <TableRow key={`${row.tournament_id}-${row.team_name}`} className="border-slate-800 text-xs">
                        <TableCell className="text-center font-mono font-bold text-slate-300">
                          {idx === 0 && row.points > 0 ? "★ 1" : idx + 1}
                        </TableCell>
                        <TableCell className="font-bold text-white">{row.team_name}</TableCell>
                        <TableCell className="text-center font-mono text-slate-300">{row.played}</TableCell>
                        <TableCell className="text-center font-mono text-emerald-400 font-bold">{row.won}</TableCell>
                        <TableCell className="text-center font-mono text-rose-400">{row.lost}</TableCell>
                        <TableCell className="text-center font-mono text-slate-400">{row.tied}</TableCell>
                        <TableCell className="text-center font-mono text-slate-300">
                          {row.score_difference > 0 ? `+${row.score_difference}` : row.score_difference}
                        </TableCell>
                        <TableCell className="text-center font-mono font-black text-amber-400 text-sm">
                          {row.points}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-slate-500 text-xs">
                        No active standings records for this tournament pool.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

        {/* Historical Roll of Honor */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Medal className="size-5 text-amber-400" /> Historical Roll of Honor
            </h2>
            <p className="text-xs text-slate-400">
              State Championship titleholders across Sepak Takraw and Aatya Paatya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {historicalChampionships.map((champ) => (
              <Card key={champ.year + champ.title} className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono">
                    SEASON {champ.year}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800">
                    {champ.sport}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-white">{champ.title}</h3>
                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Champion:</span>
                    <span className="font-bold text-emerald-400">{champ.champion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Runner-Up:</span>
                    <span className="text-slate-200">{champ.runnerUp}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>{champ.venue}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
