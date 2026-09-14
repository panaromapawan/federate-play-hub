import fs from "fs";
import path from "path";

// 1. Instant Fallback SVG
const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329"/>
      <stop offset="50%" stop-color="#040711"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="url(#bgGrad)"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  <circle cx="400" cy="250" r="140" fill="none" stroke="rgba(16,185,129,0.15)" stroke-width="2"/>
  <circle cx="400" cy="250" r="100" fill="rgba(16,185,129,0.08)"/>
  <g transform="translate(360, 210) scale(0.8)">
    <path d="M50 0 L93 25 L93 75 L50 100 L7 75 L7 25 Z" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
    <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="50" cy="50" r="12" fill="#10b981"/>
  </g>
  <text x="400" y="390" text-anchor="middle" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" letter-spacing="3">RAJASTHAN SEPAK TAKRAW ASSOCIATION</text>
  <text x="400" y="420" text-anchor="middle" fill="#10b981" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" letter-spacing="2">OFFICIAL FEDERATION MEDIA ASSET</text>
  <text x="400" y="450" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="11">Sawai Mansingh Stadium • Jaipur</text>
</svg>`;

// 2. Hero Background SVG
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <radialGradient id="stadiumLights" cx="50%" cy="10%" r="70%">
      <stop offset="0%" stop-color="#065f46" stop-opacity="0.4"/>
      <stop offset="40%" stop-color="#022c22" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
    </radialGradient>
    <linearGradient id="beamL" x1="0%" y1="0%" x2="60%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="beamR" x1="100%" y1="0%" x2="40%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="0"/>
    </linearGradient>
    <pattern id="stadiumCourtGrid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(52,211,153,0.05)" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect width="1920" height="1080" fill="#030712"/>
  <rect width="1920" height="1080" fill="url(#stadiumLights)"/>
  <polygon points="100,0 800,1080 0,1080" fill="url(#beamL)"/>
  <polygon points="1820,0 1120,1080 1920,1080" fill="url(#beamR)"/>
  <g transform="perspective(600) rotateX(45) translate(0, 400)">
    <rect x="200" y="200" width="1520" height="600" fill="none" stroke="rgba(52,211,153,0.2)" stroke-width="3"/>
    <line x1="960" y1="200" x2="960" y2="800" stroke="#f59e0b" stroke-width="4" stroke-dasharray="10,10"/>
    <circle cx="960" cy="500" r="140" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="3"/>
    <rect x="200" y="200" width="1520" height="600" fill="url(#stadiumCourtGrid)"/>
  </g>
  <circle cx="960" cy="380" r="300" fill="none" stroke="rgba(16,185,129,0.06)" stroke-width="60"/>
  <circle cx="960" cy="380" r="200" fill="none" stroke="rgba(245,158,11,0.08)" stroke-width="2"/>
</svg>`;

