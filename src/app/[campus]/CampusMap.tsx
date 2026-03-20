"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Building, Campus } from "@/types";
import BuildingSheet from "@/components/BuildingSheet";
import SearchBar from "@/components/SearchBar";
import { MapPin } from "lucide-react";
import Link from "next/link";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading map...</div>
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
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center gap-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto bg-white rounded-lg shadow-sm px-3 py-2 flex items-center gap-2 hover:shadow-md transition-shadow"
        >
          <MapPin className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">PetaUiTM</span>
        </Link>
        <div className="pointer-events-auto flex-1 max-w-sm">
          <SearchBar buildings={buildings} onSelectBuilding={(b) => handleBuildingSelect(b)} />
        </div>
        <div className="pointer-events-auto ml-auto bg-white rounded-lg shadow-sm px-3 py-2">
          <span className="text-xs font-medium text-gray-600">{campus.name}</span>
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
        <div className="h-screen flex items-center justify-center">Loading...</div>
      }
    >
      <CampusMapInner {...props} />
    </Suspense>
  );
}
