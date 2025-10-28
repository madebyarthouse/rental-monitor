# Routing Architecture V2

**Purpose**: Define the simplified routing structure with consolidated routes, flexible service layer, and clear separation of concerns.

**Philosophy**: Thin route files that handle params, errors, and headers. Business logic in services. Presentation logic in React components.

---

## Table of Contents

- [Overview](#overview)
- [Route Structure](#route-structure)
- [File Organization](#file-organization)
- [Service Layer Architecture](#service-layer-architecture)
- [Route Responsibilities](#route-responsibilities)
- [Data Flow](#data-flow)
- [Product Architecture](#product-architecture)

---

## Overview

### Key Simplification

**Before**: 7 route files (1 layout + 6 routes for Austria/State/District × Map/Listings)

**After**: 3 route files (1 layout + 2 views that handle all geographic levels)

### How It Works

Routes use optional path parameters to handle all geographic levels in a single file:

- Map view route handles: `/`, `/:state`, `/:state/:district`
- Listings view route handles: `/inserate`, `/:state/inserate`, `/:state/:district/inserate`
- Services receive region parameters and adapt their queries accordingly

---

## Route Structure

### Routes Configuration

React Router 7 uses a `routes.ts` file for programmatic route definition:

```mermaid
graph TD
    A[routes.ts Configuration] --> B[Root Layout]
    B --> C[App Layout Route]
    C --> D[Index Route - Map View]
    C --> E[Inserate Route - Listings View]

    D --> D1["Pattern: /"]
    D --> D2["Pattern: /:state"]
    D --> D3["Pattern: /:state/:district"]

    E --> E1["Pattern: /inserate"]
    E --> E2["Pattern: /:state/inserate"]
    E --> E3["Pattern: /:state/:district/inserate"]

    style A fill:#e63946,color:#fff
    style B fill:#457b9d,color:#fff
    style C fill:#457b9d,color:#fff
    style D fill:#2a9d8f,color:#fff
    style E fill:#2a9d8f,color:#fff
```

### URL Patterns

| View     | Geographic Level | URL Pattern                  | Example                       |
| -------- | ---------------- | ---------------------------- | ----------------------------- |
| Map      | Austria          | `/`                          | `/`                           |
| Map      | State            | `/:state`                    | `/wien`                       |
| Map      | District         | `/:state/:district`          | `/wien/innere-stadt`          |
| Listings | Austria          | `/inserate`                  | `/inserate`                   |
| Listings | State            | `/:state/inserate`           | `/wien/inserate`              |
| Listings | District         | `/:state/:district/inserate` | `/wien/innere-stadt/inserate` |

All URLs accept query parameters: `?page=2&minPrice=800&limited=true&sortBy=price&...`

---

## File Organization

```mermaid
graph LR
    A[app/] --> B[root.tsx]
    A --> C[routes.ts]
    A --> D[routes/]
    A --> E[services/]
    A --> F[components/]
    A --> G[lib/]

    D --> D1[_app.tsx - Layout]
    D --> D2[_app._index.tsx - Map]
    D --> D3[_app.inserate.tsx - Listings]

    E --> E1[regions.server.ts]
    E --> E2[listings.server.ts]
    E --> E3[statistics.server.ts]
    E --> E4[map.server.ts]

    F --> F1[sidebar/]
    F --> F2[map/]
    F --> F3[listings/]
    F --> F4[charts/]

    G --> G1[params.ts - Zod schemas]
    G --> G2[db.server.ts - Database]
    G --> G3[constants.ts - States/Districts]

    style A fill:#e63946,color:#fff
    style D fill:#457b9d,color:#fff
    style E fill:#2a9d8f,color:#fff
    style F fill:#f4a261,color:#fff
    style G fill:#e9c46a,color:#fff
```

### File Structure

**Routes** (3 files):

- `app/root.tsx` - Root HTML, styles, error boundary
- `app/routes/_app.tsx` - Layout with sidebar loader
- `app/routes/_app._index.tsx` - Map view (handles all geographic levels)
- `app/routes/_app.inserate.tsx` - Listings view (handles all geographic levels)

**Services** (4 files):

- `app/services/regions.server.ts` - Region metadata and stats
- `app/services/listings.server.ts` - Listing queries with filtering
- `app/services/statistics.server.ts` - Aggregated statistics for charts
- `app/services/map.server.ts` - Map marker data with bounds

**Components** (organized by domain):

- `app/components/sidebar/` - Sidebar, region list, stats
- `app/components/map/` - Map, markers, legend
- `app/components/listings/` - Grid, cards, pagination
- `app/components/charts/` - Price, distribution, trend charts

**Lib** (shared utilities):

- `app/lib/params.ts` - Zod schemas for validation
- `app/lib/db.server.ts` - Database client configuration
- `app/lib/constants.ts` - Austrian states and districts

---

## Service Layer Architecture

### Design Principles

```mermaid
graph TD
    A[Service Layer Principles] --> B[Flexible Region Handling]
    A --> C[Pure Functions]
    A --> D[Type Safety]
    A --> E[Composability]
    A --> F[Database Agnostic]

    B --> B1[0 regions = All Austria]
    B --> B2[1 region = Specific state/district]
    B --> B3[N regions = Multiple states]

    C --> C1[No side effects]
    C --> C2[Testable in isolation]

    D --> D1[Zod validation]
    D --> D2[TypeScript throughout]

    E --> E1[Services can call services]
    E --> E2[Shared query builders]

    F --> F1[Receives db client as param]
    F --> F2[Works with SQLite or D1]

    style A fill:#e63946,color:#fff
    style B fill:#2a9d8f,color:#fff
    style C fill:#2a9d8f,color:#fff
    style D fill:#2a9d8f,color:#fff
    style E fill:#2a9d8f,color:#fff
    style F fill:#2a9d8f,color:#fff
```

### Service Function Signature Pattern

All service functions follow this pattern:

- **Input**: Database client + Region filter (optional) + Query params (filters, pagination, sorting)
- **Output**: Type-safe data structures
- **Responsibility**: Build Drizzle queries, execute, transform results

### Region Filter Flexibility

```mermaid
graph LR
    A[Region Filter] --> B{How many regions?}
    B -->|None| C[Query all Austria]
    B -->|1 State| D[Filter by state]
    B -->|1 District| E[Filter by state + district]
    B -->|Multiple States| F[Filter by state IN]

    C --> G[Return all data]
    D --> G
    E --> G
    F --> G

    style A fill:#e63946,color:#fff
    style B fill:#457b9d,color:#fff
    style G fill:#2a9d8f,color:#fff
```

### Four Core Services

```mermaid
graph TD
    A[Service Layer] --> B[RegionsService]
    A --> C[ListingsService]
    A --> D[StatisticsService]
    A --> E[MapService]

    B --> B1[getAllStates]
    B --> B2[getRegionStats]
    B --> B3[validateRegion]

    C --> C1[getListings]
    C --> C2[getListingById]
    C --> C3[Count listings]

    D --> D1[getStatistics]
    D --> D2[getPriceDistribution]
    D --> D3[getDurationStats]

    E --> E1[getMapData]
    E --> E2[calculateBounds]
    E --> E3[getMapCenter]

    style A fill:#e63946,color:#fff
    style B fill:#2a9d8f,color:#fff
    style C fill:#2a9d8f,color:#fff
    style D fill:#2a9d8f,color:#fff
    style E fill:#2a9d8f,color:#fff
```

#### 1. RegionsService

**Purpose**: Provide region metadata for sidebar and validation

**Functions**:

- `getAllStates()` - Returns all Austrian states with listing counts
- `getRegionStats(filter)` - Returns statistics for specified region(s)
- `validateRegion(state, district)` - Checks if region exists, throws 404 if not

**Used By**: App layout loader, all route loaders for validation

#### 2. ListingsService

**Purpose**: Fetch and filter rental listings

**Functions**:

- `getListings(regionFilter, queryParams)` - Paginated listings with filters
- `getListingById(id)` - Single listing detail
- `countListings(regionFilter, queryParams)` - Total count for pagination

**Region Handling**:

- No filter: Query all listings
- State filter: `WHERE state = ?`
- District filter: `WHERE state = ? AND district = ?`
- Multiple states: `WHERE state IN (?)`

**Query Params Handled**:

- Pagination: `page`, `perPage`
- Sorting: `sortBy`, `order`
- Filters: `minPrice`, `maxPrice`, `minArea`, `maxArea`, `limited`, `unlimited`, `rooms`, `furnished`, `search`

#### 3. StatisticsService

**Purpose**: Generate aggregated statistics for charts

**Functions**:

- `getStatistics(regionFilter, queryParams)` - Full statistics summary
- `getPriceDistribution(regionFilter, queryParams)` - Price ranges with counts
- `getDurationStats(regionFilter, queryParams)` - Limited vs unlimited breakdown

**Statistics Calculated**:

- Price: average, median, min, max, distribution
- Area: average, median
- Price per sqm: average, median
- Duration: limited count, unlimited count, average months
- Total listings count

**Same Filters**: Applies same query filters as ListingsService for consistency

#### 4. MapService

**Purpose**: Provide lightweight data for map visualization

**Functions**:

- `getMapData(regionFilter, queryParams)` - Listings with coordinates only
- `calculateBounds(listings)` - Geographic bounding box
- `getMapCenter(regionFilter)` - Default center point for region

**Data Optimization**:

- Returns only: `id`, `price`, `area`, `isLimited`, `lat`, `lng`
- Excludes: title, description, seller info, features
- Significantly smaller payload than full listings

**Same Filters**: Applies same query filters for consistency with listings view

---

## Route Responsibilities

### Clear Separation of Concerns

```mermaid
graph TD
    A[Route File] --> B[Loader Function]
    A --> C[Component Function]

    B --> B1[Extract Params]
    B --> B2[Validate with Zod]
    B --> B3[Call Service Layer]
    B --> B4[Handle Errors]
    B --> B5[Return Data + Headers]

    C --> C1[Receive Loader Data]
    C --> C2[Render Components]
    C --> C3[Handle User Interactions]
    C --> C4[Update URL on Filter Changes]

    B3 --> D[Service Layer]
    D --> E[React Component]
    E --> C1

    style A fill:#e63946,color:#fff
    style B fill:#457b9d,color:#fff
    style C fill:#2a9d8f,color:#fff
    style D fill:#f4a261,color:#fff
    style E fill:#e9c46a,color:#fff
```

### Route File Responsibilities

#### 1. App Layout Route (`_app.tsx`)

**Loader**:

- No params to extract (always shows all regions)
- Call `RegionsService.getAllStates()`
- Set cache headers (regions data changes infrequently)
- Return region list with stats

**Component**:

- Render sidebar with region list
- Highlight active region based on URL
- Render `<Outlet />` for child routes
- Handle mobile sidebar toggle

**Meta**:

- Set page title
- Set Open Graph tags

#### 2. Index Route - Map View (`_app._index.tsx`)

**Loader**:

- Extract `state` and `district` from path params (both optional)
- Extract query params from URL search
- Validate with Zod schemas
- Validate region exists (call `RegionsService.validateRegion()`)
- Parallel fetch:
  - `MapService.getMapData(regionFilter, queryParams)`
  - `StatisticsService.getStatistics(regionFilter, queryParams)`
- Handle errors (404 for invalid region, 500 for server errors)
- Set cache headers (data changes hourly)
- Return map data + statistics

**Component**:

- Render map with markers
- Render statistics charts
- Render active filters display
- Render filter controls (form that updates URL)
- Handle map interactions (marker clicks)

**Meta**:

- Dynamic title based on region (e.g., "Befristete Wohnungen in Wien")
- Dynamic description with statistics
- Canonical URL

#### 3. Inserate Route - Listings View (`_app.inserate.tsx`)

**Loader**:

- Extract `state` and `district` from path params (both optional)
- Extract query params from URL search
- Validate with Zod schemas
- Validate region exists (call `RegionsService.validateRegion()`)
- Fetch:
  - `ListingsService.getListings(regionFilter, queryParams)`
- Handle errors (404 for invalid region, 500 for server errors)
- Set cache headers (data changes hourly)
- Return paginated listings

**Component**:

- Render listings grid
- Render pagination controls
- Render active filters display
- Render filter controls (form that updates URL)
- Handle listing card interactions

**Meta**:

- Dynamic title based on region and filters
- Dynamic description with count
- Canonical URL
- Pagination rel links (prev/next)

---

## Data Flow

### Request to Response Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Router
    participant Loader
    participant Zod
    participant Service
    participant Drizzle
    participant Database
    participant Component

    User->>Browser: Navigate to /wien/inserate?minPrice=800
    Browser->>Router: Match route: _app.inserate.tsx
    Router->>Loader: Execute loader function
    Loader->>Loader: Extract params: {state: "wien"}
    Loader->>Loader: Extract query: {minPrice: 800, ...}
    Loader->>Zod: Validate params
    Zod-->>Loader: Valid params
    Loader->>Service: ListingsService.getListings(regionFilter, query)
    Service->>Service: Build Drizzle query
    Service->>Drizzle: Execute query with filters
    Drizzle->>Database: SQL query
    Database-->>Drizzle: Raw results
    Drizzle-->>Service: Typed results
    Service->>Service: Transform to response format
    Service-->>Loader: {listings, pagination, filters}
    Loader->>Loader: Set cache headers
    Loader-->>Router: Return data
    Router->>Component: Render with data
    Component-->>Browser: HTML response
    Browser-->>User: Display listings
```

### URL Update Flow (Filter Change)

```mermaid
sequenceDiagram
    participant User
    participant Form
    participant Browser
    participant Router
    participant Loader
    participant Service

    User->>Form: Change filter (minPrice = 800)
    Form->>Browser: Update URL query param
    Browser->>Router: Navigate to new URL
    Router->>Loader: Re-execute loader
    Loader->>Service: Call with new filters
    Service-->>Loader: New filtered data
    Loader-->>Router: Return new data
    Router->>Router: Re-render component
    Router-->>User: Updated listings displayed

    Note over Browser,Router: No page reload<br/>Just data refetch
```

### Service Layer Internal Flow

```mermaid
graph TD
    A[Service Function Called] --> B{Region Filter?}
    B -->|None| C[Build base query]
    B -->|State| D[Add WHERE state = ?]
    B -->|District| E[Add WHERE state = ? AND district = ?]

    C --> F{Apply Query Filters}
    D --> F
    E --> F

    F --> G[Price filters]
    F --> H[Area filters]
    F --> I[Duration filters]
    F --> J[Other filters]

    G --> K[Add sorting]
    H --> K
    I --> K
    J --> K

    K --> L[Add pagination]
    L --> M[Execute Drizzle query]
    M --> N[Transform results]
    N --> O[Return typed data]

    style A fill:#e63946,color:#fff
    style B fill:#457b9d,color:#fff
    style F fill:#457b9d,color:#fff
    style M fill:#2a9d8f,color:#fff
    style O fill:#f4a261,color:#fff
```

---

## Product Architecture

### User Journey - Exploring Listings

```mermaid
graph TD
    A[User lands on /] --> B[See Austria map + stats]
    B --> C{What does user do?}

    C -->|Click state in sidebar| D[Navigate to /:state]
    C -->|Apply filters| E[URL updates with query params]
    C -->|Click 'View Listings'| F[Navigate to /inserate]

    D --> G[See state-level map + stats]
    G --> H{What next?}

    H -->|Click district| I[Navigate to /:state/:district]
    H -->|Apply filters| J[URL updates with query params]
    H -->|Click 'View Listings'| K[Navigate to /:state/inserate]

    F --> L[See Austria-wide listings]
    L --> M{What next?}

    M -->|Click state in sidebar| N[Navigate to /:state/inserate]
    M -->|Apply filters| O[URL updates with query params]
    M -->|Paginate| P[URL updates page param]
    M -->|Click listing| Q[Open listing URL in new tab]

    style A fill:#e63946,color:#fff
    style D fill:#457b9d,color:#fff
    style F fill:#2a9d8f,color:#fff
    style I fill:#f4a261,color:#fff
    style N fill:#e9c46a,color:#fff
```

### View Switching - Map ↔ Listings

```mermaid
stateDiagram-v2
    [*] --> MapViewAustria: Land on /
    MapViewAustria --> MapViewState: Click state (sidebar)
    MapViewState --> MapViewDistrict: Click district (map/sidebar)

    MapViewAustria --> ListingsViewAustria: Click "View Listings"
    MapViewState --> ListingsViewState: Click "View Listings"
    MapViewDistrict --> ListingsViewDistrict: Click "View Listings"

    ListingsViewAustria --> MapViewAustria: Click "View Map"
    ListingsViewState --> MapViewState: Click "View Map"
    ListingsViewDistrict --> MapViewDistrict: Click "View Map"

    ListingsViewAustria --> ListingsViewState: Click state (sidebar)
    ListingsViewState --> ListingsViewDistrict: Click district (sidebar)

    MapViewDistrict --> MapViewState: Back button
    MapViewState --> MapViewAustria: Back button
    ListingsViewDistrict --> ListingsViewState: Back button
    ListingsViewState --> ListingsViewAustria: Back button
```

### Filter Application Flow

```mermaid
graph LR
    A[User opens filter panel] --> B[Set multiple filters]
    B --> C[minPrice: 800]
    B --> D[maxPrice: 1500]
    B --> E[limited: true]
    B --> F[rooms: 2]

    C --> G[Click Apply]
    D --> G
    E --> G
    F --> G

    G --> H[Form updates URL]
    H --> I[URL: ?minPrice=800&maxPrice=1500&limited=true&rooms=2]
    I --> J[Loader re-runs]
    J --> K[Service applies filters]
    K --> L[Results update]

    L --> M{User satisfied?}
    M -->|No| N[Adjust filters]
    M -->|Yes| O[Share URL or bookmark]

    N --> B

    style A fill:#e63946,color:#fff
    style G fill:#457b9d,color:#fff
    style J fill:#2a9d8f,color:#fff
    style O fill:#f4a261,color:#fff
```

### Geographic Drill-Down

```mermaid
graph TD
    A[Austria Level] --> B[9 States]
    B --> C[State Level: Wien]
    B --> D[State Level: Tirol]
    B --> E[State Level: Salzburg]

    C --> F[23 Districts in Wien]
    F --> G[District: Innere Stadt]
    F --> H[District: Leopoldstadt]
    F --> I[District: Landstraße]

    D --> J[9 Districts in Tirol]
    J --> K[District: Innsbruck-Stadt]
    J --> L[District: Kufstein]

    E --> M[6 Districts in Salzburg]
    M --> N[District: Salzburg-Stadt]
    M --> O[District: Hallein]

    style A fill:#e63946,color:#fff
    style C fill:#457b9d,color:#fff
    style D fill:#457b9d,color:#fff
    style E fill:#457b9d,color:#fff
    style G fill:#2a9d8f,color:#fff
    style H fill:#2a9d8f,color:#fff
    style K fill:#2a9d8f,color:#fff
    style N fill:#2a9d8f,color:#fff
```

---

## Key Benefits

### Architecture Benefits

```mermaid
mindmap
  root((Simplified<br/>Architecture))
    Route Simplification
      3 route files instead of 7
      Less duplication
      Easier to maintain
      Single source for each view
    Service Flexibility
      Handles any region combination
      Reusable across routes
      Easy to test
      Composable functions
    Type Safety
      Zod validation at entry
      TypeScript throughout
      Catch errors at compile time
      No runtime surprises
    URL as State
      Shareable links
      Browser back/forward works
      Bookmarkable searches
      No client state complexity
    Performance
      Server-side rendering
      Single fetch per page
      Efficient SQL queries
      Proper caching headers
    Developer Experience
      Clear responsibilities
      Easy to reason about
      Follows web standards
      Progressive enhancement
```

### User Benefits

```mermaid
graph LR
    A[User Benefits] --> B[Fast Page Loads]
    A --> C[Shareable URLs]
    A --> D[Works Without JS]
    A --> E[Browser Navigation Works]

    B --> B1[Server-side rendering]
    B --> B2[Efficient queries]
    B --> B3[Proper caching]

    C --> C1[Filter states in URL]
    C --> C2[Send link to colleague]
    C --> C3[Bookmark searches]

    D --> D1[Progressive enhancement]
    D --> D2[Forms work with JS off]
    D --> D3[Accessible by default]

    E --> E1[Back button works]
    E --> E2[Forward button works]
    E --> E3[History preserved]

    style A fill:#e63946,color:#fff
    style B fill:#2a9d8f,color:#fff
    style C fill:#2a9d8f,color:#fff
    style D fill:#2a9d8f,color:#fff
    style E fill:#2a9d8f,color:#fff
```

---

## Implementation Checklist

### Phase 1: Core Structure

- [ ] Create `routes.ts` configuration with 3 routes
- [ ] Implement root layout with error boundary
- [ ] Create param validation schemas in `lib/params.ts`
- [ ] Set up database client in `lib/db.server.ts`
- [ ] Define Austrian states and districts in `lib/constants.ts`

### Phase 2: Service Layer

- [ ] Implement `RegionsService` with all functions
- [ ] Implement `ListingsService` with filtering logic
- [ ] Implement `StatisticsService` with aggregations
- [ ] Implement `MapService` with bounds calculation
- [ ] Write unit tests for each service

### Phase 3: Route Loaders

- [ ] Implement app layout loader (sidebar data)
- [ ] Implement index route loader (map + statistics)
- [ ] Implement inserate route loader (listings)
- [ ] Add error handling to all loaders
- [ ] Add cache headers to all loaders

### Phase 4: Components

- [ ] Build sidebar components (region list, stats)
- [ ] Build map components (map, markers, legend)
- [ ] Build chart components (price, distribution, trends)
- [ ] Build listings components (grid, cards, pagination)
- [ ] Build filter controls (form that updates URL)

### Phase 5: Polish

- [ ] Add meta tags to all routes
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error boundaries
- [ ] Test with real data
- [ ] Optimize SQL queries
- [ ] Test on mobile devices
- [ ] Add analytics tracking

---

## Next Steps

**Ready for implementation** - This architecture provides:

- Clear route structure (3 files instead of 7)
- Flexible service layer (handles any region combination)
- Type-safe data flow (Zod + TypeScript)
- Separation of concerns (routes → services → components)
- Visual diagrams for the entire system

**Start with**: Service layer implementation, as routes and components depend on service interfaces.
