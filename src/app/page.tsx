import Link from "next/link";
import { MapPin, Navigation, Compass, ArrowUpRight, Building2, Route, Map } from "lucide-react";

interface Campus {
  id: string;
  name: string;
  state: string;
  region: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  buildingCount?: number;
  established?: string;
}

async function getCampuses(): Promise<Campus[]> {
  return [
    {
      id: "shah-alam",
      name: "Shah Alam",
      state: "Selangor",
      region: "Central",
      center: [101.4998, 3.0708],
      zoom: 16,
      bounds: [[101.49, 3.06], [101.51, 3.08]],
      buildingCount: 48,
      established: "1956",
    },
  ];
}

function CompassRose() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="compass-rose"
      style={{ width: "100%", height: "100%" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" stroke="rgba(45,110,70,0.35)" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="48" stroke="rgba(45,110,70,0.2)" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="38" stroke="rgba(45,110,70,0.15)" strokeWidth="0.5" />

      {/* Degree marks — major */}
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 60 + 48 * Math.cos(rad);
        const y1 = 60 + 48 * Math.sin(rad);
        const x2 = 60 + 55 * Math.cos(rad);
        const y2 = 60 + 55 * Math.sin(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,110,70,0.5)" strokeWidth="1" />;
      })}
      {/* Minor marks */}
      {Array.from({length: 32}, (_, i) => i * (360/32)).filter(d => ![0,45,90,135,180,225,270,315].includes(d)).map((deg) => {
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 60 + 52 * Math.cos(rad);
        const y1 = 60 + 52 * Math.sin(rad);
        const x2 = 60 + 55 * Math.cos(rad);
        const y2 = 60 + 55 * Math.sin(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,110,70,0.25)" strokeWidth="0.5" />;
      })}

      {/* N S E W labels */}
      <text x="60" y="10" textAnchor="middle" dominantBaseline="middle" fill="rgba(180,230,200,0.8)" fontSize="7" fontFamily="monospace" fontWeight="bold">N</text>
      <text x="60" y="114" textAnchor="middle" dominantBaseline="middle" fill="rgba(120,170,140,0.5)" fontSize="5.5" fontFamily="monospace">S</text>
      <text x="112" y="61" textAnchor="middle" dominantBaseline="middle" fill="rgba(120,170,140,0.5)" fontSize="5.5" fontFamily="monospace">E</text>
      <text x="8" y="61" textAnchor="middle" dominantBaseline="middle" fill="rgba(120,170,140,0.5)" fontSize="5.5" fontFamily="monospace">W</text>

      {/* Cross hairs */}
      <line x1="60" y1="4" x2="60" y2="38" stroke="rgba(70,160,100,0.6)" strokeWidth="0.75" />
      <line x1="60" y1="82" x2="60" y2="116" stroke="rgba(45,110,70,0.35)" strokeWidth="0.75" />
      <line x1="4" y1="60" x2="38" y2="60" stroke="rgba(45,110,70,0.35)" strokeWidth="0.75" />
      <line x1="82" y1="60" x2="116" y2="60" stroke="rgba(45,110,70,0.35)" strokeWidth="0.75" />

      {/* Diagonal cross hairs */}
      {[45,135,225,315].map((deg) => {
        const rad = (deg - 90) * Math.PI / 180;
        const x1 = 60 + 20 * Math.cos(rad);
        const y1 = 60 + 20 * Math.sin(rad);
        const x2 = 60 + 36 * Math.cos(rad);
        const y2 = 60 + 36 * Math.sin(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,110,70,0.3)" strokeWidth="0.5" />;
      })}

      {/* North arrow — filled */}
      <polygon points="60,18 56,58 60,54 64,58" fill="rgba(100,200,140,0.8)" />
      <polygon points="60,102 56,62 60,66 64,62" fill="rgba(45,110,70,0.4)" />

      {/* Center dot */}
      <circle cx="60" cy="60" r="3.5" fill="none" stroke="rgba(100,200,140,0.7)" strokeWidth="1" />
      <circle cx="60" cy="60" r="1.2" fill="rgba(100,200,140,0.9)" />
    </svg>
  );
}

