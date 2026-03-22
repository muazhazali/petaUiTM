import Link from "next/link";
import { ArrowRight, MapPin, Building2, Route, Map, Github } from "lucide-react";

interface Campus {
  id: string;
  name: string;
  state: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  buildingCount?: number;
}

async function getCampuses(): Promise<Campus[]> {
  return [
    {
      id: "shah-alam",
      name: "Shah Alam",
      state: "Selangor",
      center: [101.4998, 3.0708],
      zoom: 16,
      bounds: [[101.49, 3.06], [101.51, 3.08]],
      buildingCount: 48,
    },
  ];
}

const FEATURES = [
  { icon: Building2, label: "Buildings", detail: "Tap any polygon on the map" },
  { icon: Route,     label: "Directions", detail: "Walking routes via OSRM" },
  { icon: Map,       label: "Floor plans", detail: "Room-level search" },
];

export default async function Home() {
  const campuses = await getCampuses();

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#fafaf8", fontFamily: "var(--font-ibm), 'IBM Plex Sans', sans-serif" }}
    >
      {/* ── Subtle dot-grid background ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(30,82,53,0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Top-right accent wash ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "55vw",
          height: "55vw",
          maxWidth: 680,
          maxHeight: 680,
          background:
            "radial-gradient(ellipse at 85% 10%, rgba(30,82,53,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          padding: "clamp(24px, 5vw, 56px) clamp(20px, 5vw, 40px)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100svh",
        }}
      >
        {/* ── Nav bar ── */}
        <nav
          className="stagger-children"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "clamp(40px, 8vw, 72px)",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "oklch(0.32 0.09 155)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MapPin style={{ width: 15, height: 15, color: "#fff" }} strokeWidth={2.2} />
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "oklch(0.25 0.07 155)",
                letterSpacing: "-0.02em",
              }}
            >
              PetaUiTM
            </span>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/muazarif12/petaUiTM"
            target="_blank"
            rel="noopener noreferrer"
            className="github-btn"
          >
            <Github style={{ width: 13, height: 13 }} />
            GitHub
          </a>
        </nav>

        {/* ── Hero ── */}
        <section className="stagger-children" style={{ marginBottom: "clamp(32px, 6vw, 56px)" }}>
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.32 0.09 155)",
              background: "oklch(0.32 0.09 155 / 0.07)",
              border: "1px solid oklch(0.32 0.09 155 / 0.18)",
              padding: "4px 10px 4px 8px",
              borderRadius: 100,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "oklch(0.42 0.12 155)",
                display: "block",
                animation: "pulse-dot 2.5s ease-in-out infinite",
              }}
            />
            Campus Navigation
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "var(--font-dm-serif), 'DM Serif Display', Georgia, serif",
              fontSize: "clamp(2.6rem, 7.5vw, 4rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              color: "#1c1917",
              marginBottom: 18,
              fontWeight: 400,
            }}
          >
            Navigate{" "}
            <span style={{ color: "oklch(0.32 0.09 155)", fontStyle: "italic" }}>UiTM</span>
            <br />
            with confidence.
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#78716c",
              maxWidth: 400,
              fontWeight: 300,
              marginBottom: 0,
            }}
          >
            Interactive open-source maps for Universiti Teknologi MARA campuses.
            Find buildings, explore facilities, and get walking directions.
          </p>
        </section>

        {/* ── Feature strip ── */}
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: "clamp(28px, 5vw, 44px)",
          }}
        >
          {FEATURES.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e7e5e4",
                background: "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "oklch(0.32 0.09 155 / 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Icon style={{ width: 14, height: 14, color: "oklch(0.32 0.09 155)" }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#292524", marginBottom: 2 }}>
                {label}
              </p>
              <p style={{ fontSize: 11, color: "#a8a29e", lineHeight: 1.4 }}>{detail}</p>
            </div>
          ))}
        </div>

        {/* ── Section label ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a8a29e",
              whiteSpace: "nowrap",
            }}
          >
            Select a campus
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(to right, #e7e5e4, transparent)",
            }}
          />
        </div>

        {/* ── Campus list ── */}
        <div
          className="stagger-children"
          style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "clamp(28px, 5vw, 44px)" }}
        >
          {campuses.map((campus, i) => (
            <Link
              key={campus.id}
              href={`/${campus.id}`}
              className="campus-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Number */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "oklch(0.32 0.09 155)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-dm-serif), Georgia, serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#fff",
                  transition: "transform 0.25s ease",
                }}
                className="card-num"
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1c1917",
                    marginBottom: 2,
                    transition: "color 0.2s",
                  }}
                  className="card-title"
                >
                  UiTM {campus.name}
                </p>
                <p style={{ fontSize: 12, color: "#a8a29e" }}>
                  {campus.state}
                  {campus.buildingCount ? ` · ${campus.buildingCount}+ buildings` : ""}
                </p>
              </div>

              {/* Arrow */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "oklch(0.32 0.09 155 / 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "oklch(0.32 0.09 155)",
                  transition: "transform 0.25s ease, background 0.25s ease",
                }}
                className="card-arrow"
              >
                <ArrowRight style={{ width: 15, height: 15 }} />
              </div>
            </Link>
          ))}

          {/* Coming soon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px dashed #e7e5e4",
              opacity: 0.5,
              cursor: "not-allowed",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#f5f5f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                fontSize: 17,
                color: "#a8a29e",
              }}
            >
              02
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#a8a29e" }}>More campuses</p>
              <p style={{ fontSize: 12, color: "#c4c0bb" }}>Coming soon · contributions welcome</p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: "1px solid #e7e5e4",
          }}
        >
          <p style={{ fontSize: 11, color: "#c4c0bb", letterSpacing: "0.04em" }}>
            OSM-based · MIT License
          </p>
          <a
            href="https://github.com/muazarif12/petaUiTM"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#a8a29e",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            GitHub →
          </a>
        </footer>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .stagger-children > * {
          animation: fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .stagger-children > *:nth-child(1) { animation-delay: 0ms; }
        .stagger-children > *:nth-child(2) { animation-delay: 70ms; }
        .stagger-children > *:nth-child(3) { animation-delay: 140ms; }
        .stagger-children > *:nth-child(4) { animation-delay: 210ms; }
        .stagger-children > *:nth-child(5) { animation-delay: 280ms; }

        .campus-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #e7e5e4;
          background: rgba(255,255,255,0.75);
          text-decoration: none;
          transition:
            border-color 0.25s ease,
            background 0.25s ease,
            transform 0.2s ease,
            box-shadow 0.25s ease;
          animation: fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .campus-card:hover {
          border-color: oklch(0.32 0.09 155 / 0.35);
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(30, 82, 53, 0.08), 0 2px 6px rgba(0,0,0,0.04);
        }
        .campus-card:hover .card-title {
          color: oklch(0.32 0.09 155);
        }
        .campus-card:hover .card-num {
          transform: scale(1.05);
        }
        .campus-card:hover .card-arrow {
          transform: translateX(2px);
          background: oklch(0.32 0.09 155 / 0.14) !important;
        }

        @media (max-width: 480px) {
          .campus-card {
            padding: 12px 14px;
            border-radius: 12px;
          }
        }

        .github-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          color: #78716c;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e7e5e4;
          background: rgba(255,255,255,0.7);
          transition: border-color 0.2s, color 0.2s;
        }
        .github-btn:hover {
          border-color: oklch(0.32 0.09 155 / 0.4);
          color: oklch(0.25 0.07 155);
        }
      `}</style>
    </main>
  );
}
