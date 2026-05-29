# 🌋 Volcano Explorer

An interactive 3D globe for exploring the world's volcanoes — search, inspect, and compare volcanoes with eruption history, geological overlays, and side-by-side comparisons.

![Volcano Explorer](.github/screenshots/layers.png)

---

## Features

### 🌍 Interactive 3D Globe
A fully rotatable globe built with Mapbox GL JS. Active volcanoes pulse with an animated red dot; dormant and extinct volcanoes appear as colored circles. Atmosphere, fog, and star field give the map a cinematic feel.

![Globe view](.github/screenshots/globe.png)

---

### 🔍 Search
Find any volcano by name, country, or region. Results update as you type with status indicators and elevation data.

![Search](.github/screenshots/search.png)

---

### 📋 Volcano Detail Panel
Click any volcano to open a side panel with:
- Dynamic image fetched from Wikipedia
- Key stats: elevation, type, last eruption, VEI
- Full eruption history with a VEI bar chart
- Links to Wikipedia, Global Volcanism Program, and Google Maps

![Detail panel](.github/screenshots/panel.png)

---

### 🗺️ Geological Layers
Toggle tectonic plate boundaries and the Pacific Ring of Fire on the globe. Three boundary types are shown — subduction zones, divergent boundaries, and transform faults — each in a distinct color with a legend.

![Geological layers](.github/screenshots/layers.png)

---

### ⚖️ Volcano Comparison
Compare up to 3 volcanoes side by side. Activate compare mode from the search bar, select volcanoes on the map (blue ring highlights), then open the modal to see elevation bars, VEI scores, eruption counts, and more.

![Comparison](.github/screenshots/compare.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev) + [Vite](https://vitejs.dev) |
| Map | [Mapbox GL JS v3](https://docs.mapbox.com/mapbox-gl-js/) — globe projection, GeoJSON layers, custom animated images |
| Charts | [Recharts](https://recharts.org) — VEI eruption history bar charts |
| Images | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) — dynamic thumbnail fetching |
| Geological data | [PB2002](https://doi.org/10.1029/2001GC000252) plate boundary dataset (Peter Bird, 2002) |
| Styling | Plain CSS with `backdrop-filter` glass panels |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Mapbox access token](https://account.mapbox.com/auth/signup/)

### Installation

```bash
git clone https://github.com/your-username/volcano-explorer.git
cd volcano-explorer
npm install
```

### Configuration

**Option A — `.env` file (recommended)**

```env
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi...your_token_here
```

**Option B — in-app prompt**

Skip the `.env` file. On first launch the app will ask for your token and save it to `localStorage`.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
volcano-explorer/
├── public/
│   └── data/
│       ├── volcanoes.json          # Volcano dataset with eruption history
│       ├── plate_boundaries.json   # PB2002 tectonic boundaries
│       └── ring_of_fire.json       # Pacific Ring of Fire boundary
└── src/
    ├── components/
    │   ├── Map.jsx                 # Mapbox GL globe — all layers & interactions
    │   ├── SearchBar.jsx           # Search + compare mode toggle
    │   ├── VolcanoPanel.jsx        # Detail panel: stats, images, eruption chart
    │   ├── EruptionChart.jsx       # Recharts VEI bar chart
    │   ├── LayerControls.jsx       # Tectonic / Ring of Fire toggles
    │   ├── CompareBar.jsx          # Compare mode selection strip
    │   ├── CompareModal.jsx        # Side-by-side comparison modal
    │   └── TokenGate.jsx           # First-run Mapbox token prompt
    └── App.jsx
```

---

## Data

`volcanoes.json` covers 50 significant volcanoes worldwide with coordinates, elevation, type, activity status, eruption history (year + VEI + description), and Wikipedia/GVP links. Geological boundary data is derived from the [PB2002 dataset](https://doi.org/10.1029/2001GC000252) by Peter Bird.

---

## License

MIT
