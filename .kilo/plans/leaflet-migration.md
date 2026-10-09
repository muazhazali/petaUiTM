# Plan: Replace MapLibre GL JS with Leaflet (fully free, no API key)

## Goal

Swap the map stack to 100% free, key-less tools:

- Map renderer: **Leaflet** (plain, no wrapper — matches the existing imperative `mapRef` + `useEffect` pattern)
- Tiles: **OpenStreetMap standard tiles** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) with required OSM attribution — no API key, no CARTO dependency

All existing behavior is preserved: building polygons with hover/selected states, green pill markers, from/to route render + OSRM routing (already free), POI emoji markers with popups, flyTo behavior, geolocation button, and the polygon editor at `/editor`.

> Note: Leaflet also requires browser APIs, so the existing `dynamic(..., { ssr: false })` import stays.

## Why plain Leaflet (not react-leaflet)

- `react-leaflet` v5 supports React 19, but every interactive behavior here is imperative (hover feature states, drag vertices, live draw preview). Leaflet's native events (`mouseover`, `click`, `draggable` markers) map 1:1 to what the current hand-rolled MapLibre code does — a React wrapper adds props-plumbing for no gain.
- One small dep (`leaflet` ~42KB gzipped) replaces 200KB+ MapLibre → smaller bundle too.

## Steps

### 1. Dependencies
- `pnpm remove maplibre-gl`
- `pnpm add leaflet` and `pnpm add -D @types/leaflet`

### 2. Rewrite `src/components/MapComponent.tsx`
| Current (MapLibre) | New (Leaflet) |
|---|---|
| Raster style with CARTO tiles | `L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution })` |
| GeoJSON source + fill/line/symbol layers | single `L.geoJSON(group)` layer; hover/selected via `layer.setStyle()` |
| `maplibregl.Marker` (pill, from/to, POI) | `L.marker` with `L.divIcon` (same HTML/CSS, pill styles unchanged) |
| `maplibregl.Popup` | `L.popup({ offset, closeButton: false, maxWidth: 200 })` |
| `NavigationControl` + custom geolocate | built-in zoom control + small custom `L.Control` with `map.locate()` |
| `flyTo({center, zoom, duration})` | `map.flyTo([lat, lng], zoom, { duration })` |
| route GeoJSON source `setData` | route `L.geoJSON` layer — `clearLayers()` + `addData()` on prop change |
| feature `queryRenderedFeatures` on click | not needed — polygon layers have their own `click`/`mouseout` events |

Coordinate note (same trap as today): `Campus.center` is `[lng, lat]` → flip to `[lat, lng]` for Leaflet; `Building.coords` is `[lat, lng]` → flip for lngLat positions.

### 3. Rewrite `src/app/editor/MapEditor.tsx` (map only — sidebar, undo, guide, export untouched)
- Buildings → `L.geoJSON` with `selected`/`editing` styles toggled by `setStyle`.
- **Draw mode**: map `mousemove` updates a dashed `L.polyline` + polygon `L.map` preview layer; `click` appends vertices.
- **Edit mode** — big simplification vs manual hit-testing:
  - vertices: draggable `L.marker` with `divIcon` dots → `dragstart/drag/dragend` events replace `mousedown` + `dragPan.disable()` + manual index tracking
  - vertex `click` → delete (min 3 rule kept)
  - midpoints: small `L.circleMarker` with `mouseover` growth + `click` to insert
  - edit ring → dashed `L.polyline`
- Hover cursor + hovered-index highlight via marker/layer events (no `queryRenderedFeatures`).

### 4. CSS
- `globals.css`: replace `@import 'maplibre-gl/dist/maplibre-gl.css'` with `@import 'leaflet/dist/leaflet.css'`.
- Add small overrides: leaflet popup radius/shadow to match the glass look; pill/divIcon default border/background removal; keep z-index compatible with existing overlays (`z-10/40/50` vs leaflet panes 400–700 as needed).

### 5. Docs
- `README.md`: tech stack table → `Leaflet` / `OpenStreetMap tiles (free)`; mention no API key needed.
- `CLAUDE.md`: update MapLibre notes → Leaflet equivalents (dynamic import still required, map instance in ref, `[lng,lat]`↔`[lat,lng]` convention).

### 6. No changes needed
- `public/sw.js` — already ignores cross-origin tile/OSRM requests.
- `CampusMap.tsx`, `BuildingSheet`, search, routing — prop interfaces unchanged (only MapComponent internals swap).

## Verification
1. `pnpm build` + `pnpm lint` clean
2. Dev-server smoke test: `/` campus list, `/shah-alam` map (polygon hover/select, pill markers, POI toggles, route between two buildings, geolocate)
3. `/editor` (draw new polygon, drag/delete/insert vertex, undo/redo, export JSON)

## Risks / notes
- Route layer must accept click-through (`interactive: false`) so clicks pass to the map.
- Leaflet `flyTo` duration semantics differ slightly from MapLibre — acceptable.
- OSM tiles are free for reasonable usage (small campus map is fine); attribution is mandatory and included.