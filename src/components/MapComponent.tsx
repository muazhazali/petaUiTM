"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Building } from "@/types";

interface MapComponentProps {
  campus: { id: string; center: [number, number]; zoom: number; bounds: [[number, number], [number, number]] };
  buildings: Building[];
  selectedBuilding: Building | null;
  onBuildingSelect: (building: Building | null) => void;
  routeGeoJSON?: GeoJSON.FeatureCollection | null;
  fromBuilding?: Building | null;
  toBuilding?: Building | null;
}

export default function MapComponent({
  campus,
  buildings,
  selectedBuilding,
  onBuildingSelect,
  routeGeoJSON,
  fromBuilding,
  toBuilding,
}: MapComponentProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fromMarkerRef = useRef<maplibregl.Marker | null>(null);
  const toMarkerRef = useRef<maplibregl.Marker | null>(null);

  const handleBuildingClick = useCallback(
    (buildingId: string) => {
      const building = buildings.find((b) => b.id === buildingId);
      if (building) onBuildingSelect(building);
    },
    [buildings, onBuildingSelect]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: {
          "carto-light": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
          },
        },
        layers: [
          { id: "carto-light-layer", type: "raster", source: "carto-light" },
        ],
      } as maplibregl.StyleSpecification,
      center: campus.center,
      zoom: campus.zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "bottom-right"
    );

    map.on("load", () => {
      const features = buildings.map((b) => ({
        type: "Feature" as const,
        id: b.id,
        properties: { id: b.id, name: b.name, shortName: b.shortName },
        geometry: {
          type: "Polygon" as const,
          coordinates: [b.polygon],
        },
      }));

      map.addSource("buildings", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
        promoteId: "id",
      });

      map.addLayer({
        id: "buildings-fill",
        type: "fill",
        source: "buildings",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#6366f1",
            "#818cf8",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.7,
            0.45,
          ],
        },
      });

      map.addLayer({
        id: "buildings-outline",
        type: "line",
        source: "buildings",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#4f46e5",
            "#6366f1",
          ],
          "line-width": 2,
        },
      });

      map.addLayer({
        id: "buildings-label",
        type: "symbol",
        source: "buildings",
        layout: {
          "text-field": ["get", "shortName"],
          "text-size": 12,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#4338ca",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
        minzoom: 15,
      });

      // Route source (empty initially)
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#6366f1", "line-width": 5, "line-opacity": 0.9 },
      });

      // Hover state
      let hoveredId: string | null = null;
      map.on("mousemove", "buildings-fill", (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredId) {
            map.setFeatureState({ source: "buildings", id: hoveredId }, { hover: false });
          }
          hoveredId = e.features[0].properties?.id ?? null;
          if (hoveredId) {
            map.setFeatureState({ source: "buildings", id: hoveredId }, { hover: true });
          }
          map.getCanvas().style.cursor = "pointer";
        }
      });

      map.on("mouseleave", "buildings-fill", () => {
        if (hoveredId) {
          map.setFeatureState({ source: "buildings", id: hoveredId }, { hover: false });
        }
        hoveredId = null;
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "buildings-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const id = e.features[0].properties?.id;
          if (id) handleBuildingClick(id);
        }
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["buildings-fill"],
        });
        if (features.length === 0) onBuildingSelect(null);
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update route when routeGeoJSON changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (source && routeGeoJSON) {
      source.setData(routeGeoJSON);
    } else if (source) {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [routeGeoJSON]);

  // Pan to selected building
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBuilding) return;
    map.flyTo({
      center: [selectedBuilding.coords[1], selectedBuilding.coords[0]],
      zoom: Math.max(map.getZoom(), 17),
      duration: 800,
    });
  }, [selectedBuilding]);

  // From marker (green)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    fromMarkerRef.current?.remove();
    fromMarkerRef.current = null;
    if (fromBuilding) {
      const el = document.createElement("div");
      el.className = "w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white shadow-lg shadow-emerald-500/40";
      fromMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([fromBuilding.coords[1], fromBuilding.coords[0]])
        .addTo(map);
      map.flyTo({ center: [fromBuilding.coords[1], fromBuilding.coords[0]], zoom: Math.max(map.getZoom(), 16), duration: 600 });
    }
  }, [fromBuilding]);

  // To marker (red)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    toMarkerRef.current?.remove();
    toMarkerRef.current = null;
    if (toBuilding) {
      const el = document.createElement("div");
      el.className = "w-5 h-5 rounded-full bg-rose-500 border-[3px] border-white shadow-lg shadow-rose-500/40";
      toMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([toBuilding.coords[1], toBuilding.coords[0]])
        .addTo(map);
      map.flyTo({ center: [toBuilding.coords[1], toBuilding.coords[0]], zoom: Math.max(map.getZoom(), 16), duration: 600 });
    }
  }, [toBuilding]);

  return <div ref={containerRef} className="w-full h-full" />;
}
