# KLens – Kaiserslautern Explorer

**Live:** https://klens.jasim.dev

KLens is a web-based tool designed to help people explore and understand real data from the City Administration of Kaiserslautern. Inspired by GapMinder, it provides an intuitive interface for discovering insights from public datasets.

The UI is built with React and Bootstrap, visualized via Recharts.

## Pages

### 🏠 Home

A minimalist landing page introducing KLens and its purpose, with quick access to start exploring or learn more about the project.

### 🧩 Explorer (Query Builder)

A flexible Elasticsearch query builder. Configure index details, edit the raw `dataForRemote` payload, dispatch the request, and inspect the response.

**Highlights**

1. **Inline JSON editor** with auto-formatting helper
2. **Request preview** showing index, action, method, and optional path
3. **Response panel** displaying status, prettified JSON, and a clipboard copy button
4. **Error handling** that surfaces Elasticsearch error payloads and codes

### ℹ️ About

Learn more about KLens, its vision, and how to use the platform.