export default async function Home() {
  const campuses = await getCampuses();

  return (
    <main className="landing-root">
      {/* Topographic contour background */}
      <div className="topo-bg" aria-hidden="true" />
      {/* Scan-line overlay */}
      <div className="scanlines" aria-hidden="true" />
      {/* Noise grain */}
      <div className="grain" aria-hidden="true" />

      {/* Radial glow top-left */}
      <div className="glow-tl" aria-hidden="true" />
      {/* Radial glow bottom-right */}
      <div className="glow-br" aria-hidden="true" />

      {/* Grid layout */}
      <div className="page-grid">

        {/* ── Left column (desktop sidebar) ── */}
        <aside className="sidebar stagger-children">
          {/* Logo */}
          <div className="logo-block">
            <div className="logo-icon">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="logo-name">PetaUiTM</div>
              <div className="logo-sub">v2.0 · Open Source</div>
            </div>
          </div>

          {/* Compass rose */}
          <div className="compass-wrap">
            <CompassRose />
          </div>

          {/* Coordinate display */}
          <div className="coord-block">
            <div className="coord-label">PRIMARY CAMPUS</div>
            <div className="coord-value">3°04′15″N</div>
            <div className="coord-value">101°29′59″E</div>
          </div>

          {/* Stats */}
          <div className="stat-grid">
            {[
              { n: "1", label: "Active campus" },
              { n: "48+", label: "Buildings mapped" },
              { n: "OSM", label: "Data source" },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <span className="stat-n">{s.n}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Footer links */}
          <div className="sidebar-footer">
            <a
              href="https://github.com/muazarif12/petaUiTM"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <span className="footer-sep" />
            <span className="footer-note">MIT License</span>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="main-content stagger-children">

          {/* Header bar — mobile only */}
          <header className="mobile-header">
            <div className="logo-block">
              <div className="logo-icon">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="logo-name">PetaUiTM</span>
            </div>
            <a
              href="https://github.com/muazarif12/petaUiTM"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-github"
            >
              GitHub <ArrowUpRight className="h-3 w-3 inline" />
            </a>
          </header>

          {/* Hero section */}
          <section className="hero-section">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              Campus Navigation System
              <span className="eyebrow-tag">BETA</span>
            </div>

            <h1 className="hero-title">
              Navigate
              <br />
              <em>UiTM</em> with<br />
              confidence.
            </h1>

            <p className="hero-desc">
              An interactive open-source map for Universiti Teknologi MARA.
              Find buildings, explore facilities, and get walking directions — all in your browser.
            </p>

            {/* Feature pills */}
            <div className="feature-pills">
              {[
                { icon: Building2, label: "Building info" },
                { icon: Route, label: "Walking routes" },
                { icon: Map, label: "Floor plans" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="pill">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* Section label */}
          <div className="section-rule">
            <span className="section-rule-label">SELECT CAMPUS</span>
            <div className="section-rule-line" />
          </div>

          {/* Campus cards */}
          <div className="campus-list">
            {campuses.map((campus, i) => (
              <Link
                key={campus.id}
                href={`/${campus.id}`}
                className="campus-card"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                {/* Card header row */}
                <div className="card-header">
                  <div className="card-index">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="card-meta">
                    <span className="card-region">{campus.region}</span>
                    <span className="card-sep">·</span>
                    <span className="card-state">{campus.state}</span>
                  </div>
                  <div className="card-arrow">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Campus name */}
                <div className="card-name">
                  UiTM {campus.name}
                </div>

                {/* Card data row */}
                <div className="card-data-row">
                  <div className="card-data-item">
                    <span className="card-data-label">COORDINATES</span>
                    <span className="card-data-value">
                      {campus.center[1].toFixed(4)}°N, {campus.center[0].toFixed(4)}°E
                    </span>
                  </div>
                  {campus.buildingCount && (
                    <div className="card-data-item">
                      <span className="card-data-label">BUILDINGS</span>
                      <span className="card-data-value">{campus.buildingCount}+</span>
                    </div>
                  )}
                  {campus.established && (
                    <div className="card-data-item">
                      <span className="card-data-label">EST.</span>
                      <span className="card-data-value">{campus.established}</span>
                    </div>
                  )}
                </div>

                {/* Bottom CTA */}
                <div className="card-cta">
                  <Navigation className="h-3.5 w-3.5" />
                  Open interactive map
                </div>

                {/* Decorative map pin */}
                <div className="card-map-accent" aria-hidden="true">
                  <Compass className="h-16 w-16" />
                </div>
              </Link>
            ))}

            {/* Coming soon */}
            <div className="campus-card campus-card--soon">
              <div className="card-header">
                <div className="card-index card-index--muted">02</div>
                <div className="card-meta">
                  <span className="card-region card--muted">—</span>
                </div>
              </div>
              <div className="card-name card-name--muted">More campuses</div>
              <div className="soon-badge">
                <span className="soon-dot" />
                In progress — contributions welcome
              </div>
            </div>
          </div>

          {/* Mobile footer */}
          <footer className="mobile-footer">
            <span>OSM-based · MIT License · Open Source</span>
            <a
              href="https://github.com/muazarif12/petaUiTM"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub →
            </a>
          </footer>

        </div>
      </div>

      <style>{`
        /* ── Root ── */
        .landing-root {
          min-height: 100svh;
          background: #0a1f13;
          color: #c8e6d0;
          position: relative;
          overflow: hidden;
          font-family: var(--font-ibm), 'IBM Plex Sans', sans-serif;
        }

        /* ── Topographic background ── */
        .topo-bg {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(ellipse 130% 80% at 65% 40%, rgba(20,60,35,0.6) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Cg fill='none' stroke='rgba(40%2C100%2C60%2C0.07)' stroke-width='1'%3E%3Cellipse cx='400' cy='400' rx='380' ry='300' /%3E%3Cellipse cx='400' cy='400' rx='340' ry='260' /%3E%3Cellipse cx='400' cy='400' rx='300' ry='220' /%3E%3Cellipse cx='400' cy='400' rx='260' ry='180' /%3E%3Cellipse cx='400' cy='400' rx='220' ry='145' /%3E%3Cellipse cx='400' cy='400' rx='180' ry='110' /%3E%3Cellipse cx='400' cy='400' rx='140' ry='78' /%3E%3Cellipse cx='400' cy='400' rx='100' ry='50' /%3E%3Cellipse cx='400' cy='400' rx='60' ry='28' /%3E%3Cellipse cx='350' cy='300' rx='280' ry='200' /%3E%3Cellipse cx='350' cy='300' rx='240' ry='165' /%3E%3Cellipse cx='350' cy='300' rx='200' ry='133' /%3E%3Cellipse cx='350' cy='300' rx='160' ry='105' /%3E%3Cellipse cx='350' cy='300' rx='120' ry='80' /%3E%3Cellipse cx='450' cy='520' rx='200' ry='140' /%3E%3Cellipse cx='450' cy='520' rx='160' ry='110' /%3E%3Cellipse cx='450' cy='520' rx='120' ry='82' /%3E%3Cellipse cx='450' cy='520' rx='80' ry='55' /%3E%3C/g%3E%3C/svg%3E");
          background-size: cover, 900px 900px;
          background-position: center, 60% 40%;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Scanlines ── */
        .scanlines {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.06) 2px,
            rgba(0,0,0,0.06) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* ── Grain ── */
        .grain {
          position: absolute;
          inset: -200%;
          width: 400%;
          height: 400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.25;
          pointer-events: none;
          z-index: 1;
          animation: grain-shift 8s steps(10) infinite;
        }

        @keyframes grain-shift {
          0%   { transform: translate(0,0); }
          10%  { transform: translate(-3%,-4%); }
          20%  { transform: translate(2%, 3%); }
          30%  { transform: translate(-1%, 2%); }
          40%  { transform: translate(3%,-1%); }
          50%  { transform: translate(-2%, 4%); }
          60%  { transform: translate(1%,-3%); }
          70%  { transform: translate(-3%, 1%); }
          80%  { transform: translate(2%, 2%); }
          90%  { transform: translate(-1%,-2%); }
          100% { transform: translate(0,0); }
        }

        /* ── Glows ── */
        .glow-tl {
          position: absolute;
          top: -120px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(30,100,60,0.22) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        .glow-br {
          position: absolute;
          bottom: -100px;
          right: -80px;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(20,70,40,0.18) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Page grid ── */
        .page-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100svh;
        }

        @media (min-width: 900px) {
          .page-grid {
            grid-template-columns: 240px 1fr;
          }
        }
        @media (min-width: 1200px) {
          .page-grid {
            grid-template-columns: 280px 1fr;
          }
        }

        /* ── Sidebar ── */
        .sidebar {
          display: none;
          flex-direction: column;
          gap: 28px;
          padding: 36px 28px;
          border-right: 1px solid rgba(40,100,65,0.2);
          background: rgba(8,20,12,0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          height: 100svh;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .sidebar {
            display: flex;
          }
        }

        /* ── Logo block ── */
        .logo-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(40,110,65,0.9);
          border: 1px solid rgba(70,160,100,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a8ddb8;
          flex-shrink: 0;
        }
        .logo-name {
          font-size: 14px;
          font-weight: 600;
          color: #c8e6d0;
          letter-spacing: -0.02em;
        }
        .logo-sub {
          font-size: 10px;
          color: rgba(120,180,140,0.5);
          font-family: var(--font-geist-mono), monospace;
          letter-spacing: 0.04em;
          margin-top: 1px;
        }

        /* ── Compass ── */
        .compass-wrap {
          width: 110px;
          height: 110px;
          margin: 4px auto;
          animation: compass-spin 120s linear infinite;
          opacity: 0.85;
        }

        @keyframes compass-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Coord block ── */
        .coord-block {
          border: 1px solid rgba(40,100,60,0.3);
          border-radius: 8px;
          padding: 12px 14px;
          background: rgba(10,30,18,0.5);
        }
        .coord-label {
          font-size: 9px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(100,170,120,0.6);
          letter-spacing: 0.14em;
          margin-bottom: 5px;
        }
        .coord-value {
          font-size: 13px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(160,220,180,0.85);
          line-height: 1.6;
        }

        /* ── Stat grid ── */
        .stat-grid {
          display: flex;
          flex-direction: column;
          gap: 1px;
          border: 1px solid rgba(40,100,60,0.2);
          border-radius: 8px;
          overflow: hidden;
        }
        .stat-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          background: rgba(10,30,18,0.4);
        }
        .stat-item + .stat-item {
          border-top: 1px solid rgba(40,100,60,0.15);
        }
        .stat-n {
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          color: #90d4a8;
          font-weight: 600;
        }
        .stat-label {
          font-size: 11px;
          color: rgba(130,180,150,0.55);
          text-transform: lowercase;
          letter-spacing: 0.02em;
        }

        /* ── Sidebar footer ── */
        .sidebar-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        .footer-link {
          display: flex;
          align-items: center;
          gap: 3px;
          color: rgba(130,200,160,0.6);
          text-decoration: none;
          transition: color 0.2s;
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
        }
        .footer-link:hover {
          color: rgba(160,230,190,0.9);
        }
        .footer-sep {
          display: block;
          width: 1px;
          height: 12px;
          background: rgba(60,130,80,0.3);
        }
        .footer-note {
          color: rgba(100,160,120,0.4);
          font-family: var(--font-geist-mono), monospace;
          font-size: 10px;
        }

        /* ── Main content ── */
        .main-content {
          padding: 24px 20px 32px;
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 700px;
          width: 100%;
        }

        @media (min-width: 600px) {
          .main-content {
            padding: 40px 36px 48px;
          }
        }
        @media (min-width: 900px) {
          .main-content {
            padding: 52px 56px;
            max-width: none;
          }
        }

        /* ── Mobile header ── */
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 36px;
        }
        @media (min-width: 900px) {
          .mobile-header {
            display: none;
          }
        }
        .mobile-github {
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(130,200,160,0.6);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 2px;
          transition: color 0.2s;
        }
        .mobile-github:hover {
          color: rgba(160,230,190,0.9);
        }

        /* ── Hero section ── */
        .hero-section {
          margin-bottom: 40px;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-family: var(--font-geist-mono), monospace;
          letter-spacing: 0.14em;
          color: rgba(100,190,130,0.7);
          text-transform: uppercase;
          margin-bottom: 18px;
          border: 1px solid rgba(40,110,65,0.3);
          padding: 5px 10px 5px 8px;
          border-radius: 4px;
          background: rgba(20,60,35,0.4);
        }
        .eyebrow-dot {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4dc87a;
          box-shadow: 0 0 6px #4dc87a;
          animation: pulse-dot 2.4s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4dc87a; }
          50% { opacity: 0.6; box-shadow: 0 0 2px #4dc87a; }
        }
        .eyebrow-tag {
          margin-left: 2px;
          font-size: 8px;
          background: rgba(40,110,65,0.5);
          border: 1px solid rgba(70,160,100,0.3);
          padding: 1px 5px;
          border-radius: 3px;
          color: rgba(130,220,160,0.7);
        }

        .hero-title {
          font-family: var(--font-dm-serif), 'DM Serif Display', Georgia, serif;
          font-size: clamp(3rem, 8vw, 5.5rem);
          line-height: 1.02;
          letter-spacing: -0.02em;
          color: #e8f5ec;
          margin-bottom: 20px;
          font-weight: 400;
        }
        .hero-title em {
          font-style: italic;
          color: #5ecf88;
        }

        .hero-desc {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(160,210,175,0.65);
          max-width: 440px;
          margin-bottom: 24px;
          font-weight: 300;
        }

        /* ── Feature pills ── */
        .feature-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(130,200,155,0.65);
          border: 1px solid rgba(40,100,60,0.3);
          padding: 5px 10px;
          border-radius: 100px;
          background: rgba(15,40,22,0.5);
          letter-spacing: 0.02em;
        }

        /* ── Section rule ── */
        .section-rule {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-rule-label {
          font-size: 9px;
          font-family: var(--font-geist-mono), monospace;
          letter-spacing: 0.18em;
          color: rgba(80,150,100,0.5);
          white-space: nowrap;
        }
        .section-rule-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(40,100,60,0.4), transparent);
        }

        /* ── Campus list ── */
        .campus-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 36px;
        }

        /* ── Campus card ── */
        .campus-card {
          display: block;
          position: relative;
          padding: 20px 22px 16px;
          border: 1px solid rgba(40,100,60,0.3);
          border-radius: 12px;
          background: rgba(12,32,20,0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          text-decoration: none;
          overflow: hidden;
          transition:
            border-color 0.25s ease,
            background 0.25s ease,
            transform 0.2s ease,
            box-shadow 0.25s ease;
          animation: fade-in-up 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .campus-card:hover {
          border-color: rgba(70,170,100,0.5);
          background: rgba(15,42,25,0.85);
          transform: translateY(-2px);
          box-shadow:
            0 12px 40px rgba(0,0,0,0.35),
            0 0 0 1px rgba(60,160,90,0.12),
            inset 0 1px 0 rgba(100,200,130,0.06);
        }
        .campus-card:hover .card-arrow {
          transform: translate(2px, -2px);
          color: #5ecf88;
        }
        .campus-card:hover .card-cta {
          color: rgba(140,220,170,0.9);
        }
        .campus-card:hover .card-map-accent {
          opacity: 0.08;
          transform: rotate(25deg) scale(1.05);
        }

        .campus-card--soon {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }
        .campus-card--soon:hover {
          transform: none;
          box-shadow: none;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .card-index {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          color: #5ecf88;
          letter-spacing: 0.05em;
          opacity: 0.9;
        }
        .card-index--muted {
          color: rgba(80,130,100,0.5);
        }
        .card-meta {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-family: var(--font-geist-mono), monospace;
        }
        .card-region {
          color: rgba(100,180,130,0.6);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .card-sep {
          color: rgba(60,120,80,0.4);
        }
        .card-state {
          color: rgba(100,180,130,0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .card--muted {
          color: rgba(60,100,75,0.4) !important;
        }
        .card-arrow {
          color: rgba(100,180,130,0.5);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .card-name {
          font-family: var(--font-dm-serif), 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.6rem, 4.5vw, 2.4rem);
          line-height: 1.1;
          color: #daf0e4;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }
        .card-name--muted {
          color: rgba(100,150,115,0.4);
          font-size: 1.5rem;
        }

        .card-data-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 14px;
          padding: 12px 0;
          border-top: 1px solid rgba(40,100,60,0.18);
          border-bottom: 1px solid rgba(40,100,60,0.18);
        }
        .card-data-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .card-data-label {
          font-size: 8px;
          font-family: var(--font-geist-mono), monospace;
          letter-spacing: 0.16em;
          color: rgba(80,150,105,0.5);
          text-transform: uppercase;
        }
        .card-data-value {
          font-size: 12px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(160,220,180,0.8);
        }

        .card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(110,190,140,0.6);
          letter-spacing: 0.06em;
          transition: color 0.2s;
        }

        .card-map-accent {
          position: absolute;
          right: -12px;
          bottom: -12px;
          color: rgba(40,100,65,0.05);
          transition: opacity 0.3s, transform 0.4s ease;
          transform: rotate(20deg);
          pointer-events: none;
        }

        /* ── Soon badge ── */
        .soon-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(80,140,100,0.5);
          margin-top: 4px;
        }
        .soon-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: 1px dashed rgba(60,120,80,0.5);
          flex-shrink: 0;
        }

        /* ── Mobile footer ── */
        .mobile-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          color: rgba(80,140,100,0.4);
          padding-top: 20px;
          border-top: 1px solid rgba(40,100,60,0.15);
        }
        .mobile-footer a {
          color: rgba(110,190,140,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .mobile-footer a:hover {
          color: rgba(140,220,170,0.8);
        }
        @media (min-width: 900px) {
          .mobile-footer {
            display: none;
          }
        }

        /* ── Stagger children ── */
        .stagger-children > * {
          animation: fade-in-up 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .stagger-children > *:nth-child(1) { animation-delay: 0ms; }
        .stagger-children > *:nth-child(2) { animation-delay: 80ms; }
        .stagger-children > *:nth-child(3) { animation-delay: 160ms; }
        .stagger-children > *:nth-child(4) { animation-delay: 240ms; }
        .stagger-children > *:nth-child(5) { animation-delay: 320ms; }
        .stagger-children > *:nth-child(6) { animation-delay: 400ms; }
        .stagger-children > *:nth-child(7) { animation-delay: 480ms; }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
