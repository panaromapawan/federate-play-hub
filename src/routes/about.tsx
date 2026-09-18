import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  Trophy,
  Award,
  Users,
  CheckCircle2,
  Lock,
  Building2,
  FileCheck,
  Scale,
  Target,
  Flame,
  ArrowRight,
  Zap,
} from "lucide-react";

import { PublicNav, FederationCrest } from "@/components/fed/PublicNav";
import { PublicFooter } from "@/components/fed/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/common/SafeImage";
import { SEOHead } from "@/components/common/SEOHead";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

export function AboutPage() {
  const council = [
    {
      name: "Shri T. K. Singh",
      role: "President, RSTA",
      portfolio: "NIS Coach & STFI National Committee Member championing Asmita League and state circuits.",
      image: "/assets/leadership/tk-singh.webp",
    },
    {
      name: "Jagdish Prajapat",
      role: "Head Coach & Technical Director",
      portfolio: "Certified Head Coach training national Tekongs and Strikers in acrobatic roll-spikes and sunback kicks.",
      image: "/assets/leadership/jagdish-prajapat.jpg",
    },
    {
      name: "Dr. Mahendra Sharma",
      role: "Secretary General",
      portfolio: "Executive administrator coordinating 33 district associations, athlete welfare, and state tournaments.",
      image: "/assets/leadership/mahendra-sharma.jpg",
    },
    {
      name: "Col. B.S. Shekhawat",
      role: "Chairman, Technical Board",
      portfolio: "Oversees referee certifications, ISTAF net height standards, and video adjudication.",
      image: "/assets/leadership/bs-shekhawat.jpg",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <SEOHead title="About RSTA | Rajasthan Sepak Takraw Association" />
      <PublicNav />

      {/* Hero Banner */}
      <section className="relative py-20 border-b border-border bg-background overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <SafeImage
            src="/assets/hero/stadium-arena.jpg"
            alt="RSTA Arena"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge className="bg-primary text-primary-foreground border-primary text-xs px-3 py-1 font-mono">
            ORGANIZATIONAL CHARTER & DUAL-SPORT CONSTITUTION
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight uppercase">
            About Rajasthan Sepak Takraw Association
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            The Rajasthan Sepak Takraw Association (RSTA) is the apex state governing authority affiliated with the Sepaktakraw Federation of India (STFI) and recognized by the Rajasthan State Sports Council (RSSC). Presided over by <strong>Shri T. K. Singh</strong> (NIS), RSTA governs competitive <strong>Sepak Takraw</strong> and indigenous <strong>Aatya Paatya</strong> across all 33 districts of Rajasthan.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Mission & Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="size-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="size-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Sepak Takraw Mastery</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Developing elite Tekongs, Strikers, and Feeders through specialized roll-spike, sunback, and horse-kick conditioning overseen by Head Coach Jagdish Prajapat.
            </p>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="size-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="size-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Aatya Paatya Heritage</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standardizing court dimensions, trench refereeing, and tournament circuits for the traditional indigenous sport of Aatya Paatya across Rajasthan.
            </p>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="size-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Scale className="size-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Zero-Trust Integrity</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Forensic digital registry ensuring verified age documentation, immutable roster freezes, and certified match scoring under STFI standards.
            </p>
          </Card>
        </div>

        {/* Executive Council Section */}
        <section className="space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Official Leadership & Executive Council
            </h2>
            <p className="text-xs text-slate-400">
              Presided over by Shri T. K. Singh (NIS) with certified coaching direction by Jagdish Prajapat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {council.map((member) => (
              <Card key={member.name} className="border-slate-800 bg-slate-950 overflow-hidden shadow-lg group hover:border-emerald-600/50 transition-colors">
                <div className="h-56 overflow-hidden">
                  <SafeImage
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-bold text-sm text-white">{member.name}</h4>
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                    {member.role}
                  </Badge>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    {member.portfolio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Callout */}
        <div className="p-8 rounded-lg bg-secondary border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-black text-foreground">
              Sawai Mansingh Stadium Headquarters
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visit our state coaching secretariat at Sawai Mansingh Stadium, Jaipur. Access player verification clinics, coach accreditation schedules, and tournament bids.
            </p>
          </div>
          <Link to="/contact">
            <Button className="font-bold text-xs gap-2 shrink-0">
              Contact RSTA Secretariat <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
