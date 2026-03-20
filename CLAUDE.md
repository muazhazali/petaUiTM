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
- **`src/components/MapComponent.tsx`** — MapLibre GL JS wrapper (always `dynamic` imported with `ssr: false`). Renders building GeoJSON polygons with hover/selected feature states, handles clicks, and supports a `routeGeoJSON` prop for rendering OSRM walking routes.
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

When using `flyTo` in MapLibre, always use `[lng, lat]` — see `MapComponent.tsx:197` where `coords` is flipped: `[selectedBuilding.coords[1], selectedBuilding.coords[0]]`.

### Styling

Tailwind CSS v4 + shadcn/ui components in `src/components/ui/`. A `glass` utility class (glass-morphism) is used throughout the map overlay UI.

### MapLibre note

`MapComponent` is always dynamically imported with `ssr: false` because MapLibre GL JS requires browser APIs. The map instance is stored in a `useRef` and initialized once — mutations (route updates, pan-to-building) use separate `useEffect`s that operate on `mapRef.current`.
