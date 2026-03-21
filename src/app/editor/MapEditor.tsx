"use client";

import "./editor.css";
import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Building } from "@/types";
import {
  Download, Plus, Trash2, ChevronDown, ChevronRight,
  MapPin, Edit3, Undo2, Redo2, Check, X, Pencil, MousePointer2, HelpCircle,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function openRing(pts: [number, number][]): [number, number][] {
  if (pts.length < 2) return pts;
  const f = pts[0], l = pts[pts.length - 1];
  return f[0] === l[0] && f[1] === l[1] ? pts.slice(0, -1) : pts;
}

function closedRing(pts: [number, number][]): [number, number][] {
  if (pts.length < 2) return pts;
  const f = pts[0], l = pts[pts.length - 1];
  return f[0] === l[0] && f[1] === l[1] ? pts : [...pts, f];
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function centroid(pts: [number, number][]): [number, number] {
  const open = openRing(pts);
  if (!open.length) return [0, 0];
  return [
    open.reduce((s, p) => s + p[0], 0) / open.length,
    open.reduce((s, p) => s + p[1], 0) / open.length,
  ];
}

function newBuilding(campus: string): Building {
  return {
    id: `${campus}-building-${Date.now()}`,
    campus,
    name: "New Building",
    shortName: "NEW",
    coords: [3.0708, 101.4998],
    polygon: [],
    floors: 1,
    facilities: [],
    hours: "8:00–17:00",
    description: "",
  };
}

// ─── GeoJSON builders ─────────────────────────────────────────────────────────

function buildingsGeoJSON(buildings: Building[], selId: string | null, editId: string | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: buildings.filter((b) => b.polygon.length >= 3).map((b) => ({
      type: "Feature", id: b.id,
      properties: { id: b.id, name: b.name, shortName: b.shortName, selected: +(b.id === selId), editing: +(b.id === editId) },
      geometry: { type: "Polygon", coordinates: [closedRing(b.polygon)] },
    })),
  };
}

function verticesGeoJSON(pts: [number, number][], hov: number | null): GeoJSON.FeatureCollection {
  const open = openRing(pts);
  return {
    type: "FeatureCollection",
    features: open.map(([lng, lat], i) => ({
      type: "Feature", id: i,
      properties: { idx: i, hovered: +(hov === i) },
      geometry: { type: "Point", coordinates: [lng, lat] },
    })),
  };
}

function midpointsGeoJSON(pts: [number, number][], hov: number | null): GeoJSON.FeatureCollection {
  const open = openRing(pts);
  if (open.length < 2) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: open.map((p, i) => {
      const next = (i + 1) % open.length;
      const [lng, lat] = midpoint(p, open[next]);
      return {
        type: "Feature", id: i,
        properties: { edgeIdx: i, hovered: +(hov === i) },
        geometry: { type: "Point", coordinates: [lng, lat] },
      };
    }),
  };
}

function editRingGeoJSON(pts: [number, number][]): GeoJSON.FeatureCollection {
  if (pts.length < 2) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: closedRing(pts) } }],
  };
}

function drawPreviewGeoJSON(pts: [number, number][], cursor: [number, number] | null): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const all = cursor ? [...pts, cursor] : pts;
  if (all.length >= 2) features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: all } });
  if (pts.length >= 3) features.push({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [closedRing(pts)] } });
  return { type: "FeatureCollection", features };
}

// ─── component ────────────────────────────────────────────────────────────────

type EditorMode = "select" | "draw" | "edit";