// Helper for Leadership Portraits
function createLeadershipSvg(name, role, badge, tag, color = "#10b981", accent = "#f59e0b") {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${color}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="750" fill="url(#bg)"/>
  <rect width="600" height="750" fill="url(#glow)"/>
  
  <!-- Outer Frame -->
  <rect x="30" y="30" width="540" height="690" rx="16" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="670" rx="12" fill="none" stroke="${color}" stroke-opacity="0.25" stroke-width="1"/>
  
  <!-- Top Badge Ribbon -->
  <g transform="translate(60, 60)">
    <rect width="160" height="28" rx="6" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1"/>
    <text x="80" y="18" text-anchor="middle" fill="${color}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">${tag}</text>
  </g>

  <!-- Central Silhouette and Crest -->
  <g transform="translate(300, 260)">
    <!-- Aura rings -->
    <circle cx="0" cy="0" r="140" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>
    <circle cx="0" cy="0" r="120" fill="rgba(16,185,129,0.06)" stroke="${color}" stroke-opacity="0.4" stroke-width="2"/>
    
    <!-- Executive Profile Silhouette -->
    <circle cx="0" cy="-25" r="46" fill="#1e293b" stroke="${color}" stroke-width="2"/>
    <path d="M-65 70 C-65 20, 65 20, 65 70 Z" fill="#1e293b" stroke="${color}" stroke-width="2"/>
    <polygon points="0,25 -14,60 14,60" fill="${accent}"/>

    <!-- Monogram Overlay -->
    <text x="0" y="-14" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" letter-spacing="2">${initials}</text>
  </g>

  <!-- Bottom Details Panel -->
  <g transform="translate(300, 500)">
    <rect x="-240" y="0" width="480" height="180" rx="12" fill="rgba(2,6,23,0.85)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    
    <!-- Gold Trim Indicator -->
    <line x1="-200" y1="12" x2="200" y2="12" stroke="url(#accentGrad)" stroke-width="3" stroke-linecap="round"/>
    
    <!-- Name -->
    <text x="0" y="52" text-anchor="middle" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="25" font-weight="800">${name}</text>
    
    <!-- Role -->
    <text x="0" y="84" text-anchor="middle" fill="${accent}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" letter-spacing="1">${role.replace(/&/g, "&amp;")}</text>
    
    <!-- Accreditations -->
    <text x="0" y="118" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500">${badge.replace(/&/g, "&amp;")}</text>
    <text x="0" y="142" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" letter-spacing="1.5">RAJASTHAN SEPAK TAKRAW ASSOCIATION</text>
  </g>
</svg>`;
}

// Helper for News Feature Graphics
function createNewsSvg(headline, category, date, accentColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="100%" height="100%">
  <defs>
    <linearGradient id="newsBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <radialGradient id="radialAccent" cx="80%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <pattern id="courtPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="675" fill="url(#newsBg)"/>
  <rect width="1200" height="675" fill="url(#radialAccent)"/>
  <rect width="1200" height="675" fill="url(#courtPattern)"/>
  
  <!-- Geometric Sports Accents -->
  <g transform="translate(850, 320)">
    <circle cx="0" cy="0" r="180" fill="none" stroke="${accentColor}" stroke-opacity="0.15" stroke-width="2"/>
    <circle cx="0" cy="0" r="130" fill="none" stroke="${accentColor}" stroke-opacity="0.3" stroke-width="4" stroke-dasharray="15,10"/>
    
    <!-- Sport Motif -->
    <polygon points="0,-80 70,40 -70,40" fill="none" stroke="${accentColor}" stroke-width="5"/>
    <circle cx="0" cy="0" r="35" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="2"/>
    <text x="0" y="10" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="900">RSTA</text>
  </g>

  <!-- Content Overlay -->
  <g transform="translate(80, 140)">
    <!-- Category Badge -->
    <rect width="190" height="34" rx="8" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="1.5"/>
    <text x="95" y="22" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="1.5">${category}</text>
    
    <!-- Headline -->
    <text x="0" y="110" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-1">
      <tspan x="0" dy="0">${headline.split("—")[0] || headline}</tspan>
      ${headline.split("—")[1] ? `<tspan x="0" dy="55" fill="${accentColor}">${headline.split("—")[1]}</tspan>` : ""}
    </text>

    <!-- Sub-info -->
    <g transform="translate(0, 260)">
      <circle cx="8" cy="8" r="6" fill="${accentColor}"/>
      <text x="26" y="12" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="600">${date} • Sawai Mansingh Stadium, Jaipur</text>
      <text x="0" y="50" fill="#64748b" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="2">RAJASTHAN SEPAK TAKRAW ASSOCIATION OFFICIAL DISPATCH</text>
    </g>
  </g>
</svg>`;
}

