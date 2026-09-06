# DELens

Interactive data exploration platform for public Germany datasets, inspired by GapMinder.

Live application: https://delens.jasim.dev

## Overview

DELens helps users explore regional and temporal indicators from Elasticsearch-backed public data. It combines direct querying tools with guided visual analytics so both technical and non-technical users can discover trends quickly.

The app is built with React + Vite and uses a Netlify serverless proxy to safely relay Elasticsearch requests from the frontend.

## Final Feature Set

- Interactive time-series analysis with cascading filters (spatial reference, place, category, indicator)
- Demographic dashboard with age-group and gender analysis over time
- Urbanization exploration with 2D/3D map-based views and multi-indicator playback
- Query Builder for custom Elasticsearch requests with JSON formatting and response inspection
- Query history persistence in local storage
- Bilingual UI (English and German) via i18next
- Responsive SPA navigation with route-based pages and fallback 404 view

## Pages

### Home

Landing page with project intro and quick navigation to exploration flows.

### Explorer

Advanced query builder for Elasticsearch proxy requests.

- Edit request fields (`indexName`, `indexAction`, `requestType`, `dataForRemote`, optional path)
- Format JSON payload before execution
- Inspect response status and body (JSON/text)
- Copy results to clipboard
- Save and re-run named query history entries

### Time Series

Guided time-series exploration workflow.

- Loads available terms dynamically from Elasticsearch aggregations
- Supports multi-step filtering: spatial reference -> place -> category -> indicator
- Renders trend visualization with animation frames
- Shows insight metrics such as overall trend, peak, low, biggest rise, and sharpest drop

### Demographics

Population structure analysis over time.

- Age-group distribution analysis with animated year progression
- Gender-focused view options
- Derived insights from total population and age-bucket changes
- Works across selectable spatial references and places

### Urbanization

State and district-level indicator exploration with map rendering.

- Uses Three.js for interactive geographic visualization
- Supports indicator categories including population, internet speed, birth/death rates, and migration rates
- Includes time playback controls, color scheme options, and 2D/3D terrain modes
- Drills down from Bundeslander to Kreise-level geometry and metrics

### About

Project mission and usage context.

### Not Found

Graceful route fallback for unknown paths.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- Bootstrap 5
- Plotly + react-plotly.js
- Recharts
- Three.js
- D3 Geo + d3-scale-chromatic
- i18next + react-i18next
- Netlify Functions

## Project Structure

```text
.
├── netlify/
│   └── functions/
│       └── proxy.js
├── public/
├── src/
│   ├── api/
│   │   └── elasticsearch.js
│   ├── components/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Explorer.jsx
│   │   ├── TimeSeries.jsx
│   │   ├── DemographicIndicator.jsx
│   │   ├── Urbanization.jsx
│   │   ├── About.jsx
│   │   └── NotFound.jsx
│   ├── App.jsx
│   └── i18n.js
├── netlify.toml
├── vite.config.js
└── package.json
```

## Data Access and Proxy

Frontend calls `/api/proxy`, which is redirected by Netlify to the serverless function in `netlify/functions/proxy.js`.

The proxy function:

- Accepts JSON request payloads from the app
- Forwards requests to the upstream public Elasticsearch endpoint
- Handles CORS and preflight requests
- Returns JSON or plain text responses with propagated status handling

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Install

```bash
npm install
```

The application uses a Netlify Function as a proxy for Elasticsearch requests. The normal Vite commands run only the frontend bundle; use the `:netlify` commands when you need to run the frontend together with the Netlify proxy layer and functions.

### Run Frontend Development Server

```bash
npm run dev
```

This starts the Vite frontend without Netlify Functions.

To run the frontend with the Netlify proxy layer, use:

```bash
npm run dev:netlify
```

### Build

```bash
npm run build
```

Builds the frontend bundle with Vite.

To verify the Netlify build locally, including the configured build settings:

```bash
npm run build:netlify
```

Builds the frontend with Netlify's configured build process and bundles the Netlify Functions.

### Preview Production Build

```bash
npm run preview
```

This previews the frontend-only Vite build and assumes that `npm run build` has just completed successfully.

To preview the production build together with the Netlify Function and redirects, first run `npm run build:netlify`, then run:

```bash
npm run preview:netlify
```

These commands run locally and do not require a Netlify account. A Netlify account is only required to deploy the site.

### Lint

```bash
npm run lint
```

## Deployment

Configured for Netlify using `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Redirect rule: `/api/*` -> `/.netlify/functions/:splat`
- SPA fallback: `/*` -> `/index.html`

## Internationalization

Translations are defined in `src/i18n.js` for:

- English (`en`)
- German (`de`)

## Notes

- The repository contains a `Spotify.jsx` page file for experimentation, but it is not part of the active navigation/routes in the final UI.