export default function MapEditor() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const undoRef = useRef<Building[][]>([]);
  const redoRef = useRef<Building[][]>([]);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("select");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<[number, number] | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [fieldEdits, setFieldEdits] = useState<Partial<Building>>({});
  const [showGuide, setShowGuide] = useState(false);

  // live refs for use inside raw map event handlers
  const modeRef = useRef<EditorMode>("select");
  const selIdRef = useRef<string | null>(null);
  const buildingsRef = useRef<Building[]>([]);
  const drawPtsRef = useRef<[number, number][]>([]);
  const cursorRef = useRef<[number, number] | null>(null);
  const draggingRef = useRef<number | null>(null); // vertex index
  const hovVRef = useRef<number | null>(null);
  const hovMRef = useRef<number | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { selIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { buildingsRef.current = buildings; }, [buildings]);

  // ── undo ─────────────────────────────────────────────────────────────────

  const snap = (bs: Building[]) => bs.map((b) => ({ ...b, polygon: [...b.polygon] }));

  const pushUndo = useCallback((prev: Building[]) => {
    undoRef.current.push(snap(prev));
    redoRef.current = [];
    setCanUndo(true); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const s = undoRef.current.pop(); if (!s) return;
    redoRef.current.push(snap(buildingsRef.current));
    setBuildings(s); setCanUndo(undoRef.current.length > 0); setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const s = redoRef.current.pop(); if (!s) return;
    undoRef.current.push(snap(buildingsRef.current));
    setBuildings(s); setCanUndo(true); setCanRedo(redoRef.current.length > 0);
  }, []);

  // ── toast ─────────────────────────────────────────────────────────────────

  const showToast = (msg: string, ms = 2500) => {
    setToast(msg); setTimeout(() => setToast(null), ms);
  };

  // ── update buildings with undo ─────────────────────────────────────────────

  const updBuildings = useCallback((fn: (p: Building[]) => Building[], withUndo = true) => {
    setBuildings((prev) => { if (withUndo) pushUndo(prev); return fn(prev); });
  }, [pushUndo]);

  // ── refresh map ────────────────────────────────────────────────────────────

  const refreshMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const editId = modeRef.current !== "select" ? selIdRef.current : null;

    (map.getSource("buildings") as maplibregl.GeoJSONSource)?.setData(
      buildingsGeoJSON(buildingsRef.current, selIdRef.current, editId));

    const editB = editId ? buildingsRef.current.find((b) => b.id === editId) : null;
    const ring = modeRef.current === "draw" ? drawPtsRef.current : editB ? openRing(editB.polygon) : [];

    (map.getSource("edit-ring") as maplibregl.GeoJSONSource)?.setData(editRingGeoJSON(ring));
    (map.getSource("vertices") as maplibregl.GeoJSONSource)?.setData(
      modeRef.current !== "select" ? verticesGeoJSON(ring, hovVRef.current) : { type: "FeatureCollection", features: [] });
    (map.getSource("midpoints") as maplibregl.GeoJSONSource)?.setData(
      modeRef.current === "edit" ? midpointsGeoJSON(ring, hovMRef.current) : { type: "FeatureCollection", features: [] });
    (map.getSource("draw-preview") as maplibregl.GeoJSONSource)?.setData(
      modeRef.current === "draw" ? drawPreviewGeoJSON(drawPtsRef.current, cursorRef.current) : { type: "FeatureCollection", features: [] });
  }, []);

  // ── load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/data/buildings.json").then((r) => r.json()).then(setBuildings).catch(() => setBuildings([]));
  }, []);

  // ── init map ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: {
          carto: {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors © CARTO",
          },
        },
        layers: [{ id: "carto-layer", type: "raster", source: "carto" }],
      } as maplibregl.StyleSpecification,
      center: [101.4998, 3.0708],
      zoom: 16,
    });
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
      map.addSource("buildings", { type: "geojson", data: fc, promoteId: "id" });
      map.addSource("edit-ring", { type: "geojson", data: fc });
      map.addSource("draw-preview", { type: "geojson", data: fc });
      map.addSource("vertices", { type: "geojson", data: fc, promoteId: "id" });
      map.addSource("midpoints", { type: "geojson", data: fc, promoteId: "id" });

      // buildings
      map.addLayer({ id: "buildings-fill", type: "fill", source: "buildings", paint: {
        "fill-color": ["case", ["==", ["get", "editing"], 1], "#f59e0b", ["==", ["get", "selected"], 1], "#6366f1", "#818cf8"],
        "fill-opacity": ["case", ["==", ["get", "editing"], 1], 0.25, 0.38],
      }});
      map.addLayer({ id: "buildings-outline", type: "line", source: "buildings", paint: {
        "line-color": ["case", ["==", ["get", "editing"], 1], "#f59e0b", ["==", ["get", "selected"], 1], "#4f46e5", "#6366f1"],
        "line-width": ["case", ["==", ["get", "selected"], 1], 2.5, 1.5],
      }});
      map.addLayer({ id: "buildings-label", type: "symbol", source: "buildings", minzoom: 14,
        layout: { "text-field": ["get", "shortName"], "text-size": 11, "text-anchor": "center" },
        paint: { "text-color": "#312e81", "text-halo-color": "#fff", "text-halo-width": 2 },
      });

      // draw preview
      map.addLayer({ id: "draw-preview-fill", type: "fill", source: "draw-preview",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.12 },
      });
      map.addLayer({ id: "draw-preview-line", type: "line", source: "draw-preview",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "#f59e0b", "line-width": 2, "line-dasharray": [5, 3] },
      });

      // edit ring
      map.addLayer({ id: "edit-ring-line", type: "line", source: "edit-ring",
        paint: { "line-color": "#f59e0b", "line-width": 1.5, "line-dasharray": [4, 2] },
      });

      // midpoints
      map.addLayer({ id: "midpoints-layer", type: "circle", source: "midpoints", paint: {
        "circle-radius": ["case", ["==", ["get", "hovered"], 1], 6, 4],
        "circle-color": "#fff",
        "circle-stroke-width": ["case", ["==", ["get", "hovered"], 1], 2.5, 1.5],
        "circle-stroke-color": "#f59e0b",
        "circle-opacity": ["case", ["==", ["get", "hovered"], 1], 1, 0.55],
      }});

      // vertices
      map.addLayer({ id: "vertices-layer", type: "circle", source: "vertices", paint: {
        "circle-radius": ["case", ["==", ["get", "hovered"], 1], 8, 6],
        "circle-color": ["case", ["==", ["get", "hovered"], 1], "#ef4444", "#f59e0b"],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#fff",
      }});

      setMapLoaded(true);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── map interactions ───────────────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const onMove = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      setCursorCoords([lng, lat]);
      cursorRef.current = [lng, lat];
      const m = modeRef.current;

      if (m === "draw") { refreshMap(); map.getCanvas().style.cursor = "crosshair"; return; }

      if (m === "edit") {
        if (draggingRef.current !== null) {
          const id = selIdRef.current; if (!id) return;
          const idx = draggingRef.current;
          setBuildings((prev) => prev.map((b) => {
            if (b.id !== id) return b;
            const pts = openRing([...b.polygon]);
            pts[idx] = [lng, lat];
            return { ...b, polygon: pts, coords: [centroid(pts)[1], centroid(pts)[0]] };
          }));
          return;
        }
        const vf = map.queryRenderedFeatures(e.point, { layers: ["vertices-layer"] });
        if (vf.length) {
          const idx = vf[0].properties?.idx as number;
          if (hovVRef.current !== idx) { hovVRef.current = idx; hovMRef.current = null; refreshMap(); }
          map.getCanvas().style.cursor = "grab"; return;
        }
        const mf = map.queryRenderedFeatures(e.point, { layers: ["midpoints-layer"] });
        if (mf.length) {
          const ei = mf[0].properties?.edgeIdx as number;
          if (hovMRef.current !== ei) { hovMRef.current = ei; hovVRef.current = null; refreshMap(); }
          map.getCanvas().style.cursor = "copy"; return;
        }
        if (hovVRef.current !== null || hovMRef.current !== null) { hovVRef.current = null; hovMRef.current = null; refreshMap(); }
        map.getCanvas().style.cursor = "";
        return;
      }

      const bf = map.queryRenderedFeatures(e.point, { layers: ["buildings-fill"] });
      map.getCanvas().style.cursor = bf.length ? "pointer" : "";
    };

    const onDown = (e: maplibregl.MapMouseEvent) => {
      if (modeRef.current !== "edit") return;
      const vf = map.queryRenderedFeatures(e.point, { layers: ["vertices-layer"] });
      if (vf.length) {
        draggingRef.current = vf[0].properties?.idx as number;
        map.dragPan.disable();
        map.getCanvas().style.cursor = "grabbing";
        e.preventDefault();
      }
    };

    const onUp = () => {
      if (draggingRef.current !== null) {
        // commit the drag to undo stack
        const bs = buildingsRef.current;
        undoRef.current[undoRef.current.length - 1] = snap(bs); // overwrite last or push
        draggingRef.current = null;
        map.dragPan.enable();
        map.getCanvas().style.cursor = "grab";
        refreshMap();
      }
    };

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const m = modeRef.current;

      if (m === "draw") {
        drawPtsRef.current = [...drawPtsRef.current, [lng, lat]]; refreshMap(); return;
      }

      if (m === "edit") {
        if (draggingRef.current !== null) return;
        // click vertex → delete
        const vf = map.queryRenderedFeatures(e.point, { layers: ["vertices-layer"] });
        if (vf.length) {
          const idx = vf[0].properties?.idx as number;
          const id = selIdRef.current; if (!id) return;
          updBuildings((prev) => prev.map((b) => {
            if (b.id !== id) return b;
            const pts = openRing([...b.polygon]);
            if (pts.length <= 3) return b;
            pts.splice(idx, 1);
            return { ...b, polygon: pts };
          }));
          hovVRef.current = null; refreshMap(); return;
        }
        // click midpoint → insert
        const mf = map.queryRenderedFeatures(e.point, { layers: ["midpoints-layer"] });
        if (mf.length) {
          const ei = mf[0].properties?.edgeIdx as number;
          const id = selIdRef.current; if (!id) return;
          updBuildings((prev) => prev.map((b) => {
            if (b.id !== id) return b;
            const pts = openRing([...b.polygon]);
            const next = (ei + 1) % pts.length;
            pts.splice(ei + 1, 0, midpoint(pts[ei], pts[next]));
            return { ...b, polygon: pts };
          }));
          hovMRef.current = null; refreshMap(); return;
        }
        return;
      }

      // select mode
      const bf = map.queryRenderedFeatures(e.point, { layers: ["buildings-fill"] });
      if (bf.length) {
        const id = bf[0].properties?.id as string;
        selIdRef.current = id; setSelectedId(id); setExpandedId(id);
        const b = buildingsRef.current.find((b) => b.id === id);
        if (b) setFieldEdits({ name: b.name, shortName: b.shortName, floors: b.floors, hours: b.hours, description: b.description });
      } else {
        selIdRef.current = null; setSelectedId(null);
      }
      refreshMap();
    };

    const onDbl = (e: maplibregl.MapMouseEvent) => {
      if (modeRef.current !== "select") return;
      const bf = map.queryRenderedFeatures(e.point, { layers: ["buildings-fill"] });
      if (bf.length) {
        const id = bf[0].properties?.id as string;
        selIdRef.current = id; setSelectedId(id);
        setMode("edit"); modeRef.current = "edit"; refreshMap(); e.preventDefault();
      }
    };

    map.on("mousemove", onMove);
    map.on("mousedown", onDown);
    map.on("mouseup", onUp);
    map.on("click", onClick);
    map.on("dblclick", onDbl);
    return () => { map.off("mousemove", onMove); map.off("mousedown", onDown); map.off("mouseup", onUp); map.off("click", onClick); map.off("dblclick", onDbl); };
  }, [mapLoaded, updBuildings, refreshMap]);

  // ── keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Escape") {
        // close guide first if open
        setShowGuide((v) => { if (v) return false; return v; });
        if (modeRef.current === "draw") commitDraw(); else exitEdit();
      }
      if (e.key === "Enter" && modeRef.current === "draw") commitDraw();
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── sync buildings → map ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded) return;
    buildingsRef.current = buildings;
    refreshMap();
  }, [buildings, selectedId, mode, mapLoaded, refreshMap]);

  // ── editor actions ─────────────────────────────────────────────────────────

  const exitEdit = useCallback(() => {
    setMode("select"); modeRef.current = "select";
    hovVRef.current = null; hovMRef.current = null; draggingRef.current = null;
    mapRef.current?.dragPan.enable();
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
    refreshMap();
  }, [refreshMap]);

  const commitDraw = useCallback(() => {
    const pts = drawPtsRef.current; drawPtsRef.current = [];
    if (pts.length < 3) { exitEdit(); return; }
    const id = selIdRef.current;
    if (id) {
      updBuildings((prev) => prev.map((b) => {
        if (b.id !== id) return b;
        const c = centroid(pts);
        return { ...b, polygon: pts, coords: [c[1], c[0]] };
      }));
      setMode("edit"); modeRef.current = "edit";
    } else { exitEdit(); }
    refreshMap();
  }, [exitEdit, updBuildings, refreshMap]);

  const startDraw = useCallback((id: string) => {
    selIdRef.current = id; setSelectedId(id); setExpandedId(id);
    const b = buildingsRef.current.find((b) => b.id === id);
    drawPtsRef.current = b ? openRing([...b.polygon]) : [];
    setMode("draw"); modeRef.current = "draw"; refreshMap();
    showToast("Click to place vertices — Enter / Esc to finish");
  }, [refreshMap]);

  const startEdit = useCallback((id: string) => {
    selIdRef.current = id; setSelectedId(id); setExpandedId(id);
    setMode("edit"); modeRef.current = "edit";
    hovVRef.current = null; hovMRef.current = null; refreshMap();
  }, [refreshMap]);

  const addBuilding = () => {
    const b = newBuilding("shah-alam");
    pushUndo(buildingsRef.current);
    setBuildings((prev) => [...prev, b]);
    setFieldEdits({ name: b.name, shortName: b.shortName, floors: b.floors, hours: b.hours, description: b.description });
    startDraw(b.id);
    setCanUndo(true);
  };

  const deleteBuilding = (id: string) => {
    updBuildings((prev) => prev.filter((b) => b.id !== id));
    if (selIdRef.current === id) { selIdRef.current = null; setSelectedId(null); exitEdit(); }
    if (expandedId === id) setExpandedId(null);
  };

  const clearPolygon = (id: string) => {
    updBuildings((prev) => prev.map((b) => b.id === id ? { ...b, polygon: [] } : b));
    if (selIdRef.current === id) exitEdit();
  };

  const saveFields = (id: string) => {
    setBuildings((prev) => prev.map((b) => b.id !== id ? b : {
      ...b,
      name: fieldEdits.name ?? b.name,
      shortName: fieldEdits.shortName ?? b.shortName,
      floors: Number(fieldEdits.floors ?? b.floors),
      hours: fieldEdits.hours ?? b.hours,
      description: fieldEdits.description ?? b.description,
    }));
  };

  const flyTo = (b: Building) => {
    const map = mapRef.current; if (!map) return;
    const pts = openRing(b.polygon);
    const c = pts.length >= 2 ? centroid(pts) : [b.coords[1], b.coords[0]] as [number, number];
    map.flyTo({ center: c, zoom: 18, duration: 500 });
  };

  const downloadJSON = () => {
    const clean = buildings.map((b) => ({ ...b, polygon: openRing(b.polygon) }));
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "buildings.json" }).click();
    URL.revokeObjectURL(url);
    showToast("Downloaded buildings.json");
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(buildings.map((b) => ({ ...b, polygon: openRing(b.polygon) })), null, 2));
    showToast("Copied to clipboard");
  };

  // ── render ─────────────────────────────────────────────────────────────────

  const selected = buildings.find((b) => b.id === selectedId);

  return (
    <div className="editor-shell">

      {/* ══ sidebar ══ */}
      <aside className="editor-sidebar">

        <div className="editor-sidebar-header">
          <div className="title">
            <div className="editor-icon-box"><MapPin size={14} /></div>
            Map Editor
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="editor-help-btn" onClick={() => setShowGuide(true)}>
              <HelpCircle size={12} /> Guide
            </button>
            <a href="/" className="editor-exit-link">← Exit</a>
          </div>
        </div>

        <div className="editor-toolbar">
          <button className="editor-btn-primary" onClick={addBuilding}>
            <Plus size={14} /> New Building
          </button>
          <button className="editor-icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
          <button className="editor-icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 size={14} /></button>
          <button className="editor-icon-btn success" onClick={downloadJSON} title="Download JSON"><Download size={14} /></button>
        </div>

        <div className="editor-building-list">
          {buildings.length === 0 && (
            <div className="editor-empty">No buildings.<br /><span>New Building</span> to start.</div>
          )}
          {buildings.map((b) => {
            const isSel = b.id === selectedId;
            const isExp = b.id === expandedId;
            const isDraw = isSel && mode === "draw";
            const isEdit = isSel && mode === "edit";

            return (
              <div key={b.id} className="editor-building-row">
                <div
                  className={`editor-building-item${isSel ? " selected" : ""}`}
                  onClick={() => {
                    selIdRef.current = b.id; setSelectedId(b.id);
                    setExpandedId(isExp ? null : b.id);
                    setFieldEdits({ name: b.name, shortName: b.shortName, floors: b.floors, hours: b.hours, description: b.description });
                    flyTo(b); refreshMap();
                  }}
                >
                  <button className="editor-building-chevron" onClick={(e) => { e.stopPropagation(); setExpandedId(isExp ? null : b.id); }}>
                    {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>

                  <div className="editor-building-info">
                    <div className={`editor-building-name${isSel ? " sel" : ""}`}>{b.name}</div>
                    <div className="editor-building-meta">{b.shortName} · {openRing(b.polygon).length} pts</div>
                  </div>

                  {isDraw && <span className="editor-mode-badge draw">DRAW</span>}
                  {isEdit && <span className="editor-mode-badge edit">EDIT</span>}

                  <div className="editor-building-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`editor-building-act-btn draw${isDraw ? " active-draw" : ""}`}
                      title="Draw polygon"
                      onClick={() => isDraw ? commitDraw() : startDraw(b.id)}
                    ><Pencil size={12} /></button>
                    <button
                      className={`editor-building-act-btn edit${isEdit ? " active-edit" : ""}`}
                      title="Edit vertices"
                      onClick={() => isEdit ? exitEdit() : startEdit(b.id)}
                    ><Edit3 size={12} /></button>
                    <button
                      className="editor-building-act-btn del"
                      title="Delete"
                      onClick={() => deleteBuilding(b.id)}
                    ><Trash2 size={12} /></button>
                  </div>
                </div>

                {isExp && (
                  <div className="editor-expanded" onClick={(e) => e.stopPropagation()}>
                    <div className="editor-field">
                      <label>Name</label>
                      <input value={fieldEdits.name ?? b.name}
                        onChange={(e) => setFieldEdits((f) => ({ ...f, name: e.target.value }))}
                        onBlur={() => saveFields(b.id)} />
                    </div>
                    <div className="editor-field-row">
                      <div className="editor-field">
                        <label>Short Name</label>
                        <input value={fieldEdits.shortName ?? b.shortName}
                          onChange={(e) => setFieldEdits((f) => ({ ...f, shortName: e.target.value }))}
                          onBlur={() => saveFields(b.id)} />
                      </div>
                      <div className="editor-field">
                        <label>Floors</label>
                        <input type="number" value={String(fieldEdits.floors ?? b.floors)}
                          onChange={(e) => setFieldEdits((f) => ({ ...f, floors: Number(e.target.value) }))}
                          onBlur={() => saveFields(b.id)} />
                      </div>
                    </div>
                    <div className="editor-field">
                      <label>Hours</label>
                      <input value={fieldEdits.hours ?? b.hours}
                        onChange={(e) => setFieldEdits((f) => ({ ...f, hours: e.target.value }))}
                        onBlur={() => saveFields(b.id)} />
                    </div>
                    <div className="editor-field">
                      <label>Description</label>
                      <input value={fieldEdits.description ?? b.description ?? ""}
                        onChange={(e) => setFieldEdits((f) => ({ ...f, description: e.target.value }))}
                        onBlur={() => saveFields(b.id)} />
                    </div>

                    <div className="editor-polygon-actions">
                      <button
                        className={`editor-poly-btn draw${isDraw ? " draw-active" : ""}`}
                        onClick={() => isDraw ? commitDraw() : startDraw(b.id)}
                      ><Pencil size={10} />{isDraw ? "Finish" : "Draw"}</button>
                      <button
                        className={`editor-poly-btn edit${isEdit ? " edit-active" : ""}`}
                        onClick={() => isEdit ? exitEdit() : startEdit(b.id)}
                      ><Edit3 size={10} />{isEdit ? "Done" : "Edit"}</button>
                      <button className="editor-poly-btn clear" onClick={() => clearPolygon(b.id)}>Clear</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="editor-footer">
          <div className="editor-hints">
            <div><span>Pencil</span> → click to place vertices, <kbd>Enter</kbd>/<kbd>Esc</kbd> finish</div>
            <div><span>Edit</span> → drag to move · click <span style={{ color: "var(--e-rose)" }}>red vertex</span> to delete · click edge dot to insert</div>
            <div><span>Dbl-click</span> building for quick edit · <kbd>Ctrl+Z</kbd> undo</div>
          </div>
          <div className="editor-footer-btns">
            <button className="editor-btn-download" onClick={downloadJSON}><Download size={12} /> Download JSON</button>
            <button className="editor-btn-copy" onClick={copyJSON}>Copy</button>
          </div>
        </div>
      </aside>

      {/* ══ map ══ */}
      <div className="editor-map-area">
        <div ref={containerRef} className="editor-map-container" />

        {/* mode pill */}
        <div className={`editor-mode-pill ${mode}`}>
          {mode === "select" && <MousePointer2 size={12} />}
          {mode === "draw"   && <Pencil size={12} />}
          {mode === "edit"   && <Edit3 size={12} />}
          {{ select: "Select", draw: "Draw", edit: "Edit Vertices" }[mode]}
          {selected && mode !== "select" && <span style={{ opacity: 0.6 }}>— {selected.shortName}</span>}
          {mode !== "select" && (
            <button onClick={mode === "draw" ? commitDraw : exitEdit} title="Finish / exit">
              {mode === "draw" ? <Check size={11} /> : <X size={11} />}
            </button>
          )}
        </div>

        {/* hint bar */}
        {mode === "draw" && (
          <div className="editor-hint-bar">
            <span className="hl-amber">Drawing polygon</span>
            <span>click to add vertices</span>
            <span className="dot">·</span>
            <kbd>Enter</kbd> <span>finish</span>
            <span className="dot">·</span>
            <kbd>Esc</kbd> <span>cancel</span>
          </div>
        )}
        {mode === "edit" && (
          <div className="editor-hint-bar">
            <span className="hl-indigo">Editing vertices</span>
            <span>drag to move</span>
            <span className="dot">·</span>
            <span>click <span className="hl-red">red</span> to delete</span>
            <span className="dot">·</span>
            <span>click <span className="hl-white">ring dot</span> to insert</span>
            <span className="dot">·</span>
            <kbd>Esc</kbd> <span>done</span>
          </div>
        )}

        {/* coordinates */}
        {cursorCoords && (
          <div className="editor-coords">
            {cursorCoords[1].toFixed(6)}, {cursorCoords[0].toFixed(6)}
          </div>
        )}

        {/* selection pill */}
        {selected && mode === "select" && (
          <div className="editor-sel-pill">
            <span className="name">{selected.shortName}</span>
            <span style={{ color: "var(--e-text3)" }}>{selected.name}</span>
            <span className="meta">{openRing(selected.polygon).length} vertices</span>
            <button className="edit-btn" onClick={() => startEdit(selected.id)}>Edit vertices →</button>
            <button className="draw-btn" onClick={() => startDraw(selected.id)}>Redraw →</button>
          </div>
        )}
      </div>

      {toast && <div className="editor-toast">{toast}</div>}

      {/* ══ guide overlay ══ */}
      {showGuide && (
        <div className="editor-guide-backdrop" onClick={() => setShowGuide(false)}>
          <div className="editor-guide-panel" onClick={(e) => e.stopPropagation()}>
            <div className="editor-guide-header">
              <h2><HelpCircle size={16} style={{ color: "var(--e-green)" }} /> How to use the Map Editor</h2>
              <button className="editor-guide-close" onClick={() => setShowGuide(false)}><X size={14} /></button>
            </div>

            <div className="editor-guide-body">

              {/* workflow */}
              <div className="editor-guide-section">
                <h3>Workflow</h3>
                <div className="editor-guide-steps">
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-num">1</div>
                    <div className="editor-guide-step-body">
                      <strong>Select a building</strong>
                      <p>Click any polygon on the map to select it. A pill appears at the bottom showing its name and vertex count.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-num">2</div>
                    <div className="editor-guide-step-body">
                      <strong>Edit its vertices <span className="editor-guide-tag indigo">Edit mode</span></strong>
                      <p>Click <em>"Edit vertices →"</em> in the bottom pill, or <strong>double-click</strong> the building. Yellow dots appear on each vertex — drag them to reshape. Small ring dots on each edge midpoint can be clicked to insert a new vertex. Click a <span style={{ color: "#ef4444" }}>red (hovered) vertex</span> to delete it.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-num">3</div>
                    <div className="editor-guide-step-body">
                      <strong>Redraw from scratch <span className="editor-guide-tag amber">Draw mode</span></strong>
                      <p>Click <em>"Redraw →"</em> or the pencil icon. Click on the map to place vertices one by one — a live preview shows the polygon forming. Press <span className="editor-guide-kbd">Enter</span> or <span className="editor-guide-kbd">Esc</span> when done. It automatically switches to Edit mode so you can refine.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-num">4</div>
                    <div className="editor-guide-step-body">
                      <strong>Edit building details</strong>
                      <p>Click the <strong>▶ chevron</strong> next to any building in the sidebar to expand it. Edit Name, Short Name, Floors, Hours, and Description. Changes save automatically when you click away.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-num">5</div>
                    <div className="editor-guide-step-body">
                      <strong>Add a new building</strong>
                      <p>Click <strong>+ New Building</strong> in the toolbar. It immediately enters Draw mode — click the map to define the polygon, then press <span className="editor-guide-kbd">Enter</span> to finish. Fill in details by expanding the building row.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-num">6</div>
                    <div className="editor-guide-step-body">
                      <strong>Save your work <span className="editor-guide-tag emerald">Export</span></strong>
                      <p>Click <strong>Download JSON</strong> to save <code style={{ background: "#1a1a1f", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>buildings.json</code> to your computer. Copy the downloaded file to <code style={{ background: "#1a1a1f", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>public/data/buildings.json</code> in the project. The main map will reflect your changes immediately.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editor-guide-divider" />

              {/* edit mode detail */}
              <div className="editor-guide-section">
                <h3>Edit mode — vertex interactions</h3>
                <div className="editor-guide-steps">
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-body">
                      <strong>Move a vertex</strong>
                      <p>Click and drag any <span style={{ color: "var(--e-amber)" }}>yellow dot</span>. The polygon updates live as you drag.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-body">
                      <strong>Delete a vertex</strong>
                      <p>Hover a yellow dot until it turns <span style={{ color: "var(--e-rose)" }}>red</span>, then click it. Minimum 3 vertices — the last three cannot be deleted.</p>
                    </div>
                  </div>
                  <div className="editor-guide-step">
                    <div className="editor-guide-step-body">
                      <strong>Insert a vertex</strong>
                      <p>Click any small <span style={{ color: "var(--e-text2)", fontWeight: 600 }}>ring dot</span> on the midpoint of each edge. A new vertex is inserted at that position.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editor-guide-divider" />

              {/* shortcuts */}
              <div className="editor-guide-section">
                <h3>Keyboard shortcuts</h3>
                <div className="editor-guide-shortcuts">
                  <div className="editor-guide-shortcut">
                    <span>Undo</span>
                    <div className="keys"><span className="editor-guide-kbd">Ctrl</span><span className="editor-guide-kbd">Z</span></div>
                  </div>
                  <div className="editor-guide-shortcut">
                    <span>Redo</span>
                    <div className="keys"><span className="editor-guide-kbd">Ctrl</span><span className="editor-guide-kbd">Shift</span><span className="editor-guide-kbd">Z</span></div>
                  </div>
                  <div className="editor-guide-shortcut">
                    <span>Finish draw</span>
                    <div className="keys"><span className="editor-guide-kbd">Enter</span></div>
                  </div>
                  <div className="editor-guide-shortcut">
                    <span>Cancel / exit mode</span>
                    <div className="keys"><span className="editor-guide-kbd">Esc</span></div>
                  </div>
                  <div className="editor-guide-shortcut">
                    <span>Quick-edit polygon</span>
                    <span style={{ fontSize: 11, color: "var(--e-text4)" }}>Dbl-click building</span>
                  </div>
                  <div className="editor-guide-shortcut">
                    <span>Close this guide</span>
                    <div className="keys"><span className="editor-guide-kbd">Esc</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
