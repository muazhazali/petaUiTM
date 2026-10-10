"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { Building, POI, POICategory, Waypoint } from "@/types";
import { POI_COLORS, poiIconMarkup } from "@/lib/poi";

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface MapComponentProps {
  campus: { id: string; center: [number, number]; zoom: number; bounds: [[number, number], [number, number]] };
  buildings: Building[];
  selectedBuilding: Building | null;
  onBuildingSelect: (building: Building | null) => void;
  routeGeoJSON?: GeoJSON.FeatureCollection | null;
  fromBuilding?: Waypoint | null;
  toBuilding?: Waypoint | null;
  pois?: POI[];
  activeCategories?: Set<POICategory>;
  onDirectionsTo?: (point: Waypoint) => void;
}

const SELECTED_STYLE = { color: "#17245B", weight: 2.5, fillColor: "#5B267B", fillOpacity: 0.7 };
const DEFAULT_STYLE = { color: "#374C9E", weight: 2, fillColor: "#8A96CB", fillOpacity: 0.45 };

export default function MapComponent({
  campus,
  buildings,
  selectedBuilding,
  onBuildingSelect,
  routeGeoJSON,
  fromBuilding,
  toBuilding,
  pois = [],
  activeCategories,
  onDirectionsTo,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buildingsLayerRef = useRef<L.GeoJSON | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const routeCoreRef = useRef<L.GeoJSON | null>(null);
  const fromMarkerRef = useRef<L.Marker | null>(null);
  const toMarkerRef = useRef<L.Marker | null>(null);
  const locateMarkerRef = useRef<L.CircleMarker | null>(null);
  const poiMarkersRef = useRef<L.Marker[]>([]);
  const buildingMarkersRef = useRef<L.Marker[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const directionsToRef = useRef<MapComponentProps["onDirectionsTo"]>(undefined);

  useEffect(() => {
    directionsToRef.current = onDirectionsTo;
  }, [onDirectionsTo]);

  const handleBuildingClick = useCallback(
    (buildingId: string) => {
      const building = buildings.find((b) => b.id === buildingId);
      if (building) onBuildingSelect(building);
    },
    [buildings, onBuildingSelect]
  );

  useEffect(() => {
    selectedIdRef.current = selectedBuilding?.id ?? null;
  }, [selectedBuilding]);

  // ── init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [campus.center[1], campus.center[0]], // [lng,lat] → [lat,lng]
      zoom: campus.zoom,
      zoomControl: false,
    });

    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTR }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const LocateControl = L.Control.extend({
      onAdd() {
        const el = L.DomUtil.create("div", "leaflet-bar leaflet-control map-locate-btn");
        el.innerHTML =
          '<a href="#" role="button" title="Show my location" aria-label="Show my location" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>' +
          "</a>";
        L.DomEvent.on(el, "click", (e: Event) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          map.locate({ setView: true, enableHighAccuracy: true, maxZoom: 17 });
        });
        return el;
      },
    });
    new (LocateControl as unknown as new (opts?: L.ControlOptions) => L.Control)({
      position: "bottomright",
    }).addTo(map);

    map.on("locationfound", (e: L.LocationEvent) => {
      locateMarkerRef.current?.remove();
      locateMarkerRef.current = L.circleMarker(e.latlng, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#17245B",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    });

    // Building polygons
    const features = buildings.map((b) => ({
      type: "Feature" as const,
      properties: { id: b.id, name: b.name, shortName: b.shortName },
      geometry: {
        type: "Polygon" as const,
        coordinates: [b.polygon],
      },
    }));

    type BLayer = L.Path & { feature?: GeoJSON.Feature };
    const styleFor = (id: string | undefined, hovered: boolean) => {
      const base = id === selectedIdRef.current ? SELECTED_STYLE : DEFAULT_STYLE;
      return hovered
        ? { ...base, fillColor: id === selectedIdRef.current ? SELECTED_STYLE.fillColor : "#AF8ACF", fillOpacity: 0.7 }
        : base;
    };

    const buildingsLayer = L.geoJSON(
      { type: "FeatureCollection", features } as GeoJSON.FeatureCollection,
      {
        style: DEFAULT_STYLE,
        onEachFeature: (feature, layer) => {
          const path = layer as BLayer;
          path.setStyle(styleFor(feature.properties?.id, false));
          path.on("mouseover", () => {
            path.setStyle(styleFor(feature.properties?.id, true));
            path.bringToFront();
            map.getContainer().style.cursor = "pointer";
          });
          path.on("mouseout", () => {
            path.setStyle(styleFor(feature.properties?.id, false));
            map.getContainer().style.cursor = "";
          });
          path.on("click", () => {
            handleBuildingClick(feature.properties?.id as string);
          });
        },
      }
    ).addTo(map);
    buildingsLayerRef.current = buildingsLayer;

    // Route layer (non-interactive so clicks pass through)
    // Purple casing under a yellow core, matching the UiTM accent pair.
    // Rendered above building polygons so the trail stays visible.
    const routeLayer = L.geoJSON(
      { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection,
      {
        style: { color: "#5B267B", weight: 7, opacity: 0.95 },
        interactive: false,
      }
    ).addTo(map);
    const routeCore = L.geoJSON(
      { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection,
      {
        style: { color: "#F5BF32", weight: 4.5, opacity: 1 },
        interactive: false,
      }
    ).addTo(map);
    routeLayer.bringToFront();
    routeCore.bringToFront();
    routeCoreRef.current = routeCore;
    routeLayerRef.current = routeLayer;

    // Building pill markers
    buildings.forEach((b) => {
      const pillHtml = `<div class="marker-pill" data-building-id="${b.id}" style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;color:white;background:#17245B;border:1.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);white-space:nowrap;user-select:none;cursor:pointer;transition:background 0.15s">${b.shortName}</div>`;

      const marker = L.marker([b.coords[0], b.coords[1]], {
        icon: L.divIcon({ className: "marker-pill-wrapper", html: pillHtml }),
        keyboard: false,
      }).addTo(map);

      marker.on("click", () => {
        handleBuildingClick(b.id);
      });

      buildingMarkersRef.current.push(marker);
    });

    // Deselect on background click (skip clicks that bubbled from buildings/pills)
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (e.propagatedFrom) return;
      onBuildingSelect(null);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      buildingsLayerRef.current = null;
      routeLayerRef.current = null;
      routeCoreRef.current = null;
      fromMarkerRef.current = null;
      toMarkerRef.current = null;
      locateMarkerRef.current = null;
      poiMarkersRef.current = [];
      buildingMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySelectedStyle = useCallback(() => {
    const layer = buildingsLayerRef.current;
    if (!layer) return;
    layer.eachLayer((sub) => {
      const path = sub as L.Path & { feature?: GeoJSON.Feature };
      const id = path.feature?.properties?.id;
      path.setStyle(id === selectedIdRef.current ? SELECTED_STYLE : DEFAULT_STYLE);
    });
  }, []);

  // Update selected building styles
  useEffect(() => {
    applySelectedStyle();
  }, [selectedBuilding, applySelectedStyle]);

  // Update route when routeGeoJSON changes
  useEffect(() => {
    const layer = routeLayerRef.current;
    const core = routeCoreRef.current;
    if (!layer || !core) return;
    layer.clearLayers();
    core.clearLayers();
    if (routeGeoJSON) {
      layer.addData(routeGeoJSON);
      core.addData(routeGeoJSON);
      // keep the trail above building polygons: casing first, yellow core on top
      layer.eachLayer((sub) => (sub as L.Polyline).bringToFront());
      core.eachLayer((sub) => (sub as L.Polyline).bringToFront());
    }
  }, [routeGeoJSON]);

  // Pan to selected building
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBuilding) return;
    map.flyTo(
      [selectedBuilding.coords[0], selectedBuilding.coords[1]],
      Math.max(map.getZoom(), 17),
      { duration: 0.8 }
    );
  }, [selectedBuilding]);

  // Update building pill selected state
  useEffect(() => {
    buildingMarkersRef.current.forEach((marker) => {
      const pill = marker.getElement()?.querySelector<HTMLElement>(".marker-pill");
      if (!pill) return;
      if (pill.dataset.buildingId === selectedBuilding?.id) {
        pill.style.background = "#5B267B";
        pill.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
        (pill.parentElement ?? pill).style.zIndex = "1000";
      } else {
        pill.style.background = "#17245B";
        pill.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
        (pill.parentElement ?? pill).style.zIndex = "1";
      }
    });
  }, [selectedBuilding]);

  // From marker (green)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    fromMarkerRef.current?.remove();
    fromMarkerRef.current = null;
    if (fromBuilding) {
      fromMarkerRef.current = L.marker(
        [fromBuilding.coords[0], fromBuilding.coords[1]],
        {
          icon: L.divIcon({
            className: "marker-dot-wrapper",
            html: '<div class="w-5 h-5 rounded-full bg-[#F5BF32] border-[3px] border-[#17245B] shadow-lg"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
          interactive: false,
          keyboard: false,
        }
      ).addTo(map);
    }
  }, [fromBuilding]);

  // To marker (red)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    toMarkerRef.current?.remove();
    toMarkerRef.current = null;
    if (toBuilding) {
      toMarkerRef.current = L.marker(
        [toBuilding.coords[0], toBuilding.coords[1]],
        {
          icon: L.divIcon({
            className: "marker-dot-wrapper",
            html: '<div class="w-5 h-5 rounded-full bg-[#5B267B] border-[3px] border-white shadow-lg"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
          interactive: false,
          keyboard: false,
        }
      ).addTo(map);
    }
  }, [toBuilding]);

  // Fit both waypoints in view in a single move (avoids racing flyTo calls)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (fromBuilding && toBuilding) {
      const bounds = L.latLngBounds(
        [fromBuilding.coords[0], fromBuilding.coords[1]],
        [toBuilding.coords[0], toBuilding.coords[1]]
      );
      map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8, maxZoom: 17 });
    } else if (fromBuilding) {
      map.flyTo([fromBuilding.coords[0], fromBuilding.coords[1]], Math.max(map.getZoom(), 16), { duration: 0.6 });
    } else if (toBuilding) {
      map.flyTo([toBuilding.coords[0], toBuilding.coords[1]], Math.max(map.getZoom(), 16), { duration: 0.6 });
    }
  }, [fromBuilding, toBuilding]);

  // POI markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];

    const visiblePois = activeCategories
      ? pois.filter((p) => activeCategories.has(p.category))
      : [];

    visiblePois.forEach((poi) => {
      const marker = L.marker([poi.coords[0], poi.coords[1]], {
        icon: L.divIcon({
          className: "marker-poi-wrapper",
          html: `<div title="${poi.name}" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.2);cursor:pointer;user-select:none;background:${POI_COLORS[poi.category] ?? "#374C9E"}">${poiIconMarkup(poi.category)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
        keyboard: false,
      }).addTo(map);

      marker.bindPopup(
        L.popup({
          offset: [0, -18],
          closeButton: false,
          maxWidth: 220,
        }).setContent(
          `<div style="font-family:sans-serif;padding:4px 2px">
            <div style="font-weight:600;font-size:13px;color:#111">${poi.name}</div>
            ${poi.description ? `<div style="font-size:11px;color:#666;margin-top:2px">${poi.description}</div>` : ""}
            <button type="button" class="poi-directions-btn" data-poi-id="${poi.id}" style="margin-top:8px;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:8px;border:0;background:#F5BF32;color:#17245B;font-size:11px;font-weight:600;cursor:pointer">Directions</button>
          </div>`
        )
      );

      poiMarkersRef.current.push(marker);
    });
  }, [pois, activeCategories]);

  // Delegate POI popup "Directions" clicks to the consumer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    const handler = (e: Event) => {
      const target = (e.target as HTMLElement)?.closest?.(".poi-directions-btn") as HTMLElement | null;
      if (!target) return;
      const poiId = target.dataset.poiId;
      const poi = pois.find((p) => p.id === poiId);
      if (poi && directionsToRef.current) {
        directionsToRef.current({ id: poi.id, name: poi.name, coords: poi.coords });
      }
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [pois]);

  return <div ref={containerRef} className="w-full h-full" />;
}