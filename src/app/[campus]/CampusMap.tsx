"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Building, Campus, POI, POICategory } from "@/types";
import BuildingSheet from "@/components/BuildingSheet";
import SearchBar from "@/components/SearchBar";
import NavigationPanel from "@/components/NavigationPanel";
import POIFilter from "@/components/POIFilter";
import { MapPin, ChevronLeft, Navigation } from "lucide-react";
import Link from "next/link";

export interface RouteStep {
  maneuver: string;
  name: string;
  distance: number; // metres
  duration: number; // seconds
}

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#eef4f0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: "oklch(0.32 0.09 155)" }}
        >
          <MapPin className="h-6 w-6 text-white animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-stone-600">Loading map</p>
          <div className="flex gap-1" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f7d53] animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f7d53] animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f7d53] animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  ),
});

interface CampusMapProps {
  campus: Campus;
  buildings: Building[];
}

export interface RouteInfo {
  geojson: GeoJSON.FeatureCollection;
  distance: number; // metres
  duration: number; // seconds
  steps: RouteStep[];
}

async function fetchRoute(
  from: Building,
  to: Building
): Promise<RouteInfo | null> {
  const fromCoord = `${from.coords[1]},${from.coords[0]}`;
  const toCoord = `${to.coords[1]},${to.coords[0]}`;
  const url = `https://router.project-osrm.org/route/v1/foot/${fromCoord};${toCoord}?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry) return null;
    const steps: RouteStep[] = (route.legs?.[0]?.steps ?? [])
      .filter((s: { maneuver: { type: string } }) => s.maneuver?.type !== "depart" || true)
      .map((s: { maneuver: { type: string }; name: string; distance: number; duration: number }) => ({
        maneuver: s.maneuver?.type ?? "continue",
        name: s.name || "",
        distance: s.distance ?? 0,
        duration: s.duration ?? 0,
      }));
    return {
      geojson: {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: route.geometry }],
      },
      distance: route.distance ?? 0,
      duration: route.duration ?? 0,
      steps,
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
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(new Set());

  // Load POIs for this campus
  useEffect(() => {
    fetch("/data/pois.json")
      .then((r) => r.json())
      .then((all: POI[]) => setPois(all.filter((p) => p.campus === campus.id)))
      .catch(() => {});
  }, [campus.id]);

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
    fetchRoute(fromBuilding, toBuilding).then((info) => {
      setRouteGeoJSON(info?.geojson ?? null);
      setRouteInfo(info);
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
    setRouteInfo(null);
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
            className="pointer-events-auto map-panel rounded-xl px-2.5 py-2.5 sm:px-3 flex items-center gap-1.5 hover:shadow-xl active:scale-95 transition-all duration-200 flex-shrink-0 mt-0.5"
          >
            <ChevronLeft className="h-4 w-4 flex-shrink-0" style={{ color: "oklch(0.32 0.09 155)" }} aria-hidden="true" />
            <span className="text-sm font-semibold text-stone-800 hidden sm:inline">PetaUiTM</span>
          </Link>

          {/* Search or Nav panel - grows to fill */}
          <div className="pointer-events-auto flex-1 min-w-0">
            {navMode ? (
              <NavigationPanel
                buildings={buildings}
                from={fromBuilding}
                to={toBuilding}
                isLoading={routeLoading}
                routeInfo={routeInfo}
                onSwap={handleSwap}
                onSetFrom={(b) => { setFromBuilding(b); syncUrl(b, toBuilding, null, true); }}
                onSetTo={(b) => { setToBuilding(b); syncUrl(fromBuilding, b, null, true); }}
                onClearFrom={() => { setFromBuilding(null); syncUrl(null, toBuilding, null, true); setRouteInfo(null); }}
                onClearTo={() => { setToBuilding(null); syncUrl(fromBuilding, null, null, true); setRouteInfo(null); }}
                onClose={handleCloseNav}
              />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <SearchBar buildings={buildings} onSelectBuilding={(b) => handleBuildingSelect(b)} />
                </div>
                {/* Directions button */}
                <button
                  onClick={() => setNavMode(true)}
                  aria-label="Get directions"
                  className="map-panel rounded-xl px-3 py-2.5 flex items-center gap-1.5 hover:shadow-xl active:scale-95 transition-all duration-200 flex-shrink-0"
                  style={{ color: "oklch(0.32 0.09 155)" }}
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-semibold hidden sm:inline">Directions</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* POI filter bar — only in explore mode */}
        {!navMode && (
          <div className="pointer-events-auto px-3 sm:px-4 pb-2">
            <POIFilter activeCategories={activeCategories} onChange={setActiveCategories} />
          </div>
        )}
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
          pois={pois}
          activeCategories={activeCategories}
        />
      </div>

      {/* Persistent navigation destination banner */}
      {navMode && toBuilding && (
        <div className="absolute bottom-0 left-0 right-0 z-10 safe-bottom pointer-events-none">
          <div className="mx-3 mb-3 sm:mx-4 sm:mb-4 pointer-events-auto">
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white shadow-lg"
              style={{ background: "oklch(0.32 0.09 155)", boxShadow: "0 8px 32px oklch(0.32 0.09 155 / 0.35)" }}
            >
              <Navigation className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-70 block leading-none mb-0.5">Navigating to</span>
                <span className="text-sm font-semibold truncate block">{toBuilding.name}</span>
              </div>
              {routeInfo && (
                <span
                  className="text-xs font-semibold flex-shrink-0 px-2 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  ~{Math.round(routeInfo.duration / 60)} min
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
        <div className="h-[100dvh] flex items-center justify-center bg-[#eef4f0]">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: "oklch(0.32 0.09 155)" }}
            >
              <MapPin className="h-6 w-6 text-white animate-pulse" />
            </div>
            <p className="text-sm font-medium text-stone-500">Loading...</p>
          </div>
        </div>
      }
    >
      <CampusMapInner {...props} />
    </Suspense>
  );
}
