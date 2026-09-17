import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Trophy,
  Calendar,
  Newspaper,
  FileText,
  Shield,
  ArrowRight,
  MapPin,
  Users,
  CheckCircle2,
  Lock,
  Medal,
  Download,
  Sparkles,
  Radio,
  Flame,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  FileCheck,
  ArrowUpRight,
  Building2,
  CheckCheck,
  AlertCircle,
  Flag,
  Globe2,
  Scale,
  Zap,
} from "lucide-react";

import { getPublicPortal, type PublicPortal } from "@/lib/federation.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PublicNav, FederationCrest } from "@/components/fed/PublicNav";
import { PublicFooter } from "@/components/fed/PublicFooter";
import { SafeImage } from "@/components/common/SafeImage";
import { SEOHead } from "@/components/common/SEOHead";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rajasthan Sepak Takraw Association | Official RSTA" },
      {
        name: "description",
        content: "Official RSTA portal for Sepak Takraw and Aatya Paatya results, fixtures, leadership, districts, circulars, and rulebooks.",
      },
      { property: "og:title", content: "Rajasthan Sepak Takraw Association" },
      {
        property: "og:description",
        content: "Official results, competitions, leadership, circulars, and rulebooks from Rajasthan's state federation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicPortalPage,
});

// Custom State/District Crest SVG
function RstaCrest({ code, name, color = "amber" }: { code: string; name: string; color?: "amber" | "emerald" | "blue" | "rose" | "purple" }) {
  const colorMap = {
    amber: "from-amber-600 to-amber-950 border-amber-500/60 text-amber-300",
    emerald: "from-emerald-600 to-emerald-950 border-emerald-500/60 text-emerald-300",
    blue: "from-blue-600 to-blue-950 border-blue-500/60 text-blue-300",
    rose: "from-rose-600 to-rose-950 border-rose-500/60 text-rose-300",
    purple: "from-purple-600 to-purple-950 border-purple-500/60 text-purple-300",
  };

  return (
    <div className={`size-12 rounded-md bg-gradient-to-b ${colorMap[color]} border flex flex-col items-center justify-center font-black shadow-sm shrink-0`}>
      <span className="text-[9px] tracking-wider opacity-80">RSTA</span>
      <span className="text-xs tracking-tight font-mono leading-none font-bold">{code}</span>
    </div>
  );
}

