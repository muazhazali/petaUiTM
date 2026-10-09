# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # Start dev server (Next.js)
pnpm build     # Production build
pnpm lint      # ESLint check
pnpm start     # Start production server
```

There are no tests currently.

## Architecture

**PetaUiTM** is an open-source interactive campus map for UiTM (Universiti Teknologi MARA). It is a static Next.js App Router app with no backend — all data is static JSON.

### Routes

| Route | Description |
|-------|-------------|
| `/` | Campus selector landing page |
| `/[campus]` | Full-screen map view for a campus |
| `/[campus]?building={id}` | Map with building info sheet open |
| `/[campus]?building={id}&floor={n}` | Floor plan view |
| `/[campus]?from={id}&to={id}` | Navigation route view |

### Key Components

- **`src/app/[campus]/CampusMap.tsx`** — Client component orchestrating the full campus view. Manages `selectedBuilding` state, syncs it with `?building=` URL param, and composes `MapComponent`, `SearchBar`, and `BuildingSheet`.
- **`src/components/MapComponent.tsx`** — Leaflet wrapper (always `dynamic` imported with `ssr: false`). Renders building GeoJSON polygons with hover/selected styles via `L.geoJSON`, pill markers via `L.divIcon`, handles clicks, and supports a `routeGeoJSON` prop for rendering OSRM walking routes. Tiles come from OpenStreetMap — free, no API key.
- **`src/components/SearchBar.tsx`** — Fuse.js fuzzy search over buildings.
- **`src/components/BuildingSheet.tsx`** — Slide-up sheet showing building details when a building is selected.

### Data

Static JSON files (not yet committed; schema defined in PRD.md):
- `data/campuses.json` — campus list with `center`, `zoom`, `bounds`
- `data/buildings.json` — buildings with GeoJSON polygon coords, facilities, hours
- `data/rooms/{buildingId}.json` — rooms per building with SVG element IDs
- `data/nav-graph/{buildingId}.json` — indoor navigation graph nodes/edges

### Coordinate convention

Note the inconsistency in `src/types/index.ts`:
- `Building.coords` is `[lat, lng]`
- `Building.polygon` entries and `Campus.center` are `[lng, lat]` (GeoJSON standard)

Leaflet APIs (`L.map`, `L.marker`, `flyTo`) take `[lat, lng]` — so `Campus.center` must be flipped (`[center[1], center[0]]`) while `Building.coords` is used as-is.

### Styling

Tailwind CSS v4 + shadcn/ui components in `src/components/ui/`. A `glass` utility class (glass-morphism) is used throughout the map overlay UI.

### Leaflet note

`MapComponent` is always dynamically imported with `ssr: false` because Leaflet requires browser APIs. The map instance is stored in a `useRef` and initialized once — mutations (route updates, pan-to-building, marker restyling) use separate `useEffect`s that operate on `mapRef.current`. Leaflet CSS is imported in `globals.css`; custom markers use `L.divIcon` with wrapper classes reset in `globals.css` (`.marker-*`). Tiles come from OpenStreetMap — free, no API key.
