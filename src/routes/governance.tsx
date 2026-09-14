import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  Scale,
  Lock,
  FileCheck,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Award,
  Users,
  Flag,
  FileText,
  Zap,
} from "lucide-react";

import { PublicNav } from "@/components/fed/PublicNav";
import { PublicFooter } from "@/components/fed/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/common/SEOHead";
import { SafeImage } from "@/components/common/SafeImage";

export const Route = createFileRoute("/governance")({
  component: GovernancePage,
});

export function GovernancePage() {
  const invariants = [
    { code: "INV-01", name: "Strict Jurisdictional Demarcation", desc: "District associations operate strictly within their geographic territory; state squads require RSTA executive sanction." },
    { code: "INV-02", name: "Geographic Scope Isolation", desc: "District administrators can only view and mutate athletes registered within their designated revenue district." },
    { code: "INV-03", name: "Unique Athlete Aadhaar Guard", desc: "Prevents duplicate player accounts and eliminates dual-district or dual-state participation." },
    { code: "INV-04", name: "Mandatory Medical Clearance", desc: "Athletes must submit certified medical fitness and dope-free affidavits before tournament roster inclusions." },
    { code: "INV-05", name: "Roster State Progression", desc: "Strict lifecycle progression (draft → submitted → approved → frozen). Frozen squads cannot be modified." },
    { code: "INV-06", name: "Tournament Roster Freeze", desc: "Only teams with immutable frozen rosters are eligible for tournament draw inclusion." },
    { code: "INV-07", name: "Accredited Match Scorers", desc: "Only ISTAF-certified Grade-A technical officials can record live fixture scores." },
    { code: "INV-08", name: "Dual Certification Quorum", desc: "Recorded match outcomes must be certified by the Technical Delegate and approved by RSTA leadership." },
    { code: "INV-09", name: "Immutable Certified Results", desc: "Direct database updates on certified results are forbidden. Corrections require presidential review." },
    { code: "INV-10", name: "Forensic Audit Logging", desc: "Every administrative action is immutably logged with timestamp, user ID, and invariant signature." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      <SEOHead title="RSTA Governance & Statutory Invariants | Rajasthan Sepak Takraw Association" />
      <PublicNav />

      {/* Header Banner */}
      <section className="relative py-20 border-b border-emerald-950/80 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25">
          <SafeImage
            src="/assets/hero/stadium-arena.jpg"
            alt="RSTA Arena"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-xs px-3 py-1 font-mono">
            STATUTORY COMPLIANCE & ZERO-TRUST FRAMEWORK
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            RSTA Governance & Regulations
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            The Rajasthan Sepak Takraw Association enforces transparent bylaws under the Sepaktakraw Federation of India (STFI), governing both high-flying Sepak Takraw and indigenous Aatya Paatya through automated database triggers.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Three Tier Architecture Section */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Building2 className="size-5 text-emerald-400" /> Three-Tier Jurisdictional Structure
            </h2>
            <p className="text-xs text-slate-400">
              Clear statutory demarcation connecting grassroots district talent to national championships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-amber-500/40 bg-slate-900/60 p-6 space-y-3">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">LEVEL 1 · NATIONAL APEX</Badge>
              <h3 className="font-bold text-lg text-white">Sepaktakraw Federation of India</h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>• Team India National Selections & ISTAF Liaison</li>
                <li>• National Championship Sanctioning</li>
                <li>• Referee & Coaching Accreditation Guidelines</li>
                <li>• National Anti-Doping (NADA) Compliance</li>
              </ul>
            </Card>

            <Card className="border-emerald-500/40 bg-slate-900/60 p-6 space-y-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">LEVEL 2 · STATE APEX</Badge>
              <h3 className="font-bold text-lg text-white">Rajasthan Sepak Takraw Association</h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>• Presided over by Shri T. K. Singh (NIS)</li>
                <li>• State Team Selections overseen by Jagdish Prajapat</li>
                <li>• Annual State Championships & Asmita League</li>
                <li>• Dual-Sport Administration: Sepak Takraw & Aatya Paatya</li>
              </ul>
            </Card>

            <Card className="border-blue-500/40 bg-slate-900/60 p-6 space-y-3">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">LEVEL 3 · GRASSROOTS</Badge>
              <h3 className="font-bold text-lg text-white">District Associations (33 Units)</h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>• Grassroots School Clinics & Scouting Trials</li>
                <li>• Athlete Photo & Document Verification</li>
                <li>• Local Club Registrations in Jaipur, Jodhpur, etc.</li>
                <li>• District Championship Teams Selection</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Zero Trust Invariants Section */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Lock className="size-5 text-emerald-400" /> Statutory Zero-Trust Regulatory Invariants
            </h2>
            <p className="text-xs text-slate-400">
              Enforced automatically by live MySQL forensic database triggers and procedures (INV-01 to INV-10).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {invariants.map((inv) => (
              <div key={inv.code} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3.5">
                <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-800 shrink-0 text-xs">
                  {inv.code}
                </Badge>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">{inv.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{inv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
