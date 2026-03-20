# PRD: PetaUiTM

## Overview

**PetaUiTM** — open-source interactive map for navigating UiTM campuses. OSM-based map with building info, room search, SVG indoor floor plans, and walking pathfinding. Multi-campus support planned. Hosted on Vercel, static JSON data, no backend.

**Name:** PetaUiTM
**URL:** `petauitm.vercel.app`
**Repo:** `github.com/muaz-urmf/petauitm`
**Stack:** Next.js (App Router), MapLibre GL JS, Tailwind + shadcn/ui, Fuse.js, OSRM

---

## Core Features

### 1. Interactive Campus Map

- MapLibre GL JS rendering OSM vector tiles
- GeoJSON building polygons with hover/tap states
- Campus-centered default view with bounds locking

### 2. Building Info

- Tap building → side sheet with name, faculty, departments, facilities, operating hours
- Photo carousel (optional, static assets)
- Deep-linkable via URL params (`?building=fskm`)

### 3. Search

- Fuse.js fuzzy search over buildings + rooms
- Search bar with autocomplete dropdown
- Results pan/zoom map to selected item

### 4. Indoor Floor Plans

- Custom SVG per building per floor (`/public/floorplans/{buildingId}-L{n}.svg`)
- Floor switcher UI when building is selected
- Tappable rooms within SVG → room info (name, type, capacity)
- SVG room IDs map to `rooms/{buildingId}.json`

### 5. Navigation / Wayfinding

- A-to-B route selection (search or tap origin + destination)
- **Outdoor:** OSRM walking directions rendered as polyline on map
- **Indoor:** Client-side A\* over per-floor navigation graph
- **Transition:** Outdoor → building entrance → indoor graph (stretch goal)

---

## Data Schema

### `data/buildings.json`

```json
[
  {
    "id": "shah-alam-fskm",
    "campus": "shah-alam",
    "name": "Fakulti Sains Komputer & Matematik",
    "shortName": "FSKM",
    "coords": [3.0708, 101.4998],
    "polygon": [
      [
        /* GeoJSON coords */
      ]
    ],
    "floors": 5,
    "facilities": ["lecture halls", "labs", "cafeteria"],
    "hours": "7:00–22:00"
  }
]
```

### `data/campuses.json`

```json
[
  {
    "id": "shah-alam",
    "name": "UiTM Shah Alam",
    "center": [3.0708, 101.4998],
    "zoom": 16,
    "bounds": [
      [3.06, 101.49],
      [3.08, 101.51]
    ]
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

| Route                               | Description                       |
| ----------------------------------- | --------------------------------- |
| `/`                                 | Campus selector / landing         |
| `/{campus}`                         | Full-screen map for a campus      |
| `/{campus}?building={id}`           | Map with building info sheet open |
| `/{campus}?building={id}&floor={n}` | Floor plan view                   |
| `/{campus}?from={id}&to={id}`       | Navigation route view             |

Single-page app — all views are state-driven overlays on the map canvas.

---

## Tech Decisions

| Concern         | Choice                         | Rationale                           |
| --------------- | ------------------------------ | ----------------------------------- |
| Map renderer    | MapLibre GL JS                 | Free, vector tiles, smooth overlays |
| Tiles           | MapTiler free tier / Protomaps | No API key cost                     |
| Framework       | Next.js App Router             | Vercel-native, SSG for perf         |
| Search          | Fuse.js                        | Client-side, zero infra             |
| Outdoor routing | OSRM demo API                  | Free, walking profile               |
| Indoor routing  | Custom A\* (client)            | Simple graph, no server needed      |
| Floor plans     | Static SVG files               | Version-controlled, lightweight     |
| Data            | Static JSON in repo            | Easy to contribute via PR           |
| Styling         | Tailwind + shadcn/ui           | Fast, consistent UI                 |

---

## Milestones

### v0.1 — Map + Buildings

- [x] MapLibre setup with UiTM Shah Alam campus view
- [x] Load `buildings.json`, render GeoJSON polygons
- [x] Tap building → info sheet
- [x] URL param deep linking

### v0.2 — Search

- [x] Fuse.js index over buildings + rooms
- [x] Search bar with autocomplete
- [x] Select result → pan to building

### v0.3 — Indoor Floor Plans

- [x] SVG floor plan viewer component (`FloorPlanViewer.tsx`) with pan/zoom and room tap
- [x] Floor switcher in BuildingSheet (tabs + floor plan tab)
- [x] Tap room → room info (highlights SVG element, shows name/type/capacity)

### v0.4 — Navigation

- [x] Origin/destination picker UI (`NavigationPanel.tsx`)
- [x] OSRM outdoor walking route (polyline rendered on map)
- [x] Indoor A\* pathfinding (`src/lib/astar.ts`)
- [x] Route polyline rendering (outdoor via OSRM; indoor graph data in `nav-graph/`)

### v0.5 — Multi-Campus

- [x] Campus selector landing page (`/`)
- [x] `campuses.json` with per-campus config
- [x] Dynamic routing (`/[campus]`)
- [ ] Add 2–3 branch campuses as proof

### v0.6 — Polish & Launch

- [ ] PWA support (offline map caching)
- [x] Mobile-responsive layout
- [x] Contributing guide for data (adding campuses/buildings/rooms)
- [ ] README + demo deploy

---

## Non-Goals (for now)

- Real-time data (bus tracking, class schedules)
- User accounts or auth
- Backend / database
