# PRD: PetaUiTM

## Overview

**PetaUiTM** — open-source interactive map for navigating UiTM campuses. OSM-based map with building info, room search, SVG indoor floor plans, walking pathfinding, and POI filtering. Multi-campus support planned. Hosted on Vercel, static JSON data, no backend.

**Name:** PetaUiTM
**URL:** `petauitm.vercel.app`
**Repo:** `github.com/muazarif12/petaUiTM`
**Stack:** Next.js (App Router), MapLibre GL JS, Tailwind + shadcn/ui, Fuse.js, OSRM

---

## Current State (as of March 2026)

### What's shipped

- **Landing page** — campus selector with feature strip, staggered animations, warm cream theme matching the campus page. Responsive (mobile + desktop).
- **Campus map view** — full-screen MapLibre map with building polygon rendering, hover/selected feature states, click-to-select.
- **Building list panel** — left sidebar with Fuse.js fuzzy search, building cards, nav-mode context actions (Set as From / Set as To). Replaces the old floating SearchBar overlay.
- **Building info sheet** — slide-up sheet with building details; deep-linkable via `?building=` URL param.
- **Navigation / directions** — OSRM outdoor walking routes rendered as polyline; NavigationPanel with From/To pickers, turn-by-turn steps, route sharing, swap button.
- **POI layer** — POI data model (`food`, `mosque`, `atm`, `parking`, `bus`, `health`, `library`); POIFilter component for toggling categories; POIs rendered on map alongside buildings.
- **Mobile map toggle** — on mobile, list panel is shown by default with a "Show Map" FAB; map opens full-screen with a back-to-list button.
- **Building markers** — marker pins rendered on the map for each building in addition to polygons.
- **Floor plan viewer** — `FloorPlanViewer` component exists; floor plan route (`?building=x&floor=n`) defined.
- **Map editor** — `/editor` route with `MapEditor` component for drawing/editing building polygons with undo/redo.
- **PWA** — service worker registered, manifest, apple-touch-icon.

### What's not yet built

- **Indoor navigation** — A\* over nav graph; indoor routing from building entrance. Nav graph schema is defined but client-side pathfinding is not implemented.
- **Floor plan interactivity** — SVG rooms are not yet tappable; room info sheet not wired up.
- **Real building data** — `data/buildings.json` and `data/campuses.json` are not committed; the campus page loads data from static files that are still empty/placeholder.
- **Additional campuses** — only Shah Alam is wired up; multi-campus selector shows "coming soon."
- **Photo carousel** in building sheet.

---

## Core Features

### 1. Interactive Campus Map ✅

- MapLibre GL JS rendering OSM vector tiles
- GeoJSON building polygons with hover/selected feature states
- Building marker pins per building
- Campus-centered default view with bounds locking
- POI markers toggled by category

### 2. Building List + Search ✅

- Left panel (desktop) / full-screen panel (mobile) with building list
- Fuse.js fuzzy search over buildings
- Results select building and pan/zoom map
- Nav-mode context: each card shows "Set as From" / "Set as To" actions

### 3. Building Info Sheet ✅

- Slide-up sheet with name, faculty, facilities, operating hours
- Deep-linkable via `?building={id}`
- "Get Directions From Here" / "Get Directions To Here" buttons
- Photo carousel — _not yet implemented_

### 4. Navigation / Wayfinding ✅ (outdoor only)

- NavigationPanel with From/To building pickers and swap
- OSRM walking route rendered as polyline on map
- Turn-by-turn step list with distance/duration
- Route sharing via URL (`?from={id}&to={id}`)
- Indoor A\* pathfinding — _not yet implemented_

### 5. POI Layer ✅

- Categories: `food`, `mosque`, `atm`, `parking`, `bus`, `health`, `library`
- POIFilter component to toggle active categories
- POIs rendered on map; loaded from `/data/pois.json`

### 6. Indoor Floor Plans 🔧 (partial)

- `FloorPlanViewer` component exists
- Floor switcher route defined (`?building=x&floor=n`)
- SVG floor plans and room data schema defined
- Room tap / room info sheet — _not yet implemented_

### 7. Map Editor ✅ (internal tool)

