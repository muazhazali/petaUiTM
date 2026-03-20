"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Building, Campus } from "@/types";
import BuildingSheet from "@/components/BuildingSheet";
import SearchBar from "@/components/SearchBar";
import { MapPin, ChevronLeft } from "lucide-react";
import Link from "next/link";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <MapPin className="h-6 w-6 text-white animate-pulse" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

interface CampusMapProps {
  campus: Campus;
  buildings: Building[];
}

function CampusMapInner({ campus, buildings }: CampusMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [routeGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    const buildingId = searchParams.get("building");
    if (buildingId) {
      const b = buildings.find((b) => b.id === buildingId);
      if (b) setSelectedBuilding(b);
    }
  }, [searchParams, buildings]);

  const handleBuildingSelect = (building: Building | null) => {
    setSelectedBuilding(building);
    const params = new URLSearchParams(searchParams.toString());
    if (building) params.set("building", building.id);
    else params.delete("building");
    router.replace(`/${campus.id}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col overflow-hidden">
      {/* Header - responsive: stacked on mobile, row on desktop */}
      <header className="absolute top-0 left-0 right-0 z-10 safe-top pointer-events-none">
        <div className="flex items-center gap-2 p-3 sm:p-4">
          {/* Back button */}
          <Link
            href="/"
            className="pointer-events-auto glass rounded-xl px-2.5 py-2 sm:px-3 flex items-center gap-1.5 hover:shadow-md active:scale-95 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-indigo-600" />
            <MapPin className="h-4 w-4 text-indigo-600 hidden sm:block" />
            <span className="text-sm font-semibold text-gray-800 hidden sm:inline">PetaUiTM</span>
          </Link>

          {/* Search - grows to fill */}
          <div className="pointer-events-auto flex-1 max-w-xs sm:max-w-sm">
            <SearchBar buildings={buildings} onSelectBuilding={(b) => handleBuildingSelect(b)} />
          </div>

          {/* Campus name - hidden on small mobile */}
          <div className="pointer-events-auto glass rounded-xl px-3 py-2 hidden sm:block">
            <span className="text-xs font-medium text-gray-600">{campus.name}</span>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent
          campus={campus}
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          onBuildingSelect={handleBuildingSelect}
          routeGeoJSON={routeGeoJSON}
        />
      </div>

      {/* Building info sheet */}
      <BuildingSheet
        building={selectedBuilding}
        onClose={() => handleBuildingSelect(null)}
      />
    </div>
  );
}

export default function CampusMap(props: CampusMapProps) {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white animate-pulse" />
            </div>
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <CampusMapInner {...props} />
    </Suspense>
  );
}
