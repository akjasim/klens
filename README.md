# DELens – Deutschland Explorer

**Live:** https://klens.jasim.dev

DELens is a web-based tool designed to help people explore and understand real data from across Germany. Inspired by GapMinder, it provides an intuitive interface for discovering insights from public datasets.

The UI is built with React and Bootstrap, visualized via Recharts.

## Features

- **Interactive visualizations** — Explore data through charts, animations, and insights
- **Flexible querying** — Direct access to Elasticsearch with a custom query builder
- **Multilingual support** — Switch between English and German (Deutsch) throughout the application

## Pages

### 🏠 Home

A minimalist landing page introducing DELens and its purpose, with quick access to start exploring or learn more about the project.

### 🧩 Explorer (Query Builder)

A flexible Elasticsearch query builder. Configure index details, edit the raw `dataForRemote` payload, dispatch the request, and inspect the response.

**Highlights**

1. **Inline JSON editor** with auto-formatting helper
2. **Request preview** showing index, action, method, and optional path
3. **Response panel** displaying status, prettified JSON, and a clipboard copy button
4. **Error handling** that surfaces Elasticsearch error payloads and codes

### 📊 Time Series

An interactive time series visualization tool for exploring temporal trends across Deutschland's datasets. Select a spatial reference (Raumbezug), place, category (Bereich), and indicator to visualize data over time.

**Features**

1. **Cascading filters** — Four-level dropdown selection (Spatial reference → Place → Category → Indicator)
2. **Animated playback** — Watch trends evolve year-by-year with play/pause controls
3. **Interactive slider** — Manually navigate through years
4. **Insights panel** — Automatic analysis showing overall trend, peak/low values, biggest rise, and sharpest drop

**Use Case**

Perfect for understanding how demographic, economic, or social indicators change over time in specific German regions. The insights panel highlights key patterns and possible drivers of change.

### ℹ️ About

Learn more about DELens, its vision, and how to use the platform.