- `/editor` route for drawing and editing building polygons
- Undo/redo, sidebar, toolbar
- Used for contributing building footprint data

---

## Data Schema

### `data/campuses.json`

```json
[
  {
    "id": "shah-alam",
    "name": "UiTM Shah Alam",
    "center": [101.4998, 3.0708],
    "zoom": 16,
    "bounds": [[101.49, 3.06], [101.51, 3.08]]
  }
]
```

> Note: `center` is `[lng, lat]` (GeoJSON standard). Use `[lng, lat]` for MapLibre `flyTo`.

### `data/buildings.json`

```json
[
  {
    "id": "shah-alam-fskm",
    "campus": "shah-alam",
    "name": "Fakulti Sains Komputer & Matematik",
    "shortName": "FSKM",
    "coords": [3.0708, 101.4998],
    "polygon": [[101.499, 3.070], /* ... */],
    "floors": 5,
    "facilities": ["lecture halls", "labs", "cafeteria"],
    "hours": "7:00–22:00",
    "description": "Optional longer description."
  }
]
```

> Note: `coords` is `[lat, lng]`; `polygon` entries are `[lng, lat]` (GeoJSON). See `CLAUDE.md` for the full inconsistency note.

### `data/pois.json`

```json
[
  {
    "id": "shah-alam-cafe-1",
    "campus": "shah-alam",
    "name": "Cafe Angkasa",
    "category": "food",
    "coords": [3.071, 101.500],
    "description": "Optional."
  }
]
```

### `data/rooms/{buildingId}.json`

```json
[
  {
    "id": "fskm-L3-BK01",
    "name": "Bilik Kuliah 01",
    "floor": 3,
    "type": "lecture_hall",
    "capacity": 120,
    "svgElementId": "room-bk01"
  }
]
```

### `data/nav-graph/{buildingId}.json`

```json
{
  "nodes": [
    { "id": "entrance-main", "floor": 0, "coords": [3.0708, 101.4998] },
    { "id": "L3-corridor-01", "floor": 3, "coords": [3.0709, 101.4999] }
  ],
  "edges": [
    { "from": "entrance-main", "to": "L0-stairs-A", "weight": 15 },
    { "from": "L0-stairs-A", "to": "L3-corridor-01", "weight": 45 }
  ]
}
```

---

## Pages / Views

| Route                               | Description                        | Status        |
| ----------------------------------- | ---------------------------------- | ------------- |
| `/`                                 | Campus selector / landing          | ✅ Done       |
| `/{campus}`                         | Full-screen map + building list    | ✅ Done       |
| `/{campus}?building={id}`           | Map with building info sheet open  | ✅ Done       |
| `/{campus}?building={id}&floor={n}` | Floor plan view                    | 🔧 Partial    |
| `/{campus}?from={id}&to={id}`       | Navigation route view              | ✅ Done       |
| `/editor`                           | Internal map/building polygon tool | ✅ Done       |

---

## Tech Decisions

| Concern         | Choice                         | Rationale                           |
| --------------- | ------------------------------ | ----------------------------------- |
| Map renderer    | MapLibre GL JS                 | Free, vector tiles, smooth overlays |
| Tiles           | MapTiler free tier / Protomaps | No API key cost                     |
| Framework       | Next.js App Router             | Vercel-native, SSG for perf         |
| Search          | Fuse.js                        | Client-side, zero infra             |
| Outdoor routing | OSRM demo API                  | Free, walking profile               |
| Indoor routing  | Custom A\* (client) — planned  | Simple graph, no server needed      |
| Floor plans     | Static SVG files               | Version-controlled, lightweight     |
| Data            | Static JSON in repo            | Easy to contribute via PR           |
| Styling         | Tailwind v4 + shadcn/ui        | Fast, consistent UI                 |
| PWA             | next-pwa / custom SW           | Offline map browsing                |

---

## Upcoming

- Commit real building data for Shah Alam (use Map Editor + OSM tracing)
- Wire up floor plan interactivity (tappable SVG rooms → room info sheet)
- Implement indoor A\* routing over nav graph
- Add more campuses (contributions via PR encouraged — see `CONTRIBUTING.md`)
