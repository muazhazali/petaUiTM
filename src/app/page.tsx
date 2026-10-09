import Link from "next/link";
import { ArrowRight, MapPin, Building2, Route, Map } from "lucide-react";

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
  { icon: Building2, label: "Buildings", detail: "Find any faculty in two taps" },
  { icon: Route,     label: "Directions", detail: "Step-by-step walking routes" },
  { icon: Map,       label: "Floor plans", detail: "Search down to the room number" },
];

export default async function Home() {
  const campuses = await getCampuses();

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#F5F7FC", fontFamily: "var(--font-ibm), 'IBM Plex Sans', sans-serif" }}
    >
      {/* ── Subtle dot-grid background ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(23,36,91,0.13) 1px, transparent 1px)",
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
            "radial-gradient(ellipse at 85% 10%, rgba(91,38,123,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 860,
          margin: "0 auto",
          padding: "clamp(12px, 3.5vh, 36px) clamp(20px, 5vw, 40px)",
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
            marginBottom: "clamp(18px, 4vh, 32px)",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#17245B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MapPin style={{ width: 17, height: 17, color: "#F5BF32" }} strokeWidth={2.2} />
            </div>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "#17245B",
                letterSpacing: "-0.02em",
              }}
            >
              PetaUiTM
            </span>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/muazhazali/petaUiTM"
            target="_blank"
            rel="noopener noreferrer"
            className="github-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }} aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.295-1.552 3.295-1.23 3.295-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>
        </nav>

        {/* ── Hero ── */}
        <section className="stagger-children" style={{ marginBottom: "clamp(16px, 4vh, 32px)" }}>
          {/* Heading */}
            <h1
              style={{
                fontFamily: "var(--font-dm-serif), 'DM Serif Display', Georgia, serif",
                fontSize: "clamp(2.7rem, 7.5vh, 4.5rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
                color: "#17245B",
                marginBottom: 16,
                fontWeight: 400,
              }}
            >
              Never get lost at{" "}
              <span style={{ color: "#5B267B", fontStyle: "italic" }}>UiTM</span>
              {" "}again.
            </h1>

            <p
              style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "#4C5370",
              maxWidth: 520,
                fontWeight: 300,
                marginBottom: 0,
              }}
            >
            An interactive map of UiTM campus. Search buildings and get
            walking directions in seconds.
          </p>
        </section>

        {/* ── Feature strip ── */}
        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: "clamp(16px, 3.5vh, 28px)",
          }}
        >
          {FEATURES.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              style={{
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid #DBE0F1",
                background: "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(91,38,123,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Icon style={{ width: 18, height: 18, color: "#5B267B" }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#17245B", marginBottom: 3 }}>
                {label}
              </p>
              <p style={{ fontSize: 13, color: "#6B7399", lineHeight: 1.45 }}>{detail}</p>
            </div>
          ))}
        </div>

        {/* ── Campus list ── */}
        <div
          className="stagger-children"
          style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "clamp(14px, 3vh, 24px)" }}
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
                  width: 52,
                  height: 52,
                  borderRadius: 13,
                  background: "#17245B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-dm-serif), Georgia, serif",
                  fontSize: 21,
                  fontWeight: 700,
                  color: "#F5BF32",
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
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#17245B",
                    marginBottom: 3,
                    transition: "color 0.2s",
                  }}
                  className="card-title"
                >
                  UiTM {campus.name}
                </p>
                <p style={{ fontSize: 14, color: "#6B7399" }}>
                  {campus.state}
                  {campus.buildingCount ? ` · ${campus.buildingCount}+ buildings` : ""}
                </p>
              </div>

              {/* Arrow */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: "rgba(91,38,123,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#5B267B",
                  transition: "transform 0.25s ease, background 0.25s ease",
                }}
                className="card-arrow"
              >
                <ArrowRight style={{ width: 19, height: 19 }} />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid #e7e5e4",
          }}
        >
          <p style={{ fontSize: 11, color: "#8A96CB", letterSpacing: "0.04em" }}>
            OSM-based · MIT License
          </p>
          <a
            href="https://github.com/muazhazali/petaUiTM"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#5B267B",
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
          from { opacity: 0; transform: translateY(8px); }
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
          gap: 16px;
          padding: 15px 20px;
          border-radius: 14px;
          border: 1px solid #DBE0F1;
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
          border-color: rgba(245, 191, 50, 0.8);
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(23, 36, 91, 0.1), 0 2px 6px rgba(0,0,0,0.04);
        }
        .campus-card:hover .card-title {
          color: #5B267B;
        }
        .campus-card:hover .card-num {
          transform: scale(1.05);
        }
        .campus-card:hover .card-arrow {
          transform: translateX(2px);
          background: rgba(91,38,123,0.14) !important;
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
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #4C5370;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 9px;
          border: 1px solid #DBE0F1;
          background: rgba(255,255,255,0.7);
          transition: border-color 0.2s, color 0.2s;
        }
        .github-btn:hover {
          border-color: rgba(245, 191, 50, 0.8);
          color: #17245B;
        }
      `}</style>
    </main>
  );
}
