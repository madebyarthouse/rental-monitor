# Architecture Documentation

This document describes the frontend architecture, data loading patterns, service layer, routing structure, and features of the Rental Monitor web application.

## Table of Contents

- [System Overview](#system-overview)
- [Routing Architecture](#routing-architecture)
- [Data Loading Pattern](#data-loading-pattern)
- [Service Layer](#service-layer)

---

## System Overview

Rental Monitor is built on **React Router v7**, a full-stack React framework that combines SSR, routing, and data loading in a single architecture.

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        UI[React Components]
        HOOKS[React Hooks]
    end

    subgraph "React Router v7 Server"
        ROUTES[Route Handlers]
        LOADERS[Loader Functions]
    end

    subgraph "Service Layer"
        LISTINGS_SVC[ListingsService]
        MAP_SVC[MapService]
        STATS_SVC[StatisticsService]
        REGION_SVC[RegionService]
    end

    subgraph "Data Layer"
        DRIZZLE[Drizzle ORM]
        D1[(Cloudflare D1<br/>SQLite)]
    end

    UI --> ROUTES
    UI --> HOOKS
    ROUTES --> LOADERS
    LOADERS --> LISTINGS_SVC
    LOADERS --> MAP_SVC
    LOADERS --> STATS_SVC
    LOADERS --> REGION_SVC

    LISTINGS_SVC --> DRIZZLE
    MAP_SVC --> DRIZZLE
    STATS_SVC --> DRIZZLE
    REGION_SVC --> DRIZZLE

    DRIZZLE --> D1

    UI -->|loader data| LOADERS

    style UI fill:#4ade80
    style LOADERS fill:#60a5fa
    style DRIZZLE fill:#f59e0b
    style D1 fill:#a78bfa
```

### Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS v4
- **Framework**: React Router v7 (SSR + file-based routing)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM v0.44.7
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Maps**: React Leaflet + Leaflet.js
- **Validation**: Zod (query parameters)

---

## Routing Architecture

### File-Based Routes

React Router v7 uses file-based routing in [app/routes/](../app/routes/). Files are organized hierarchically to match URL structure.

### Route Hierarchy

```mermaid
graph TD
    ROOT[app/routes/]

    ROOT --> APP[_app.tsx<br/>Layout wrapper]

    APP --> INDEX[_app._index.tsx<br/>Country-level map<br/>URL: /]
    APP --> INSERATE[_app.inserate.tsx<br/>Country listings<br/>URL: /inserate]

    APP --> STATE[_app.$state._index.tsx<br/>State-level map<br/>URL: /:state]
    APP --> STATE_INSERATE[_app.$state.inserate.tsx<br/>State listings<br/>URL: /:state/inserate]

    APP --> DISTRICT[_app.$state.$district._index.tsx<br/>District-level map<br/>URL: /:state/:district]
    APP --> DISTRICT_INSERATE[_app.$state.$district.inserate.tsx<br/>District listings<br/>URL: /:state/:district/inserate]

    style INDEX fill:#4ade80
    style STATE fill:#60a5fa
    style DISTRICT fill:#f59e0b
    style APP fill:#a78bfa
```

### Route Structure

| URL                          | File                                 | Description                     |
| ---------------------------- | ------------------------------------ | ------------------------------- |
| `/`                          | `_app._index.tsx`                    | Country-level map with heatmap  |
| `/inserate`                  | `_app.inserate.tsx`                  | Country-level listings table    |
| `/:state`                    | `_app.$state._index.tsx`             | State-level map (e.g., `/wien`) |
| `/:state/inserate`           | `_app.$state.inserate.tsx`           | State-level listings            |
| `/:state/:district`          | `_app.$state.$district._index.tsx`   | District-level map              |
| `/:state/:district/inserate` | `_app.$state.$district.inserate.tsx` | District-level listings         |

### Layout Route (`_app.tsx`)

The `_app.tsx` layout wraps all child routes and loads shared data:

**Responsibilities**:

- Load states and districts for navigation
- Provide desktop sidebar and mobile bottom bar
- Render nested route content via `<Outlet />`

## Data Loading Pattern

React Router v7 uses **loader functions** for server-side data fetching. Loaders run on the server before rendering, providing data to components via props.

### Data Loading Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Router as React Router
    participant Loader as Loader Function
    participant Service as Service Layer
    participant DB as D1 Database
    participant Component as React Component

    Browser->>Router: Navigate to /:state
    Router->>Loader: Call loader({ params, request })
    Loader->>Loader: Parse URL query params (filters)
    Loader->>Service: regionService.getStateWithDistricts(state)
    Service->>DB: SELECT * FROM regions WHERE...
    DB-->>Service: Return region data
    Service-->>Loader: Return formatted data
    Loader->>Service: mapService.getHeatmapData(...)
    Service->>DB: Complex aggregation query
    DB-->>Service: Return heatmap data
    Service-->>Loader: Return heatmap
    Loader->>Service: statsService.getStatistics(...)
    Service->>DB: SELECT AVG(...) FROM listings
    DB-->>Service: Return stats
    Service-->>Loader: Return statistics
    Loader-->>Router: Return { state, heatmap, stats, ... }
    Router->>Component: Render with loaderData
    Component-->>Browser: Display UI
```
