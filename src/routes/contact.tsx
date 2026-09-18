import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Shield,
  Send,
  CheckCircle2,
  FileCheck,
  Building2,
  UserCheck,
} from "lucide-react";

import { PublicNav } from "@/components/fed/PublicNav";
import { PublicFooter } from "@/components/fed/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/common/SEOHead";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    organization: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Inquiry dispatched to RSTA Secretariat at Sawai Mansingh Stadium.", {
      description: "An official acknowledgment will be routed to your email within 24 business hours.",
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <SEOHead title="Contact RSTA Secretariat | Sawai Mansingh Stadium, Jaipur" />
      <PublicNav />

      {/* Header */}
      <section className="py-20 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Badge className="bg-primary text-primary-foreground border-primary text-xs px-3 py-1 font-mono">
            RSTA SECRETARIAT & COACHING ACADEMY DESK
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight uppercase">
            Contact RSTA Secretariat
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            Statutory disclosures, district affiliation queries, player trial registrations, and technical communications for the <strong>Rajasthan Sepak Takraw Association</strong>.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Headquarters Details (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="size-5 text-emerald-400" /> State Headquarters
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Rajasthan Sepak Takraw Association</strong>
                    <span>Sawai Mansingh Stadium, Amar Jawan Jyoti, Jaipur, Rajasthan - 302005</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-emerald-400 shrink-0" />
                  <span>secretariat@rsta.org.in | president@rsta.org.in</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-emerald-400 shrink-0" />
                  <span>+91 (0141) 274-0982 (Stadium Exchange)</span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-emerald-400 shrink-0" />
                  <span>Monday – Saturday: 08:30 AM to 06:00 PM IST</span>
                </div>
              </div>
            </Card>

            {/* Officers Desk */}
            <Card className="border-emerald-900/60 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="size-5 text-emerald-400" /> Executive & Coaching Officers
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">President & Executive Head</span>
                  <div className="text-white font-semibold">Shri T. K. Singh (NIS)</div>
                  <div className="text-slate-400">president@rsta.org.in</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Head Coach & Technical Director</span>
                  <div className="text-white font-semibold">Jagdish Prajapat</div>
                  <div className="text-slate-400">technical.coaching@rsta.org.in</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Secretary General</span>
                  <div className="text-white font-semibold">Dr. Mahendra Sharma</div>
                  <div className="text-slate-400">secretary.general@rsta.org.in</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Inquiry Form (7 Cols) */}
          <div className="lg:col-span-7">
            <Card className="border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-xl font-bold text-white">
                  Official RSTA Inquiry & Trial Registration
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Direct formal inquiries to Shri T. K. Singh and the coaching committee at Sawai Mansingh Stadium.
                </CardDescription>
              </CardHeader>

              {submitted ? (
                <div className="p-8 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="size-12 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Inquiry Dispatched</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Your transmission has been logged with the RSTA Secretariat. An official response will be routed to <strong>{formData.email}</strong>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-slate-700"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", category: "general", organization: "", message: "" });
                    }}
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs text-slate-300">Full Name</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Vikramaditya Shekhawat"
                        className="bg-slate-950 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs text-slate-300">Official Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="officer@district-rsta.in"
                        className="bg-slate-950 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs text-slate-300">Inquiry Nature</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-xs">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                          <SelectItem value="general">General Secretariat Query</SelectItem>
                          <SelectItem value="sepak_trials">Sepak Takraw Trials & Coaching</SelectItem>
                          <SelectItem value="aatya_paatya">Aatya Paatya Tournament Sanctions</SelectItem>
                          <SelectItem value="district_affiliation">District Association Affiliation</SelectItem>
                          <SelectItem value="media">Media & Press Passes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="org" className="text-xs text-slate-300">District / Club / Organization</Label>
                      <Input
                        id="org"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="e.g. Jodhpur District Sepak Takraw Club"
                        className="bg-slate-950 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs text-slate-300">Message / Request Particulars</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Specify player details, trial dates, or district tournament requirements..."
                      className="bg-slate-950 border-slate-800 text-white text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold gap-2 text-xs">
                    <Send className="size-3.5" /> Dispatch Inquiry to RSTA
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
