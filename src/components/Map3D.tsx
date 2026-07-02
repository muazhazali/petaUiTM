"use client";

import { useEffect, useRef } from "react";
import { Building } from "@/types";
import { KeyRound } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// --- Minimal typings for the Google Maps 3D (maps3d) library ---

interface LatLngAlt {
  lat: number;
  lng: number;
  altitude?: number;
}

interface CameraOptions {
  center: LatLngAlt;
  tilt?: number;
  range?: number;
  heading?: number;
}

interface Map3DElement extends HTMLElement {
  flyCameraTo(options: { endCamera: CameraOptions; durationMillis?: number }): void;
}

interface Maps3DLibrary {
  Map3DElement: new (options: CameraOptions & { mode?: string; defaultUIDisabled?: boolean }) => Map3DElement;
  Marker3DInteractiveElement: new (options: {
    position: LatLngAlt;
    label?: string;
    altitudeMode?: string;
    extruded?: boolean;
  }) => HTMLElement;
  Polyline3DElement: new (options: {
    coordinates: LatLngAlt[];
    strokeColor?: string;
    strokeWidth?: number;
    altitudeMode?: string;
    drawsOccludedSegments?: boolean;
  }) => HTMLElement;
  MapMode: { HYBRID: string; SATELLITE: string };
  AltitudeMode: {
    ABSOLUTE: string;
    CLAMP_TO_GROUND: string;
    RELATIVE_TO_GROUND: string;
    RELATIVE_TO_MESH: string;
  };
}

declare global {
  interface Window {
    google?: { maps?: { importLibrary: (name: string) => Promise<unknown> } };
    __gmapsBootstrapReady?: () => void;
  }
}

let bootstrapPromise: Promise<void> | null = null;

function loadGoogleMaps(key: string): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = new Promise((resolve, reject) => {
    window.__gmapsBootstrapReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&v=beta&loading=async&callback=__gmapsBootstrapReady`;
    script.async = true;
    script.onerror = () => {
      bootstrapPromise = null;
      reject(new Error("Failed to load Google Maps JS API"));
    };
    document.head.appendChild(script);
  });
  return bootstrapPromise;
}

interface Map3DProps {
  campus: { center: [number, number]; zoom: number };
  buildings: Building[];
  selectedBuilding: Building | null;
  onBuildingSelect: (building: Building | null) => void;
  routeGeoJSON?: GeoJSON.FeatureCollection | null;
}

export default function Map3D({
  campus,
  buildings,
  selectedBuilding,
  onBuildingSelect,
  routeGeoJSON,
}: Map3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const map3dRef = useRef<Map3DElement | null>(null);
  const libRef = useRef<Maps3DLibrary | null>(null);
  const routeLineRef = useRef<HTMLElement | null>(null);
  const onBuildingSelectRef = useRef(onBuildingSelect);
  onBuildingSelectRef.current = onBuildingSelect;

  // Initialize the photorealistic 3D map once
  useEffect(() => {
    if (!API_KEY || !containerRef.current || map3dRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        await loadGoogleMaps(API_KEY);
        const lib = (await window.google!.maps!.importLibrary("maps3d")) as Maps3DLibrary;
        if (cancelled || !containerRef.current) return;
        libRef.current = lib;

        const map3d = new lib.Map3DElement({
          center: { lat: campus.center[1], lng: campus.center[0], altitude: 0 },
          range: 1500,
          tilt: 60,
          heading: 0,
          mode: lib.MapMode.HYBRID,
        });
        map3d.style.width = "100%";
        map3d.style.height = "100%";
        containerRef.current.appendChild(map3d);
        map3dRef.current = map3d;

        buildings.forEach((b) => {
          const marker = new lib.Marker3DInteractiveElement({
            position: { lat: b.coords[0], lng: b.coords[1] },
            label: b.shortName,
            altitudeMode: lib.AltitudeMode.RELATIVE_TO_MESH,
            extruded: true,
          });
          marker.addEventListener("gmp-click", () => onBuildingSelectRef.current(b));
          map3d.append(marker);
        });
      } catch (err) {
        console.error("Google Maps 3D failed to load:", err);
      }
    })();

    return () => {
      cancelled = true;
      map3dRef.current?.remove();
      map3dRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to selected building
  useEffect(() => {
    const map3d = map3dRef.current;
    if (!map3d || !selectedBuilding) return;
    map3d.flyCameraTo({
      endCamera: {
        center: {
          lat: selectedBuilding.coords[0],
          lng: selectedBuilding.coords[1],
          altitude: 0,
        },
        tilt: 65,
        range: 350,
      },
      durationMillis: 1500,
    });
  }, [selectedBuilding]);

  // Draw walking route as a ground-clamped 3D polyline
  useEffect(() => {
    const map3d = map3dRef.current;
    const lib = libRef.current;
    if (!map3d || !lib) return;

    routeLineRef.current?.remove();
    routeLineRef.current = null;

    const geometry = routeGeoJSON?.features?.[0]?.geometry;
    if (!geometry || geometry.type !== "LineString") return;

    const line = new lib.Polyline3DElement({
      coordinates: geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      strokeColor: "#6366f1",
      strokeWidth: 8,
      altitudeMode: lib.AltitudeMode.CLAMP_TO_GROUND,
      drawsOccludedSegments: true,
    });
    map3d.append(line);
    routeLineRef.current = line;
  }, [routeGeoJSON]);

  if (!API_KEY) {
    return (
      <div className="w-full h-full bg-[#eef4f0] flex items-center justify-center p-6">
        <div className="max-w-sm text-center flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "oklch(0.32 0.09 155)" }}
          >
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-stone-700">Google Maps API key required</p>
          <p className="text-xs text-stone-500 leading-relaxed">
            The 3D view uses Google&apos;s photorealistic 3D tiles. Create an API key in the
            Google Cloud Console (enable the <strong>Maps JavaScript API</strong>), then add{" "}
            <code className="bg-stone-200 rounded px-1 py-0.5">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
            </code>{" "}
            to <code className="bg-stone-200 rounded px-1 py-0.5">.env.local</code> and restart
            the dev server.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