export function PublicPortalPage() {
  // Dual-Sport Selection: 1 = Sepak Takraw, 2 = Aatya Paatya
  const [activeSportId, setActiveSportId] = useState<number>(1);

  const { data, isLoading } = useQuery<PublicPortal>({
    queryKey: ["publicPortal"],
    queryFn: () => getPublicPortal(),
    refetchInterval: 30000,
  });

  const settings = data?.siteSettings;
  const leadership = data?.leadershipMembers && data.leadershipMembers.length > 0
    ? data.leadershipMembers
    : [
        {
          id: 1,
          name: "Shri T. K. Singh",
          designation: "President, RSTA",
          category: "executive" as const,
          photo_url: "/assets/leadership/tk-singh.webp",
          bio: "NIS-qualified expert and STFI National Committee Member driving Rajasthan state championship circuits and Asmita League development.",
          display_order: 1,
          is_active: true,
        },
        {
          id: 2,
          name: "Jagdish Prajapat",
          designation: "Head Coach & Technical Director",
          category: "coaching" as const,
          photo_url: "/assets/leadership/jagdish-prajapat.jpg",
          bio: "Certified coach training national-tier Tekongs and Strikers in acrobatic roll-spikes, sunback kicks, and tactical court positioning.",
          display_order: 2,
          is_active: true,
        },
        {
          id: 3,
          name: "Dr. Mahendra Sharma",
          designation: "Secretary General",
          category: "executive" as const,
          photo_url: "/assets/leadership/mahendra-sharma.jpg",
          bio: "Executive administrator coordinating inter-district tournaments and athlete welfare across 33 districts.",
          display_order: 3,
          is_active: true,
        },
        {
          id: 4,
          name: "Col. B.S. Shekhawat",
          designation: "Chairman, Technical Board",
          category: "technical" as const,
          photo_url: "/assets/leadership/bs-shekhawat.jpg",
          bio: "Oversees referee certifications, ISTAF net height standards, and video adjudication.",
          display_order: 4,
          is_active: true,
        },
      ];

  const tournaments = data?.tournaments ?? [];
  const standings = data?.standings ?? [];
  const fixtures = data?.fixtures ?? [];
  const recaps = data?.recaps ?? [];
  const notices = data?.notices ?? [];
  const documents = data?.documents ?? [];
  const news = data?.news ?? [];

  // Filter Standings by Selected Sport
  const filteredStandings = standings.filter((s) => s.sport_id === activeSportId);
  const activeTournament = tournaments.find((t) => t.sport_id === activeSportId);
  const activeRecap = recaps.find((r) => r.sport_id === activeSportId) ?? recaps[0] ?? {
    id: 1,
    team1_name: "Rajasthan State Sepak Takraw Regu",
    team2_name: "Gujarat State Sepak Takraw Regu",
    team1_score: 61,
    team2_score: 56,
    venue: "Sawai Mansingh Indoor Stadium",
    man_of_match: "Vikramaditya Shekhawat",
    scheduled_at: "2026-09-14 10:30:00",
    summary: "Winner: Rajasthan State Sepak Takraw Regu | MOM: Vikramaditya Shekhawat",
    sport_id: 1,
  };

  const heroNews = news[0] ?? {
    id: 1,
    title: "Rajasthan Sepak Takraw Squad Clinches 3-Set Thriller at Sawai Mansingh Stadium",
    content: "Under the tactical guidance of Head Coach Jagdish Prajapat and President Shri T. K. Singh, Rajasthan State Regu edged out defending champions Gujarat 2-1. Vikramaditya Shekhawat executed 14 unreturnable bicycle spikes to seal the victory.",
    image_url: "/assets/news/gold-medal.jpg",
    category_tag: "State Championship",
    read_time_min: 4,
  };

  const districtsShowcase = [
    { code: "JPR", name: "Jaipur District Association", units: 14, status: "Affiliated & Certified" },
    { code: "JDH", name: "Jodhpur District Committee", units: 12, status: "Affiliated & Certified" },
    { code: "UDP", name: "Udaipur Sports Council", units: 10, status: "Affiliated & Certified" },
    { code: "BKR", name: "Bikaner Sepak Takraw Unit", units: 8, status: "Affiliated & Certified" },
    { code: "AJM", name: "Ajmer District Board", units: 9, status: "Affiliated & Certified" },
    { code: "KTA", name: "Kota Championship Association", units: 11, status: "Affiliated & Certified" },
  ];

  return (
    <div className="public-home-light min-h-screen flex flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <SEOHead />
      <PublicNav />

      {/* 1. HERO BROADCAST STAGE */}
      <section className="home-hero relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0 z-0">
          <SafeImage
            src={settings?.hero_bg_image || "/assets/hero/stadium-arena.jpg"}
            alt="Sepak Takraw Championship Arena"
            className="w-full h-full object-cover object-center opacity-100 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.2),rgba(0,0,0,0.35))]" />
        </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6 animate-editorial-rise">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700/60 font-semibold px-3 py-1 text-xs gap-1.5 shadow-sm">
                  <FederationCrest className="size-3.5" />
                  {settings?.hero_badge || "Affiliated with Sepaktakraw Federation of India (STFI) & RSSC"}
                </Badge>
                <Badge variant="outline" className="text-amber-300 border-amber-700/60 text-xs px-3 py-1">
                  Dual-Sport Authority: Sepak Takraw & Aatya Paatya
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.08] font-display">
                  {settings?.hero_title ? (
                    <>
                      <span>{settings.hero_title}</span>
                    </>
                  ) : (
                    <>
                      Rajasthan Sepak Takraw <br />
                      <span className="text-primary">Association (RSTA)</span>
                    </>
                  )}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal">
                  {settings?.hero_subtitle ||
                    "Presided over by Shri T. K. Singh (NIS). Administering high-flying acrobatic roll-spikes and indigenous Aatya Paatya court disciplines across all 33 districts of Rajasthan."}
                </p>
              </div>

              {/* Stat Ticker */}
              <div className="grid grid-cols-3 gap-3 py-4 border border-border bg-card shadow-sm rounded-md px-5">
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">33</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Districts Affiliated</div>
                </div>
                <div className="space-y-0.5 border-x border-slate-800 px-3 sm:px-4">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">1,250+</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Registered Players</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">100%</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Forensic Roster Audit</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/auth">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-6 gap-2 text-sm shadow-xl shadow-emerald-950 border border-emerald-400/40">
                    <Shield className="size-4" /> {settings?.hero_cta_primary_text || "Official Federation Portal"}
                  </Button>
                </Link>
                <Link to="/competitions">
                  <Button size="lg" variant="outline" className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-bold gap-2">
                    <Trophy className="size-4 text-amber-400" /> State Championship Arena
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Featured Hero Dispatch Card */}
            <div className="lg:col-span-5 animate-editorial-rise animation-delay-150">
              <Card className="overflow-hidden border-emerald-900/50 bg-slate-900/90 shadow-2xl backdrop-blur group">
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <SafeImage
                    src={heroNews.image_url || "/assets/news/gold-medal.jpg"}
                    alt="RSTA Match Action"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      ★ LEAD DISPATCH
                    </Badge>
                    <Badge className="bg-slate-950/80 text-white text-[10px] backdrop-blur border-slate-700">
                      {heroNews.category_tag || "State Championship"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Radio className="size-3 animate-ping" /> CERTIFIED SCORELINE
                    </span>
                    <span>Sawai Mansingh Stadium</span>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <h3 className="font-black text-lg sm:text-xl text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    {heroNews.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {heroNews.content}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {heroNews.read_time_min || 4} MIN READ · RSTA PRESS DESK
                    </span>
                    <a href="#dispatches" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                      Read Details <ArrowRight className="size-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL-SPORT SELECTION TOGGLE & CHAMPIONSHIP ARENA */}
      <section id="standings" className="py-16 bg-slate-950 border-b border-emerald-950/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header & Dual-Sport Selector */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-1">
                <Trophy className="size-4" /> Dual-Sport State Championship Arena
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Live Standings & Match Certification
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Switch between Olympic discipline <strong>Sepak Takraw</strong> and traditional indigenous <strong>Aatya Paatya</strong>.
              </p>
            </div>

            {/* Sport Selector Pill Buttons */}
            <div className="flex items-center p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              <button
                onClick={() => setActiveSportId(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeSportId === 1
                    ? "bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="size-3.5" /> Sepak Takraw (Regu)
              </button>
              <button
                onClick={() => setActiveSportId(2)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeSportId === 2
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="size-3.5" /> Aatya Paatya (Court)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Standings Table (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-emerald-950/90 bg-slate-900/70 backdrop-blur shadow-xl overflow-hidden">
                <CardHeader className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Medal className="size-4 text-amber-400" />
                      {activeSportId === 1
                        ? "National Sepak Takraw Regu Championship 2026"
                        : "All-India Aatya Paatya National Trophy 2026"}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {activeSportId === 1
                        ? "Men's Regu & Doubles Division · Pool A"
                        : "Senior Trench Evasion Championship · Pool 1"}
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 text-[10px]">
                    LIVE AUDIT
                  </Badge>
                </CardHeader>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/60">
                      <TableRow className="border-slate-800 text-xs">
                        <TableHead className="w-12 text-center text-slate-400 font-bold">#</TableHead>
                        <TableHead className="text-slate-400 font-bold">Squad / Association</TableHead>
                        <TableHead className="text-center text-slate-400 font-bold">P</TableHead>
                        <TableHead className="text-center text-slate-400 font-bold">W</TableHead>
                        <TableHead className="text-center text-slate-400 font-bold">L</TableHead>
                        <TableHead className="text-center text-slate-400 font-bold">T</TableHead>
                        <TableHead className="text-center text-slate-400 font-bold">Diff</TableHead>
                        <TableHead className="text-center text-amber-400 font-black">PTS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStandings.length > 0 ? (
                        filteredStandings.map((row, idx) => {
                          const isLeader = idx === 0 && row.points > 0;
                          return (
                            <TableRow
                              key={`${row.tournament_id}-${row.team_name}`}
                              className={`border-slate-800 text-xs transition-colors ${
                                isLeader ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-slate-800/40"
                              }`}
                            >
                              <TableCell className="text-center font-mono font-bold text-slate-300">
                                {isLeader ? (
                                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs">
                                    1
                                  </span>
                                ) : (
                                  idx + 1
                                )}
                              </TableCell>
                              <TableCell className="font-semibold text-white flex items-center gap-2.5">
                                <RstaCrest
                                  code={(row.team_name ?? "").includes("Rajasthan") ? "RJ" : "GJ"}
                                  name={row.team_name ?? "Contingent"}
                                  color={(row.team_name ?? "").includes("Rajasthan") ? "amber" : "emerald"}
                                />
                                <div>
                                  <div className="font-bold">{row.team_name}</div>
                                  {isLeader && (
                                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                                      ★ Pool Leader · Qualified
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono text-slate-300">{row.played}</TableCell>
                              <TableCell className="text-center font-mono text-emerald-400 font-bold">{row.won}</TableCell>
                              <TableCell className="text-center font-mono text-rose-400">{row.lost}</TableCell>
                              <TableCell className="text-center font-mono text-slate-400">{row.tied}</TableCell>
                              <TableCell className="text-center font-mono font-bold text-slate-300">
                                {row.score_difference > 0 ? `+${row.score_difference}` : row.score_difference}
                              </TableCell>
                              <TableCell className="text-center font-mono font-black text-amber-400 text-sm">
                                {row.points}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-slate-500 text-xs">
                            Standings calculations in progress for this tournament.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right: Certified Match Showcase Card (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-border bg-card shadow-md overflow-hidden relative">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 size-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                <CardHeader className="p-4 bg-secondary border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      OFFICIAL CERTIFIED SCORECARD
                    </span>
                  </div>
                  <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2">
                    INV-09 CERTIFIED
                  </Badge>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Scoreboard Arena */}
                  <div className="grid grid-cols-7 items-center gap-2 text-center py-4 bg-secondary/60 rounded-md border border-border">
                    {/* Team 1 */}
                    <div className="col-span-3 flex flex-col items-center space-y-2">
                      <RstaCrest code="RJ" name="Rajasthan" color="amber" />
                      <span className="font-black text-xs sm:text-sm text-white">Rajasthan</span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">WINNER</span>
                    </div>

                    {/* Score Display */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 font-mono font-black text-2xl sm:text-3xl text-white">
                        <span>{activeRecap.team1_score}</span>
                        <span className="text-slate-600">-</span>
                        <span>{activeRecap.team2_score}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase mt-1">FINAL</span>
                    </div>

                    {/* Team 2 */}
                    <div className="col-span-3 flex flex-col items-center space-y-2">
                      <RstaCrest code="GJ" name="Gujarat" color="emerald" />
                      <span className="font-black text-xs sm:text-sm text-white">Gujarat</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RUNNER-UP</span>
                    </div>
                  </div>

                  {/* Match Metadata Badges */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-emerald-400" /> Venue:
                      </span>
                      <span className="font-semibold text-slate-200">{activeRecap.venue}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="size-3.5 text-amber-400" /> Man of the Match:
                      </span>
                      <span className="font-bold text-amber-300">
                        {activeRecap.man_of_match ?? "Vikramaditya Shekhawat"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCheck className="size-3.5 text-emerald-400" /> Head Coach & Technical Desk:
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                        Jagdish Prajapat & Col. B.S. Shekhawat
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-secondary/70 border border-border text-[11px] text-foreground leading-relaxed flex items-start gap-2">
                    <Lock className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cryptographic Invariant INV-09:</strong> This match scorecard has been verified by the National Scorer and dual-certified by RSTA President Shri T. K. Singh.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VERIFIED LEADERSHIP & GOVERNANCE REGISTRY */}
      <section id="leadership" className="py-16 bg-slate-900/40 border-b border-emerald-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Building2 className="size-3.5" /> Official RSTA Leadership
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Executive Council & Technical Directors
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Presided over by <strong>Shri T. K. Singh</strong> (NIS) and Technical Director <strong>Jagdish Prajapat</strong>, leading the state governing body under STFI regulations.
            </p>
          </div>

          {/* 4 Leadership Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((exec) => {
              const isPresident = exec.name.includes("T. K. Singh");
              const isHeadCoach = exec.name.includes("Jagdish Prajapat");

              return (
                <Card
                  key={exec.id || exec.name}
                  className={`overflow-hidden transition-all duration-300 relative group flex flex-col justify-between ${
                    isPresident
                      ? "border-accent/60 bg-card shadow-md ring-1 ring-accent/25"
                      : isHeadCoach
                      ? "border-primary/40 bg-card shadow-md"
                      : "border-border bg-card hover:border-primary/40 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="relative h-64 overflow-hidden bg-slate-900">
                      <SafeImage
                        src={exec.photo_url}
                        alt={exec.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                      
                      {/* Top Prestige Tag */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        {isPresident ? (
                          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                            <Sparkles className="size-3 text-slate-950" /> PRESIDENTIAL DESK
                          </Badge>
                        ) : isHeadCoach ? (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                            <Flame className="size-3 text-slate-950" /> TECHNICAL DIRECTORATE
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-mono backdrop-blur">
                            {exec.category.toUpperCase()}
                          </Badge>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800">
                          RSTA #{exec.display_order}
                        </span>
                      </div>

                      {/* Bottom Badge */}
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <Badge
                          className={`text-[10px] font-bold ${
                            isPresident
                              ? "bg-amber-400/20 text-amber-300 border-amber-500/40"
                              : isHeadCoach
                              ? "bg-emerald-400/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-900/90 text-slate-300 border-slate-700"
                          }`}
                        >
                          {exec.designation}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-base text-white group-hover:text-emerald-300 transition-colors">
                          {exec.name}
                        </h4>
                        {isPresident && <span className="text-amber-400 text-xs font-bold">NIS Coach</span>}
                        {isHeadCoach && <span className="text-emerald-400 text-xs font-bold">Head Coach</span>}
                      </div>
                      <p className="text-xs font-semibold text-amber-300/90">{exec.designation}</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-4">{exec.bio}</p>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>VERIFIED PROFILE</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> ACTIVE
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Three-Tier Architecture Callout */}
          <div className="p-6 sm:p-8 rounded-md bg-card border border-border shadow-sm space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Scale className="size-5 text-emerald-400" /> Three-Tier Jurisdictional Framework
              </h3>
              <p className="text-xs text-slate-400">
                Coordinated governance aligning national standards, state championship selections, and grassroots district trials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-md bg-secondary/50 border border-border space-y-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono">
                  LEVEL 1: NATIONAL APEX
                </Badge>
                <h4 className="font-bold text-base text-white">Sepaktakraw Federation of India (STFI)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  National governing authority representing India at ISTAF and the Asian Sepaktakraw Federation (ASTAF).
                </p>
              </div>

              <div className="p-5 rounded-md bg-secondary/50 border border-border space-y-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono">
                  LEVEL 2: STATE APEX
                </Badge>
                <h4 className="font-bold text-base text-white">Rajasthan Sepak Takraw Association (RSTA)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Governing Sepak Takraw and Aatya Paatya across Rajasthan. Presided by Shri T. K. Singh (NIS).
                </p>
              </div>

              <div className="p-5 rounded-md bg-secondary/50 border border-border space-y-2">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-mono">
                  LEVEL 3: GRASSROOTS
                </Badge>
                <h4 className="font-bold text-base text-white">District Units (33 Districts)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  33 district committees conducting school clinics, player registrations, and regional selection trials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SANCTIONED DISTRICT ASSOCIATIONS */}
      <section id="districts" className="py-16 bg-slate-950 border-b border-emerald-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-1">
                <Globe2 className="size-4" /> Rajasthan Statewide Presence
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sanctioned District Associations
              </h2>
              <p className="text-xs text-slate-400">
                Official recognized constituent bodies conducting accredited trials under RSTA coaching directives.
              </p>
            </div>

            <Link to="/about">
              <Button size="sm" variant="outline" className="border-slate-700 text-xs font-bold gap-1 text-slate-200">
                District Affiliation Rules <ChevronRight className="size-3" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {districtsShowcase.map((st) => (
              <Card key={st.code} className="border-slate-800 bg-slate-900/60 hover:border-emerald-600/50 transition-colors">
                <CardContent className="p-5 flex items-center gap-4">
                  <RstaCrest code={st.code} name={st.name} color="amber" />
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{st.name}</h4>
                    <p className="text-xs text-slate-400">{st.units} Registered Clubs & Academies</p>
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800/80 bg-emerald-950/40 font-mono">
                      {st.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEDERATION DISPATCH (News Grid - 3 Columns with SafeImage) */}
      <section id="dispatches" className="py-16 bg-slate-900/30 border-b border-emerald-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-1">
              <Newspaper className="size-4" /> Official Press & Dispatches
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              RSTA Dispatches & Media Releases
            </h2>
            <p className="text-xs text-slate-400">
              Verified coverage of Sepak Takraw championships, Aatya Paatya expansions, and coaching clinics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <Card key={item.id} className="border-slate-800 bg-slate-950 overflow-hidden shadow-lg group hover:border-emerald-600/50 transition-all flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <SafeImage
                    src={item.image_url || "/assets/news/gold-medal.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge className="bg-emerald-600 text-slate-950 font-bold text-[10px]">
                      {item.category_tag || "RSTA OFFICIAL"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.read_time_min || 3} MIN READ · {item.author_name || "RSTA PRESS CELL"}
                    </span>
                    <h4 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>Verified Communique</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. DOCUMENT ARCHIVE & DIRECTIVES */}
      <section id="rulebooks" className="py-16 bg-slate-950 border-b border-emerald-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-1">
              <FileCheck className="size-4" /> Authoritative Repository
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Official Circulars & Technical Rulebooks
            </h2>
            <p className="text-xs text-slate-400">
              ISTAF certified Sepak Takraw scoring codes and Aatya Paatya court layout directives.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Circulars */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="size-4 text-amber-400" /> Active Circulars & Directives
                </h3>
                <Badge variant="outline" className="text-[10px] text-slate-400">
                  {notices.length} DIRECTIVES
                </Badge>
              </div>

              <div className="space-y-3">
                {notices.map((notice, idx) => (
                  <Card key={notice.id} className="border-slate-800 bg-slate-900/60 hover:border-emerald-600/40 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                            {notice.target_level ? notice.target_level.toUpperCase() : "PUBLIC"}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">
                            REF: RSTA-2026-00{notice.id}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-white leading-snug">{notice.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{notice.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right: Technical Rulebooks */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="size-4 text-emerald-400" /> Cryptographic Rulebooks
                </h3>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800">
                  SHA-256 VALIDATED
                </Badge>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="border-slate-800 bg-slate-900/60 hover:border-emerald-600/40 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-slate-800 text-amber-300">
                            CODE {doc.version ?? "v2.0"}
                          </Badge>
                          <h4 className="font-bold text-sm text-white mt-1 leading-snug">{doc.title}</h4>
                        </div>
                      </div>

                      {doc.checksum_sha && (
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                            Cryptographic SHA-256 Digest:
                          </span>
                          <code className="text-[10px] font-mono text-emerald-300 block truncate" title={doc.checksum_sha}>
                            {doc.checksum_sha}
                          </code>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-400" /> Statutory Version
                        </span>
                        <a
                          href={doc.file_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                        >
                          Download PDF <Download className="size-3.5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
