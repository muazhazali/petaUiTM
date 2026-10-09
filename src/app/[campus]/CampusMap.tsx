"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Building, Campus, POI, POICategory } from "@/types";
import BuildingSheet from "@/components/BuildingSheet";
import NavigationPanel from "@/components/NavigationPanel";
import BuildingList from "@/components/BuildingList";
import { MapPin, ChevronLeft, Navigation, Map, ArrowLeft } from "lucide-react";
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
    <div className="w-full h-full bg-[#EEF1F9] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: "#17245B" }}
        >
          <MapPin className="h-6 w-6 text-[#F5BF32] animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-[#4C5370]">Loading map</p>
          <div className="flex gap-1" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B267B] animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B267B] animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B267B] animate-bounce [animation-delay:300ms]" />
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

  // Read URL params once at first render to seed state (no sync-in-effect)
  const [initial] = useState(() => {
    const buildingId = searchParams.get("building");
    const fromId = searchParams.get("from");
    const toId = searchParams.get("to");
    const find = (id: string | null) => (id ? buildings.find((b) => b.id === id) ?? null : null);
    const isNav = Boolean(fromId || toId);
    return {
      nav: isNav,
      from: find(fromId),
      to: find(toId),
      building: isNav ? null : find(buildingId),
    };
  });

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(initial.building);
  const [navMode, setNavMode] = useState(initial.nav);
  const [fromBuilding, setFromBuilding] = useState<Building | null>(initial.from);
  const [toBuilding, setToBuilding] = useState<Building | null>(initial.to);
  const [routeState, setRouteState] = useState<{ key: string; info: RouteInfo | null } | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(new Set());
  const [showMap, setShowMap] = useState(false); // mobile toggle

  // Load POIs for this campus
  useEffect(() => {
    fetch("/data/pois.json")
      .then((r) => r.json())
      .then((all: POI[]) => setPois(all.filter((p) => p.campus === campus.id)))
      .catch(() => {});
  }, [campus.id]);

  const routeKey = fromBuilding && toBuilding ? `${fromBuilding.id}->${toBuilding.id}` : null;

  // Fetch route when from/to change (setState only from async callback)
  useEffect(() => {
    if (!routeKey || !fromBuilding || !toBuilding) return;
    let cancelled = false;
    fetchRoute(fromBuilding, toBuilding).then((info) => {
      if (cancelled) return;
      setRouteState({ key: routeKey, info });
    });
    return () => { cancelled = true; };
  }, [routeKey, fromBuilding, toBuilding]);

  const routeIsCurrent = routeKey !== null && routeState?.key === routeKey;
  const routeInfo = routeIsCurrent && routeState ? routeState.info : null;
  const routeGeoJSON = routeIsCurrent && routeState ? routeState.info?.geojson ?? null : null;
  const routeLoading = routeKey !== null && !routeIsCurrent;

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
        if (!fromBuilding) {
          setFromBuilding(building);
          syncUrl(building, toBuilding, null, true);
        } else if (!toBuilding) {
          setToBuilding(building);
          syncUrl(fromBuilding, building, null, true);
        } else {
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
    setRouteState(null);
    router.replace(`/${campus.id}`, { scroll: false });
  }, [router, campus.id]);

  const handleSwap = useCallback(() => {
    setFromBuilding(toBuilding);
    setToBuilding(fromBuilding);
    syncUrl(toBuilding, fromBuilding, null, true);
  }, [fromBuilding, toBuilding, syncUrl]);

  return (
    <div className="h-[100dvh] w-screen flex flex-col overflow-hidden">
      {/* Slim header */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 border-b border-[#DBE0F1] safe-top"
        style={{ height: "56px", background: "#F5F7FC" }}
      >
        <Link
          href="/"
          aria-label="Back to campus list"
          className="flex items-center gap-1 text-[#4C5370] hover:text-[#17245B] transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">PetaUiTM</span>
        </Link>

        <div className="w-px h-4 bg-[#DBE0F1] flex-shrink-0 hidden sm:block" />

        <span className="flex-1 text-sm font-semibold text-[#17245B] truncate">{campus.name}</span>

        {!navMode && (
          <button
            onClick={() => setNavMode(true)}
            aria-label="Get directions"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md active:scale-95 flex-shrink-0"
            style={{ background: "#F5BF32", color: "#17245B" }}
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Directions</span>
          </button>
        )}
      </header>

      {/* Body: list panel + map panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — building list or nav panel */}
        <div
          className={`flex flex-col bg-[#F5F7FC] border-r border-[#DBE0F1] z-10 relative
                      w-full lg:w-[420px] lg:flex-shrink-0
                      ${showMap ? "hidden lg:flex" : "flex"}`}
        >
          {navMode ? (
            <div className="flex-1 overflow-y-auto">
              <NavigationPanel
                buildings={buildings}
                from={fromBuilding}
                to={toBuilding}
                isLoading={routeLoading}
                routeInfo={routeInfo}
                onSwap={handleSwap}
                onSetFrom={(b) => { setFromBuilding(b); syncUrl(b, toBuilding, null, true); }}
                onSetTo={(b) => { setToBuilding(b); syncUrl(fromBuilding, b, null, true); }}
                onClearFrom={() => { setFromBuilding(null); syncUrl(null, toBuilding, null, true); }}
                onClearTo={() => { setToBuilding(null); syncUrl(fromBuilding, null, null, true); }}
                onClose={handleCloseNav}
              />
            </div>
          ) : (
            <BuildingList
              buildings={buildings}
              selectedBuilding={selectedBuilding}
              onSelectBuilding={handleBuildingSelect}
              navMode={navMode}
              fromBuilding={fromBuilding}
              toBuilding={toBuilding}
              onSetFrom={handleSetFrom}
              onSetTo={handleSetTo}
              pois={pois}
              activeCategories={activeCategories}
              onCategoriesChange={setActiveCategories}
            />
          )}

          {/* Mobile: Show Map FAB */}
          {!navMode && (
            <div className="lg:hidden absolute bottom-4 right-4 z-20">
              <button
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg active:scale-95 transition-all"
                style={{ background: "#17245B", boxShadow: "0 4px 16px rgba(91,38,123,0.4)" }}
              >
                <Map className="h-4 w-4" />
                Show Map
              </button>
            </div>
          )}
        </div>

        {/* Right panel — map */}
        <div
          className={`flex-1 relative
                      hidden lg:block
                      ${showMap ? "!block fixed inset-0 z-40" : ""}`}
        >
          {/* Mobile: back to list button */}
          {showMap && (
            <button
              onClick={() => setShowMap(false)}
              className="lg:hidden absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold shadow-lg active:scale-95 transition-all"
              style={{ background: "rgba(255,255,255,0.95)", color: "#5B267B", backdropFilter: "blur(8px)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              List
            </button>
          )}

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
      </div>

      {/* Building info sheet — unchanged */}
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
        <div className="h-[100dvh] flex items-center justify-center bg-[#EEF1F9]">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: "#17245B" }}
            >
              <MapPin className="h-6 w-6 text-[#F5BF32] animate-pulse" />
            </div>
            <p className="text-sm font-medium text-[#4C5370]">Loading...</p>
          </div>
        </div>
      }
    >
      <CampusMapInner {...props} />
    </Suspense>
  );
}
