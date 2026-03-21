import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

interface Campus {
  id: string;
  name: string;
  state: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
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
    },
  ];
}

export default async function Home() {
  const campuses = await getCampuses();

  return (
    <main className="min-h-screen bg-[#fdf9f4] relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Corner accent shapes */}
      <div className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-[#1e5235]/8" />
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full border border-[#1e5235]/6" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full border border-[#1e5235]/5" />
      </div>
      <div className="absolute bottom-0 left-0 w-[320px] h-[320px] pointer-events-none overflow-hidden">
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-[#1e5235]/6" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full border border-[#1e5235]/5" />
      </div>

      {/* Filled accent blob — top-right */}
      <div
        className="absolute top-0 right-0 w-[360px] h-[260px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 80% 20%, rgba(30,82,53,0.09) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col min-h-screen px-5 sm:px-8 py-10 sm:py-14 max-w-2xl mx-auto">

        {/* Top bar */}
        <nav className="flex items-center justify-between mb-16 sm:mb-20 stagger-children">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.32 0.09 155)" }}
            >
              <MapPin className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: "oklch(0.32 0.09 155)" }}
            >
              PetaUiTM
            </span>
          </div>
          <span className="text-xs text-stone-400 tracking-wider font-medium uppercase">
            Open Source
          </span>
        </nav>

        {/* Hero */}
        <div className="flex-1 stagger-children">
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border"
              style={{
                color: "oklch(0.32 0.09 155)",
                borderColor: "oklch(0.32 0.09 155 / 0.2)",
                background: "oklch(0.32 0.09 155 / 0.06)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.32 0.09 155)" }}
              />
              Campus Navigation
            </span>
          </div>

          <h1 className="font-serif-display text-[2.8rem] sm:text-[3.8rem] leading-[1.08] tracking-tight text-stone-900 mb-5">
            Navigate
            <br />
            <span style={{ color: "oklch(0.32 0.09 155)" }}>UiTM</span> with
            <br />
            confidence.
          </h1>

          <p className="text-[15px] text-stone-500 leading-relaxed max-w-sm mb-10 font-light">
            An interactive map for Universiti Teknologi MARA campuses.
            Find buildings, explore facilities, and get walking directions.
          </p>

          {/* Campus list */}
          <div className="mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">
              Select a campus
            </p>
            <div className="space-y-2.5">
              {campuses.map((campus, i) => (
                <Link
                  key={campus.id}
                  href={`/${campus.id}`}
                  className="group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-stone-200/80 bg-white/80 hover:border-[#276744]/30 hover:bg-white transition-all duration-300 hover:shadow-lg hover:shadow-[#1e5235]/6 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Number badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-serif-display text-lg font-bold text-white transition-transform duration-300 group-hover:scale-105"
                    style={{ background: "oklch(0.32 0.09 155)" }}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-stone-800 group-hover:text-[#1e5235] transition-colors">
                      UiTM {campus.name}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">{campus.state} · Interactive map</p>
                  </div>

                  {/* Arrow */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:translate-x-0.5"
                    style={{
                      background: "oklch(0.32 0.09 155 / 0.08)",
                      color: "oklch(0.32 0.09 155)",
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}

              {/* Coming soon placeholder */}
              <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-dashed border-stone-200 opacity-50 cursor-not-allowed select-none">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100">
                  <span className="font-serif-display text-lg font-bold text-stone-400">02</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-stone-400">More campuses</p>
                  <p className="text-xs text-stone-300 mt-0.5">Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features strip */}
          <div className="grid grid-cols-3 gap-3 mb-12">
            {[
              { label: "Buildings", detail: "Interactive map" },
              { label: "Navigation", detail: "Walking routes" },
              { label: "Floor Plans", detail: "Room search" },
            ].map((f) => (
              <div
                key={f.label}
                className="p-3 rounded-xl border border-stone-100 bg-white/60"
              >
                <p className="text-[11px] font-semibold text-stone-700">{f.label}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between pt-6 border-t border-stone-100">
          <p className="text-[11px] text-stone-300 tracking-wide">
            OSM-based · MIT License
          </p>
          <a
            href="https://github.com/muazarif12/petaUiTM"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors font-medium"
          >
            GitHub →
          </a>
        </footer>
      </div>
    </main>
  );
}