// Helper for Player Badges
function createPlayerSvg(name, position, jersey, color = "#10b981") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="pBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#pBg)"/>
  <circle cx="200" cy="160" r="80" fill="rgba(16,185,129,0.1)" stroke="${color}" stroke-width="2"/>
  <circle cx="200" cy="140" r="45" fill="#1e293b" stroke="${color}" stroke-width="2"/>
  <path d="M140 230 C140 185, 260 185, 260 230 Z" fill="#1e293b" stroke="${color}" stroke-width="2"/>
  <circle cx="200" cy="140" r="22" fill="${color}" fill-opacity="0.2"/>
  <text x="200" y="148" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="800">#${jersey}</text>
  <text x="200" y="290" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">${name}</text>
  <text x="200" y="320" text-anchor="middle" fill="${color}" font-family="system-ui, sans-serif" font-size="13" font-weight="600">${position}</text>
  <text x="200" y="350" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">RAJASTHAN SEPAK TAKRAW</text>
</svg>`;
}

// Write files
const files = [
  // Fallbacks & Hero
  { path: "public/assets/defaults/fallback.svg", content: fallbackSvg },
  { path: "public/assets/hero/stadium-court.svg", content: heroSvg },

  // Leadership
  {
    path: "public/assets/leadership/tk-singh.svg",
    content: createLeadershipSvg("Shri T. K. Singh", "President, RSTA", "NIS-Qualified Coach • STFI Technical Member", "EXECUTIVE BOARD", "#10b981", "#f59e0b")
  },
  {
    path: "public/assets/leadership/jagdish-prajapat.svg",
    content: createLeadershipSvg("Jagdish Prajapat", "Head Coach & Technical Director", "State High-Performance Architect • Chief Trainer", "COACHING BOARD", "#3b82f6", "#10b981")
  },
  {
    path: "public/assets/leadership/mahendra-sharma.svg",
    content: createLeadershipSvg("Dr. Mahendra Sharma", "Secretary General", "Inter-District Scheduling & Governance", "EXECUTIVE BOARD", "#10b981", "#38bdf8")
  },
  {
    path: "public/assets/leadership/bs-shekhawat.svg",
    content: createLeadershipSvg("Col. B.S. Shekhawat", "Chairman, Technical Board", "Referee Standards & Zero-Trust Certification", "TECHNICAL BOARD", "#f59e0b", "#ef4444")
  },

  // News
  {
    path: "public/assets/news/gold-medal.svg",
    content: createNewsSvg("Historic National Gold — Rajasthan Sepak Takraw Regu", "CHAMPIONSHIP VICTORY", "2026-03-12", "#f59e0b")
  },
  {
    path: "public/assets/news/aatya-paatya.svg",
    content: createNewsSvg("State Mahakumbh 2026 — Dual-Sport Sanction Circuit", "AATYA PAATYA INITIATIVE", "2026-03-08", "#10b981")
  },
  {
    path: "public/assets/news/istaf-referee.svg",
    content: createNewsSvg("Technical Officials Camp — ISTAF Certification SMS Stadium", "OFFICIALS CERTIFICATION", "2026-03-01", "#3b82f6")
  },

  // Players
  { path: "public/assets/players/devendra-rathore.svg", content: createPlayerSvg("Devendra Singh Rathore", "Tekong (Server)", 7, "#10b981") },
  { path: "public/assets/players/vikramaditya-shekhawat.svg", content: createPlayerSvg("Vikramaditya Shekhawat", "Striker (Killer)", 10, "#f59e0b") },
  { path: "public/assets/players/pratik-patel.svg", content: createPlayerSvg("Pratik Patel", "Feeder (Setter)", 5, "#3b82f6") },
  { path: "public/assets/players/harshvardhan-vaghela.svg", content: createPlayerSvg("Harshvardhan Vaghela", "Tekong (Server)", 9, "#10b981") },
  { path: "public/assets/players/kuldeep-bishnoi.svg", content: createPlayerSvg("Kuldeep Bishnoi", "Lonav Leader", 1, "#ec4899") },
  { path: "public/assets/players/manish-choudhary.svg", content: createPlayerSvg("Manish Choudhary", "Sur-Pati Guard", 4, "#8b5cf6") }
];

files.forEach(f => {
  const fullPath = path.resolve(f.path);
  fs.writeFileSync(fullPath, f.content, "utf8");
  console.log(`Wrote: ${f.path} (${Buffer.byteLength(f.content)} bytes)`);
});
console.log("All local assets successfully generated!");
