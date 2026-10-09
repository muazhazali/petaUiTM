# PetaUiTM

An open-source interactive campus map for Universiti Teknologi MARA (UiTM). Built with Next.js and Leaflet, it provides building information, fuzzy search, indoor floor plans, and walking navigation — all as a static app with no backend, no API keys, and no paid services.

**Live demo:** https://petauitm.vercel.app

---

## Features

- Interactive map with building polygons (hover, tap, deep-link)
- Fuzzy search across buildings and rooms (Fuse.js)
- Building info sheet with facilities and operating hours
- Indoor SVG floor plans with tappable rooms
- Outdoor walking navigation via OSRM
- Indoor A* pathfinding over per-floor navigation graphs
- Multi-campus support with campus selector landing page
- PWA — installable with offline asset caching

---

## Tech Stack

| Concern         | Choice                        |
|-----------------|-------------------------------|
| Framework       | Next.js 15 (App Router, SSG)  |
| Map renderer    | Leaflet                       |
| Tile source     | OpenStreetMap (free, no key)  |
| Search          | Fuse.js (client-side)         |
| Outdoor routing | OSRM demo API (free)          |
| Indoor routing  | Custom A* (client-side)       |
| Floor plans     | Static SVG files              |
| Data            | Static JSON in `public/data/` |
| Styling         | Tailwind CSS v4 + shadcn/ui   |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)

### Local development

```bash
git clone https://github.com/muaz-urmf/petauitm.git
cd petauitm
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Build for production

```bash
pnpm build
pnpm start
```

---

## Data Contribution Guide

All map data lives in `public/data/` as static JSON files. Contributing data is a pull request away — no backend required.

### Adding a building

Add an entry to `public/data/buildings.json`:

```json
{
  "id": "shah-alam-fskm",
  "campus": "shah-alam",
  "name": "Fakulti Sains Komputer & Matematik",
  "shortName": "FSKM",
  "coords": [3.0708, 101.4998],
  "polygon": [[[101.4995, 3.0705], [101.5001, 3.0705], [101.5001, 3.0711], [101.4995, 3.0711], [101.4995, 3.0705]]],
  "floors": 5,
  "facilities": ["lecture halls", "labs", "cafeteria"],
  "hours": "7:00-22:00"
}
```

Note: `coords` is `[lat, lng]`; `polygon` coordinates are `[lng, lat]` (GeoJSON standard).

### Adding rooms for a building

Create `public/data/rooms/{buildingId}.json`:

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

Place the corresponding SVG floor plan at `public/floorplans/{buildingId}-L{n}.svg`. Room SVG element IDs must match the `svgElementId` values.

### Adding an indoor navigation graph

Create `public/data/nav-graph/{buildingId}.json`:

```json
{
  "nodes": [
    { "id": "entrance-main", "floor": 0, "coords": [3.0708, 101.4998] }
  ],
  "edges": [
    { "from": "entrance-main", "to": "L0-stairs-A", "weight": 15 }
  ]
}
```

### Adding a campus

Add an entry to `public/data/campuses.json`:

```json
{
  "id": "johor",
  "name": "UiTM Johor",
  "center": [103.7618, 1.5338],
  "zoom": 16,
  "bounds": [[103.75, 1.52], [103.77, 1.54]]
}
```

Then add buildings with `"campus": "johor"` in `buildings.json`. The campus will automatically appear on the landing page and be accessible at `/johor`.

---

## License

MIT
