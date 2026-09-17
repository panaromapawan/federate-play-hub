import { Link } from "@tanstack/react-router";
import {
  Shield,
  MapPin,
  Mail,
  Phone,
  FileCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  Award,
} from "lucide-react";
import { FederationCrest } from "./PublicNav";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/40 pt-16 pb-12 text-muted-foreground text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Federation Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <FederationCrest className="size-10" />
              <div>
                <h4 className="font-black text-sm text-foreground tracking-tight uppercase font-mono">
                  RAJASTHAN SEPAK TAKRAW ASSOCIATION
                </h4>
                <p className="text-[11px] text-primary font-semibold">
                  Apex State Governing Body for Sepak Takraw & Aatya Paatya
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              Affiliated with the Sepaktakraw Federation of India (STFI) and recognized by the Rajasthan State Sports Council (RSSC). Presided over by Shri T. K. Singh (NIS). Administering high-flying acrobatic roll-spikes, sunback kicks, and tactical Aatya Paatya across all 33 districts of Rajasthan.
            </p>

            <div className="space-y-1.5 pt-2 text-[11px] text-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span>Sawai Mansingh Stadium, Amar Jawan Jyoti, Jaipur, Rajasthan - 302005</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-primary shrink-0" />
                <span>secretariat@rsta.org.in | president@rsta.org.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-primary shrink-0" />
                <span>+91 (0141) 274-0982 (Secretariat Dispatch)</span>
              </div>
            </div>
          </div>

          {/* Col 3: Institutional Governance */}
          <div className="space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" /> Corporate Governance
            </h5>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  Organizational Charter & Mission
                </Link>
              </li>
              <li>
                <Link to="/governance" className="hover:text-primary transition-colors">
                  Executive Committee Directory
                </Link>
              </li>
              <li>
                <Link to="/governance" className="hover:text-primary transition-colors">
                  Three-Tier Jurisdiction Code
                </Link>
              </li>
              <li>
                <Link to="/governance" className="hover:text-primary transition-colors">
                  Election Bye-Laws & Tenure Rules
                </Link>
              </li>
              <li>
                <a href="/#states" className="hover:text-primary transition-colors">
                  Sanctioned State Affiliations
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Statutory Disclosures & Compliance */}
          <div className="space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <FileCheck className="size-3.5 text-primary" /> Statutory Disclosures
            </h5>
            <ul className="space-y-2">
              <li>
                <span className="hover:text-primary cursor-pointer transition-colors">
                  Anti-Doping Regulations (WADA / NADA)
                </span>
              </li>
              <li>
                <span className="hover:text-primary cursor-pointer transition-colors">
                  Athlete Safeguarding & POSH Code
                </span>
              </li>
              <li>
                <span className="hover:text-primary cursor-pointer transition-colors">
                  Right to Information (RTI) Transparency
                </span>
              </li>
              <li>
                <span className="hover:text-primary cursor-pointer transition-colors">
                  Disciplinary & Ethics Committee
                </span>
              </li>
              <li>
                <a href="/#rulebooks" className="hover:text-primary transition-colors">
                  Cryptographic Rulebook Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Portals & Accreditation */}
          <div className="space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Award className="size-3.5 text-primary" /> Official Portals
            </h5>
            <ul className="space-y-2">
              <li>
                <Link to="/auth" className="text-primary font-semibold hover:underline">
                  National & State Admin Portal →
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-primary font-semibold hover:underline">
                  Certified Match Official Console →
                </Link>
              </li>
              <li>
                <Link to="/competitions" className="hover:text-primary transition-colors">
                  National Tournaments & Results
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Grievance Redressal & Secretariat
                </Link>
              </li>
            </ul>

            <div className="pt-2">
              <div className="p-2.5 rounded bg-card border border-border text-[11px] text-primary flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span>Zero-Trust Forensic Ledgers Active (INV-01 to INV-10)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <p>© 2026 Rajasthan Sepak Takraw Association (RSTA). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors">Constitution</Link>
            <span>•</span>
            <Link to="/governance" className="hover:text-primary transition-colors">Integrity Charter</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Secretariat</Link>
            <span>•</span>
            <span className="text-primary font-mono">Affiliated to STFI & RSSC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
