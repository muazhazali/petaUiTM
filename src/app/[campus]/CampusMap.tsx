"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Building, Campus } from "@/types";
import BuildingSheet from "@/components/BuildingSheet";
import SearchBar from "@/components/SearchBar";
import NavigationPanel from "@/components/NavigationPanel";
import { MapPin, ChevronLeft, Navigation } from "lucide-react";
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

async function fetchRoute(
  from: Building,
  to: Building
): Promise<GeoJSON.FeatureCollection | null> {
  // Use OSRM public demo server for walking routes
  const fromCoord = `${from.coords[1]},${from.coords[0]}`;
  const toCoord = `${to.coords[1]},${to.coords[0]}`;
  const url = `https://router.project-osrm.org/route/v1/foot/${fromCoord};${toCoord}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const geometry = data?.routes?.[0]?.geometry;
    if (!geometry) return null;
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry }],
    };
  } catch {
    return null;
  }
}

function CampusMapInner({ campus, buildings }: CampusMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [navMode, setNavMode] = useState(false);
  const [fromBuilding, setFromBuilding] = useState<Building | null>(null);
  const [toBuilding, setToBuilding] = useState<Building | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Sync state from URL params on load
  useEffect(() => {
    const buildingId = searchParams.get("building");
    const fromId = searchParams.get("from");
    const toId = searchParams.get("to");

    if (fromId || toId) {
      setNavMode(true);
      if (fromId) {
        const b = buildings.find((b) => b.id === fromId);
        if (b) setFromBuilding(b);
      }
      if (toId) {
        const b = buildings.find((b) => b.id === toId);
        if (b) setToBuilding(b);
      }
    } else if (buildingId) {
      const b = buildings.find((b) => b.id === buildingId);
      if (b) setSelectedBuilding(b);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch route when from/to change
  useEffect(() => {
    if (!fromBuilding || !toBuilding) {
      setRouteGeoJSON(null);
      return;
    }
    setRouteLoading(true);
    fetchRoute(fromBuilding, toBuilding).then((geojson) => {
      setRouteGeoJSON(geojson);
      setRouteLoading(false);
    });
  }, [fromBuilding, toBuilding]);

  // Sync URL params
  const syncUrl = useCallback(
    (from: Building | null, to: Building | null, building: Building | null, isNav: boolean) => {
      const params = new URLSearchParams();
      if (isNav) {
        if (from) params.set("from", from.id);
        if (to) params.set("to", to.id);
      } else if (building) {
        params.set("building", building.id);
      }
      const qs = params.toString();
      router.replace(`/${campus.id}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, campus.id]
  );

  const handleBuildingSelect = useCallback(
    (building: Building | null) => {
      if (navMode) {
        // In nav mode, clicking a building sets it as "to" if from is set, else "from"
        if (!fromBuilding) {
          setFromBuilding(building);
          syncUrl(building, toBuilding, null, true);
        } else if (!toBuilding) {
          setToBuilding(building);
          syncUrl(fromBuilding, building, null, true);
        } else {
          // Both set — replace "to"
          setToBuilding(building);
          syncUrl(fromBuilding, building, null, true);
        }
        return;
      }
      setSelectedBuilding(building);
      syncUrl(null, null, building, false);
    },
    [navMode, fromBuilding, toBuilding, syncUrl]
  );

  const handleSetFrom = useCallback(
    (building: Building) => {
      setNavMode(true);
      setFromBuilding(building);
      syncUrl(building, toBuilding, null, true);
    },
    [toBuilding, syncUrl]
  );

  const handleSetTo = useCallback(
    (building: Building) => {
      setNavMode(true);
      setToBuilding(building);
      syncUrl(fromBuilding, building, null, true);
    },
    [fromBuilding, syncUrl]
  );

  const handleCloseNav = useCallback(() => {
    setNavMode(false);
    setFromBuilding(null);
    setToBuilding(null);
    setRouteGeoJSON(null);
    router.replace(`/${campus.id}`, { scroll: false });
  }, [router, campus.id]);

  const handleSwap = useCallback(() => {
    setFromBuilding(toBuilding);
    setToBuilding(fromBuilding);
    syncUrl(toBuilding, fromBuilding, null, true);
  }, [fromBuilding, toBuilding, syncUrl]);

  return (
    <div className="h-[100dvh] w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 safe-top pointer-events-none">
        <div className="flex items-start gap-2 p-3 sm:p-4">
          {/* Back button */}
          <Link
            href="/"
            aria-label="Back to campus list"
            className="pointer-events-auto bg-white border border-gray-200 shadow-sm rounded-xl px-2.5 py-2.5 sm:px-3 flex items-center gap-1.5 hover:shadow-md active:scale-95 transition-all duration-200 flex-shrink-0 mt-0.5"
          >
            <ChevronLeft className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-800 hidden sm:inline">PetaUiTM</span>
          </Link>

          {/* Search or Nav panel - grows to fill */}
          <div className="pointer-events-auto flex-1 min-w-0">
            {navMode ? (
              <NavigationPanel
                from={fromBuilding}
                to={toBuilding}
                isLoading={routeLoading}
                onSwap={handleSwap}
                onClearFrom={() => { setFromBuilding(null); syncUrl(null, toBuilding, null, true); }}
                onClearTo={() => { setToBuilding(null); syncUrl(fromBuilding, null, null, true); }}
                onClose={handleCloseNav}
              />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <SearchBar buildings={buildings} onSelectBuilding={(b) => handleBuildingSelect(b)} />
                </div>
                {/* Directions button — always visible with label */}
                <button
                  onClick={() => setNavMode(true)}
                  aria-label="Get directions"
                  className="bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-2.5 flex items-center gap-1.5 hover:shadow-md active:scale-95 transition-all duration-200 flex-shrink-0 text-indigo-600"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-semibold hidden sm:inline">Directions</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent
          campus={campus}
          buildings={buildings}
          selectedBuilding={navMode ? null : selectedBuilding}
          onBuildingSelect={handleBuildingSelect}
          routeGeoJSON={routeGeoJSON}
          fromBuilding={fromBuilding}
          toBuilding={toBuilding}
        />
      </div>

      {/* Building info sheet */}
      <BuildingSheet
        building={navMode ? null : selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onSetFrom={handleSetFrom}
        onSetTo={handleSetTo}
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
