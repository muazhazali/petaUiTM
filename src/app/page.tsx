import Link from "next/link";
import { MapPin } from "lucide-react";

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">PetaUiTM</h1>
          </div>
          <p className="text-lg text-gray-600">
            Interactive campus map for UiTM — find buildings, rooms, and navigate with ease.
          </p>
        </div>

        <div className="grid gap-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Select Campus</h2>
          {campuses.map((campus) => (
            <Link
              key={campus.id}
              href={`/${campus.id}`}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <MapPin className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campus.name}</h3>
                  <p className="text-sm text-gray-500">Tap to explore campus map</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-12">
          Open source · OSM-based · Built for the UiTM community
        </p>
      </div>
    </main>
  );
}
