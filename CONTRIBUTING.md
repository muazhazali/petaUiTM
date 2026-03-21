# Contributing to PetaUiTM

Thanks for your interest in contributing to PetaUiTM! This project is open-source and built for the UiTM community. All skill levels are welcome.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Git](https://git-scm.com/)
- A GitHub account

### Setup

1. **Fork** the repository on GitHub: [github.com/muazhazali/petaUiTM](https://github.com/muazhazali/petaUiTM)

2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/petaUiTM.git
   cd petaUiTM
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Verify everything works:**
   ```bash
   npm run build
   npm run lint
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page (campus selector)
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── globals.css         # Tailwind v4 theme + custom styles
│   └── [campus]/           # Dynamic campus route
│       ├── page.tsx        # Server component (data fetching)
│       └── CampusMap.tsx   # Client component (map + UI state)
├── components/
│   ├── MapComponent.tsx    # MapLibre GL map canvas
│   ├── SearchBar.tsx       # Fuse.js search with autocomplete
│   ├── BuildingSheet.tsx   # Building info panel
│   └── ui/                 # shadcn/ui primitives
├── types/
│   └── index.ts            # TypeScript interfaces
└── lib/
    └── utils.ts            # Utility functions (cn)

public/data/
├── campuses.json           # Campus definitions
├── buildings.json          # Building data with polygons
└── rooms/                  # Room data per building
    └── {buildingId}.json
```

## How to Contribute

### Reporting Bugs

- Open an [issue](https://github.com/muazhazali/petaUiTM/issues) with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Device/browser info (especially for mobile bugs)
  - Screenshot if applicable

### Suggesting Features

- Open an issue with the **feature request** label
- Describe the problem it solves and the proposed solution

### Submitting Code

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes.** Follow the conventions below.

3. **Test locally:**
   ```bash
   npm run build   # Must compile without errors
   npm run lint    # Must pass linting
   ```

4. **Commit** with a clear message:
   ```
   feat: add building photo carousel
   fix: search dropdown not closing on mobile
   data: add rooms for shah-alam-fka
   ```
   Prefixes: `feat`, `fix`, `refactor`, `data`, `docs`, `style`, `chore`

5. **Push** and open a **Pull Request** against `main`.

### Adding Campus/Building Data

This is one of the easiest ways to contribute — no code needed!

**Add rooms for a building:**
1. Create `public/data/rooms/{campus-id}-{building-short-name}.json`
2. Follow the existing format in `public/data/rooms/shah-alam-fskm.json`
3. Each room needs: `id`, `name`, `floor`, `type`, `capacity`, `svgElementId`

**Add building polygons:**
1. Edit `public/data/buildings.json`
2. Use [geojson.io](https://geojson.io) to draw polygons and copy coordinates
3. Coordinates are in `[longitude, latitude]` format (GeoJSON standard)

**Add a new campus:**
1. Add campus entry to `public/data/campuses.json`
2. Add buildings for that campus to `public/data/buildings.json`
3. Add room files under `public/data/rooms/`

See [Making the map accurate and reusable](#making-the-map-accurate-and-reusable) below for tips on sourcing accurate polygon data.

## Code Conventions

- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS v4 — use utility classes, avoid custom CSS where possible
- **Components:** shadcn/ui with `@base-ui/react` primitives
- **TypeScript:** Strict mode. Define interfaces in `src/types/index.ts`
- **Icons:** Use `lucide-react` only
- **Formatting:** Follow existing code style. No trailing semicolons are fine — just be consistent within the file
- **Mobile first:** Always design for mobile screens first, then enhance for desktop

## Areas That Need Help

- Adding room data for more buildings
- Adding more campus locations
- SVG floor plans for indoor navigation (see PRD for spec)
- Outdoor walking route integration (OSRM)
- Accessibility improvements
- Translations (Malay / English)
- Testing (unit + e2e)

## Making the Map Accurate and Reusable

This section explains how to ensure map data is accurate and how to structure contributions so PetaUiTM works well for any campus — not just UiTM Shah Alam.

### Drawing Accurate Building Polygons

1. **Use [geojson.io](https://geojson.io)** — enable the satellite layer and trace building outlines directly on the aerial imagery.
2. **Cross-reference OpenStreetMap** — many UiTM campuses are already mapped on OSM. Use [Overpass Turbo](https://overpass-turbo.eu/) to query and export existing polygons:
   ```
   [out:json];
   way["building"](around:1000, <lat>, <lng>);
   out geom;
   ```
3. **Cross-reference official maps** — UiTM publishes campus maps on their faculty websites. Use them to verify building names and approximate shapes.
4. If you're unsure about a polygon, open a PR anyway and note it as "needs verification" — someone with local knowledge can refine it.

### Reporting Map Errors

If you spot an inaccurate building outline or wrong label, [open an issue](https://github.com/muazhazali/petaUiTM/issues) using the **map error** label and include:
- Campus name and building ID (visible in the URL as `?building=...`)
- What's wrong (wrong shape, wrong name, wrong location)
- A screenshot or coordinates if possible

### Adding a Campus from Scratch

To make onboarding a new campus as fast as possible:

1. **Aim for completeness over perfection.** A campus with approximate polygons and correct building names is more useful than no campus at all.
2. **One campus per PR** — keeps reviews focused and makes it easier to merge partial work.
3. **Minimum viable campus entry:**
   - `campuses.json`: `id`, `name`, `center` `[lng, lat]`, `zoom`, `bounds`
   - `buildings.json`: at least `id`, `name`, `campus`, `coords`, `polygon` for each building
4. Use the **MapEditor** (`/map-editor` route, WIP) to draw polygons interactively and export valid JSON.

### Keeping Data Fresh

- If a building is renamed or demolished, update `buildings.json` and open a PR.
- Use the `lastUpdated` field (ISO date string) on each building entry to signal when data was last verified.
- If you're a student or staff at a campus, you're the best person to keep that campus accurate — consider becoming a **campus maintainer** by noting it in your PR.

## Questions?

Open an issue or start a discussion on the repo. We're happy to help you get started.
