import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Shield,
  Trophy,
  Lock,
  ChevronRight,
  Menu,
  X,
  Radio,
  FileText,
  Award,
  Users,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FederationCrest({ className = "size-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        {/* Outer Shield */}
        <path
          d="M50 5 L92 22 V65 C92 92 50 115 50 115 C50 115 8 92 8 65 V22 Z"
          fill="url(#shieldGrad)"
          stroke="url(#shieldBorder)"
          strokeWidth="3"
        />
        {/* Inner Border */}
        <path
          d="M50 12 L84 27 V63 C84 86 50 105 50 105 C50 105 16 86 16 63 V27 Z"
          fill="#06130d"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
          opacity="0.9"
        />
        {/* Central Heraldic Symbol: Golden Crown / Laurel */}
        <path
          d="M32 45 L50 28 L68 45 L62 72 H38 Z"
          fill="url(#goldGrad)"
          opacity="0.95"
        />
        {/* Central Star */}
        <polygon
          points="50,42 53,50 62,50 55,55 58,63 50,58 42,63 45,55 38,50 47,50"
          fill="#ffffff"
        />
        {/* Laurel Accent Base */}
        <path
          d="M36 82 C44 87 56 87 64 82"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Gradients */}
        <defs>
          <linearGradient id="shieldGrad" x1="50" y1="5" x2="50" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="50%" stopColor="#022c22" />
            <stop offset="100%" stopColor="#01140e" />
          </linearGradient>
          <linearGradient id="shieldBorder" x1="8" y1="5" x2="92" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="30" y1="28" x2="70" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Competitions", href: "/competitions" },
    { label: "Governance", href: "/governance" },
    { label: "Leadership", href: "/#leadership" },
    { label: "About RSTA", href: "/about" },
    { label: "Dispatches", href: "/#dispatches" },
    { label: "Rulebooks", href: "/#rulebooks" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/90 border-b border-emerald-950/60 shadow-2xl">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 border-b border-emerald-900/40 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[11px] shrink-0">
              <Radio className="size-3 text-emerald-400 animate-pulse" /> RSTA Official Dispatch:
            </span>
            <span className="text-slate-300 font-medium truncate text-[11px]">
              National Sepak Takraw Regu 2026: Rajasthan 61 - 56 Gujarat (Certified INV-09) • Presided by Shri T. K. Singh (NIS) · Head Coach Jagdish Prajapat
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto text-[11px]">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400">
              <Lock className="size-3 text-emerald-400" /> STFI & RSSC Sanctioned State Body
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Link
              to="/auth"
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Sign In to Portal <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAV HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand & Crest */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <FederationCrest className="size-11 sm:size-12 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white font-mono uppercase">
                  RSTA
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 hidden sm:inline-block">
                  Apex State Body · STFI
                </span>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-200 tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                Rajasthan Sepak Takraw Association
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden md:inline-block">
                Sepak Takraw & Aatya Paatya · Sawai Mansingh Stadium, Jaipur
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const className = `px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "text-emerald-400 bg-emerald-950/60 border border-emerald-800/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/80"
              }`;
              if (link.href.includes("#")) {
                return (
                  <a key={link.label} href={link.href} className={className}>
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.label}
                  to={link.href as any}
                  className={className}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/auth">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-900/40 text-xs px-4 border border-emerald-400/30 gap-1.5"
              >
                <Shield className="size-3.5 text-slate-950" /> Federation Portal
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950/95 border-b border-emerald-950 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const className = "block px-3 py-2.5 rounded-md text-sm font-medium text-slate-200 hover:text-emerald-400 hover:bg-slate-900";
              if (link.href.includes("#")) {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={className}
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.label}
                  to={link.href as any}
                  onClick={() => setMobileMenuOpen(false)}
                  className={className}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold gap-2 text-xs">
                <Shield className="size-4" /> Sign In to Federation Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
