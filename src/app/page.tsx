import Link from "next/link";
import { MapPin, Navigation, ArrowRight } from "lucide-react";

interface Campus {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
}

async function getCampuses(): Promise<Campus[]> {
  return [
    {
      id: "shah-alam",
      name: "UiTM Shah Alam",
      center: [101.4998, 3.0708],
      zoom: 16,
      bounds: [[101.49, 3.06], [101.51, 3.08]],
    },
  ];
}

export default async function Home() {
  const campuses = await getCampuses();

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-12 sm:px-8">
        <div className="w-full max-w-lg stagger-children">
          {/* Logo & Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-5">
              <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Peta<span className="text-indigo-600">UiTM</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-sm mx-auto leading-relaxed">
              Navigate your campus with ease. Find buildings, rooms, and get directions.
            </p>
          </div>

          {/* Campus Cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
              Select Campus
            </p>
            {campuses.map((campus) => (
              <Link
                key={campus.id}
                href={`/${campus.id}`}
                className="group block glass rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {campus.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">Explore interactive map</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-300 mt-12 tracking-wide">
            Open source · OSM-based · Built for UiTM
          </p>
        </div>
      </div>
    </main>
  );
}
