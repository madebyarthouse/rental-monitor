# Befristungs-Monitor: Rebuild Plan (Fresh Start)

**Created**: January 2025
**Timeline**: 7 days to launch
**Stakeholder Presentation**: Day 4

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Architecture Philosophy](#architecture-philosophy)
- [Why Rebuild?](#why-rebuild)
- [Phase 1: MVP for Presentation (Days 1-4)](#phase-1-mvp-for-presentation-days-1-4)
- [Phase 2: Production System](#phase-2-production-system)
- [Technical Specifications](#technical-specifications)
- [Risk Mitigation](#risk-mitigation)

---

## Executive Summary

**Goal**: Launch a production-ready Austrian rental market analytics platform in 7 days.

**Strategy**: Start fresh with a clean repository, rebuild systematically in 2 phases:

1. **Phase 1 (Days 1-4)**: MVP with clean UI, regions, and listing data for stakeholder presentation
2. **Phase 2 (Post-presentation)**: Production scraping system, admin dashboard, launch prep

**Key Decisions**:
- ✅ Fresh repository (avoid legacy code issues)
- ✅ **React Router 7 loaders** as data layer (no tRPC, no React Query)
- ✅ **URL as single source of truth** (path + query params for all state)
- ✅ **Service layer pattern** (clean separation: routes → services → database)
- ✅ **Drizzle ORM** for type-safe database queries
- ✅ Simplified map approach (bounds-based, no complex zoom logic)
- ✅ Mobile-first responsive design
- ✅ Momentum Institut branding
- ✅ shadcn/ui component library

---

## Architecture Philosophy

### Core Principles

**1. URL-Driven State**
- ALL application state lives in the URL (path + query params)
- No client-side state management libraries needed
- Browser back/forward works perfectly
- Shareable links to any filtered view
- Example: `/:state?page=2&minPrice=500&sortBy=price&limited=true`

**2. React Router 7 as Data Layer**
- Loaders fetch data on server-side (SSR)
- Loaders are thin wrappers that call service layer
- Type-safe params with Zod validation
- **No tRPC, no React Query** - just standard web platform

**3. Service Layer Architecture**

```
Route Loader
    ↓ (validates params, passes to service)
Service Layer
    ↓ (business logic, data aggregation)
Drizzle Queries
    ↓ (type-safe SQL)
Database (D1)
```

**4. Unified Param Handling**
- Same Zod schemas used in both frontend and backend
- Define once in `app/lib/params.ts`
- Validate in loaders
- Type safety from URL → Database
- No param mismatches or type errors

**5. Server-Side Rendering First**
- Initial page load is fully rendered HTML
- Fast Time to First Byte (TTFB)
- SEO-friendly out of the box
- Progressive enhancement for interactions
- No loading spinners after initial load

### Data Flow

**URL Example**: `/:state?page=2&minPrice=500&sortBy=price`

**Flow**:
1. React Router extracts params: `{ state: "wien", page: "2", minPrice: "500", sortBy: "price" }`
2. Loader validates with Zod schema from `params.ts`
3. Loader calls `ListingsService.getFiltered(validatedParams)`
4. Service builds Drizzle query with filters
5. Service returns typed data
6. Loader returns data to component
7. Component renders (no client-side fetching needed)

**Benefits**:
- Single fetch on page load (no waterfalls)
- No client-side state sync issues
- Simple mental model
- Standard web platform patterns

---

## Why Rebuild?

### Problems with Current Codebase

1. **DerStandard scraper broken** (no pagination, random IDs)
2. **846 lines of dead code** (unused Willhaben headless scraper)
3. **JSON/Database sync issues** (dual data sources)
4. **District navigation disabled** (incomplete feature)
5. **No integration tests** for critical scrapers
6. **tRPC/React Query complexity** (over-engineering for this use case)
7. **Circular dependencies** and redundant queries

### Benefits of Fresh Start

1. **Clean slate**: No legacy issues to work around
2. **Faster development**: Build only what's needed
3. **Better architecture**: Apply lessons learned
4. **Simpler stack**: React Router 7 handles all data needs
5. **Testable**: Write tests alongside code
6. **Maintainable**: Consistent patterns, clear structure

---

## Phase 1: MVP for Presentation (Days 1-4)

### Success Criteria

**By Day 4 Presentation**:
- ✅ Polished UI (desktop + mobile) with Momentum Institut branding
- ✅ Browse Austria → States → Districts with interactive map
- ✅ Listing data loaded and filterable
- ✅ Paginated listings table with sorting
- ✅ Heatmap visualization on region bounds
- ✅ Basic charts and statistics
- ✅ Responsive, fast, deployable to Cloudflare

---

## Day 1: Clean Foundation (8 hours)

**Goal**: Deployable app with UI, branding, and region navigation (NO listing data yet)

### 1.1 Project Setup (1h)

**Steps**:
1. Create fresh repository: `befristungs-monitor-v2`
2. Initialize React Router v7 with Cloudflare template
3. Install dependencies:
   - Database: drizzle-orm, better-sqlite3
   - UI: shadcn/ui components
   - Maps: leaflet, react-leaflet
   - Charts: recharts
   - Validation: zod
   - Icons: lucide-react
   - Utils: clsx, tailwind-merge

**File Structure**:
```
app/
├── routes/
│   ├── _index.tsx              # Austria view (loader + component)
│   ├── $state.tsx              # State view
│   └── $state.$district.tsx    # District view
├── services/
│   ├── regions.service.ts      # Region Drizzle queries
│   ├── listings.service.ts     # Listing Drizzle queries
│   ├── heatmap.service.ts      # Heatmap calculations
│   └── charts.service.ts       # Chart aggregations
├── lib/
│   ├── params.ts               # Zod schemas for URL params
│   ├── db.ts                   # Database client
│   └── utils.ts                # Helpers
├── components/
│   ├── ui/                     # shadcn components
│   ├── layout/                 # App shell, sidebar, header
│   ├── map/                    # Map, heatmap
│   ├── listings/               # Table, cards
│   └── charts/                 # Chart grid
└── styles/
    ├── globals.css             # Tailwind
    └── tokens.css              # Momentum design tokens

drizzle/
├── schema.ts                   # Database schema
├── seed-regions.ts             # Seed script
└── migrations/
```

### 1.2 Database Schema - Regions (1h)

**Regions Table**:
- `id` (PK): "at", "at-wien", "at-wien-favoriten"
- `name`: "Österreich", "Wien", "Favoriten"
- `slug`: URL-safe (for routing)
- `type`: 'country', 'state', 'district'
- `parentId` (FK): Hierarchy
- `centerLat`, `centerLng`: Geographic center
- `bounds`: JSON {north, south, east, west}
- `order`: Display order
- `population`, `postalCodes`: Metadata
- Timestamps

**Indexes**: slug, parentId, type

**Seed**: 1 country + 9 states + 23 Vienna districts + major cities

### 1.3 Momentum Branding (1.5h)

**Design Tokens** (`styles/tokens.css`):
- Colors: Primary #E63946, Secondary #457B9D
- Typography: Inter font, 12px-30px scale
- Spacing: 4px-32px
- Shadows, borders

**Branding Header**:
- Logo + "Befristungs-Monitor" title
- "Momentum Institut" subtitle
- Desktop: Horizontal nav
- Mobile: Sheet menu

### 1.4 App Shell & Layout (1.5h)

**Desktop Layout**:
- Fixed sidebar (320px) with Momentum branding
- Main content area (flex-1)
- Sidebar contains: Logo, stats, region list

**Mobile Layout**:
- Stacked layout
- Tabs at top (Karte, Inserate)
- Content below
- Footer with branding

### 1.5 Region Map Component (2h)

**Simple Bounds-Based Approach**:
- Leaflet map with OpenStreetMap tiles
- GeoJSON polygons for each sub-region
- No zoom logic - re-render map with new bounds on navigation
- Popup on hover showing region name
- Click handler to navigate

**Day 1 Map**:
- Shows region bounds as colored rectangles
- No heatmap data yet (placeholder colors)
- Clicking navigates to that region

### 1.6 Routes & Loaders (1.5h)

**Loader Pattern** (all routes follow this):

1. Parse URL params (state, district from path)
2. Parse query params (page, filters, etc.)
3. Validate with Zod schema
4. Call service layer method
5. Return data

**Route**: `app/routes/_index.tsx`
- Loader: Get Austria region + 9 states
- Component: Render map + state list

**Route**: `app/routes/$state.tsx`
- Loader: Get state region + districts
- Component: Render map + district list

**Service Layer** (`app/services/regions.service.ts`):
- `getById(id)`: Single region
- `getChildren(parentId)`: Sub-regions
- `getHierarchy(id)`: Breadcrumb path

All services receive database client, use Drizzle ORM

### 1.7 Param Schemas (0.5h)

**File**: `app/lib/params.ts`

Define Zod schemas for all URL params:
- Region params (state, district)
- Pagination (page, limit)
- Sorting (sortBy, sortOrder)
- Filters (minPrice, maxPrice, minArea, maxArea, limited, platforms)

Used in both loaders (validation) and components (types)

### Day 1 Deliverables

**End of Day 1 Checklist**:
- ✅ Fresh repo with React Router 7
- ✅ Momentum Institut branding applied
- ✅ Responsive layout (desktop + mobile)
- ✅ Database with regions table seeded
- ✅ Austria → States → Districts navigation working
- ✅ Interactive map with region bounds
- ✅ Sidebar with region list
- ✅ Placeholder tabs for listings and stats
- ✅ Deployed to Cloudflare
- ✅ **Presentable demo** showing navigation UX

---

## Day 2: Data Integration & Listings View (8 hours)

**Goal**: Import listing data, create paginated listings table with filters

### 2.1 Extend Database Schema (1h)

**Listings Table**:
- `id` (PK): MD5 hash
- `title`, `price`, `pricePerSqm`, `area`, `rooms`
- `regionId` (FK to regions)
- `zipCode` (for fallback)
- `isLimited`, `durationMonths`
- `platform`, `url` (unique)
- `isActive`
- `firstSeenAt`, `lastSeenAt`
- Timestamps

**Indexes**: regionId, price, isLimited, isActive

### 2.2 Import Script (2h)

**File**: `scripts/import-listings.ts`

**Logic**:
1. Load `latest.json` from old project
2. For each listing:
   - Map location data to `regionId` (zip → district, or state fallback)
   - Insert with Drizzle ORM
   - Use `onConflictDoNothing()` for idempotency
3. Log imported/skipped counts

**Mapping Strategy**:
- If zipCode exists → find region by postalCodes
- Else if state → find state region
- Else skip (log warning)

### 2.3 Listings Service (1.5h)

**File**: `app/services/listings.service.ts`

**Methods**:
- `getFiltered(params)`: Paginated query with filters
- `getStats(regionId)`: Aggregations (count, avg price, limited %)

**Filter Logic**:
- Build Drizzle `where` clause from params
- Apply filters: regionId, price range, area range, limited, platforms
- Order by: price, area, pricePerSqm, lastSeenAt
- Paginate with limit/offset

**Returns**: `{ items, total, page, totalPages, hasMore }`

### 2.4 Listings Table Component (2h)

**File**: `app/components/listings/listings-table.tsx`

**Features**:
- TanStack Table (headless)
- Columns: Title, Price, Area, Price/m², Contract type, Platform
- Sortable headers (updates URL on click)
- External link to original listing
- Badge for "Befristet" vs "Unbefristet"
- Responsive (stacked cards on mobile)

**Mobile View**:
- Card layout instead of table
- All key info visible
- "Ansehen" button to external URL

### 2.5 URL State Management (0.5h)

**Pattern** (used in all views):

**Reading State**:
- Use `useSearchParams()` hook
- Parse params with Zod schema
- Display current state

**Updating State**:
- User clicks sort header → call `setSearchParams({ ...current, sortBy: "price" })`
- React Router triggers loader with new params
- Page re-renders with new data

**Navigation**:
- Use `<Link>` components with query params
- Or `navigate()` programmatically

### 2.6 Update Routes with Listings (1h)

**Update all loaders** to fetch:
1. Region data (same as Day 1)
2. Listings data (new - call ListingsService)
3. Stats data (new - aggregations)

**Update components** to render:
- Map view: Keep as is (Day 1)
- Listings tab: Show table + pagination
- Stats tab: Show summary cards (placeholder for charts)

### Day 2 Deliverables

**End of Day 2 Checklist**:
- ✅ Listing data imported from old project
- ✅ Paginated listings table with sorting
- ✅ Filter UI in sidebar (price, area sliders)
- ✅ Stats summary cards
- ✅ Working navigation with data loading
- ✅ URL-based state (filters, sorting, pagination)
- ✅ All controlled via query params

---

## Day 3: Map View & Heatmap (8 hours)

**Goal**: Interactive heatmap on region bounds showing key metrics

### 3.1 Heatmap Service (2h)

**File**: `app/services/heatmap.service.ts`

**Methods**:
- `getHeatmapData(parentRegionId, metric)`: Returns array of region values
- `calculateMetric(regionId, metric)`: Aggregates data for one region

**Supported Metrics**:
- `limitedPercentage`: % of listings with limited contracts
- `avgPricePerSqm`: Average price per square meter
- `totalListings`: Count of listings

**Returns for each region**:
- regionId, regionName
- value (metric value)
- bounds (for rendering)

**Also Returns**:
- `metricRange`: min, max, avg, median, quintiles
- Used for color scale and legend

### 3.2 Heatmap Map Component (3h)

**File**: `app/components/map/heatmap-map.tsx`

**Features**:
- Leaflet map with GeoJSON layers
- Each sub-region colored by metric value
- Color scale: Green (low) → Yellow (mid) → Red (high)
- Metric selector (3 buttons above map)
- Legend showing color scale + values
- Popup on hover with region stats
- Click to navigate

**Color Scale Function**:
- Normalize value between min/max
- Map to 5-color gradient
- Apply as fillColor to GeoJSON polygon

**Metric Selector**:
- 3 buttons (limited %, price/m², count)
- Clicking updates URL param `?metric=limitedPercentage`
- Triggers loader re-fetch with new metric
- Map re-renders with new colors

### 3.3 Human-Readable Summary (1h)

**File**: `app/components/map/heatmap-summary.tsx`

**Purpose**: Accessibility + SEO

**Logic**:
1. Sort regions by metric value
2. Get top 3 and bottom 3
3. Generate text: "Die Bundesländer mit dem höchsten Anteil an befristeten Mietverträgen sind Wien, Salzburg, Tirol. Die niedrigsten Werte finden sich in Burgenland, Kärnten, Steiermark."

**Display**:
- Card below map
- 2-column layout: Highest vs Lowest
- Bullet list with region names + values
- Screen reader friendly

### 3.4 Integration & Testing (2h)

**Update Loaders**:
- Add heatmap data fetch to map tab
- Pass metric param from URL
- Return heatmapData + metricRange

**Component Integration**:
- Replace placeholder map with heatmap
- Wire up metric selector to URL state
- Show/hide summary based on tab

**Testing**:
- Test all 3 metrics
- Test navigation (clicking regions)
- Test mobile vs desktop
- Verify color scale accuracy

### Day 3 Deliverables

**End of Day 3 Checklist**:
- ✅ Heatmap visualization on map
- ✅ Color-coded regions by selected metric
- ✅ Legend with min/max/avg/median
- ✅ Metric selector (3 options)
- ✅ Hover popups with region stats
- ✅ Human-readable summary text
- ✅ Accessible alternative text for screen readers

---

## Day 4: Charts, Stats & Presentation Prep (8 hours)

**Goal**: Finalize with charts, polish UI, prepare presentation

### 4.1 Charts Service (1h)

**File**: `app/services/charts.service.ts`

**Methods**:
- `getPriceDistribution()`: Bar chart data (price ranges)
- `getAreaDistribution()`: Bar chart data (area ranges)
- `getContractTypeDistribution()`: Pie chart (limited vs unlimited)
- `getPlatformDistribution()`: Pie chart (willhaben vs derstandard)

**Returns**: Array of `{ label, count }` for charts

**Logic**: SQL GROUP BY queries with Drizzle

### 4.2 Charts Components (2h)

**File**: `app/components/charts/charts-grid.tsx`

**Layout**: 2x2 grid of cards

**Charts** (using Recharts):
1. Price Distribution (Bar Chart)
2. Area Distribution (Bar Chart)
3. Contract Type Distribution (Pie Chart)
4. Platform Distribution (Pie Chart)

**Features**:
- Responsive (stack on mobile)
- Tooltips on hover
- Legend
- Axis labels
- Color-coded (Momentum palette)

### 4.3 Stats Tab Integration (1h)

**Update Routes**:
- Fetch charts data in loader
- Pass to Stats tab component

**Component**:
- Show charts grid
- Show summary stats above
- Add human-readable insights

### 4.4 Mobile Optimization & Polish (2h)

**Tasks**:
- Test all routes on mobile devices
- Ensure responsive layouts
- Add loading skeletons
- Error boundaries for failed fetches
- Performance optimization:
  - Lazy load map component
  - Lazy load charts library
  - Optimize images
  - Minimize bundle size

**Loading States**:
- Skeleton loaders for cards
- Spinner for map
- Shimmer effect for charts

**Error States**:
- "Failed to load data" message
- Retry button
- Fallback content

### 4.5 Presentation Prep (2h)

**Materials**:
- Create slide deck with screenshots
- Prepare demo script
- Test user flows
- Document known limitations

**Deployment**:
- Final production build
- Deploy to Cloudflare Workers
- Test on production URL
- Set up custom domain (if needed)

**Analytics** (optional):
- Add simple pageview tracking
- Monitor performance metrics

### Day 4 Deliverables

**End of Day 4 Checklist**:
- ✅ All charts implemented and working
- ✅ Mobile-responsive on all pages
- ✅ Loading states and error handling
- ✅ Performance optimized
- ✅ Deployed to production
- ✅ Presentation materials ready
- ✅ **Ready for stakeholder demo**

---

## Phase 2: Production System (Post-Presentation)

### Week 2: Scraping System Refactor

**Goals**:
1. Rebuild scrapers with observability
2. Direct D1 writes (no JSON middleman)
3. Better error handling and logging
4. Deduplication at scrape-time
5. Resume/checkpoint support

**Tasks**:
- Fix DerStandard scraper (pagination, deterministic IDs)
- Remove Willhaben headless dead code
- Implement proper rate limiting
- Add scraping status tracking in database
- Database-first approach (no JSON files)

### Week 2-3: Admin Dashboard

**Goals**:
1. Authentication (better-auth)
2. Scraping run monitoring
3. Error log viewing
4. Manual data refresh triggers
5. Performance metrics

**Components**:
- Login page
- Dashboard overview
- Scraping runs table (sessions)
- Error logs viewer
- System health monitor
- Manual trigger buttons

### Week 3-4: Launch Prep

**Goals**:
1. SEO optimization
2. Meta tags and OG images
3. Sitemap generation
4. Performance audits (Lighthouse)
5. Security review
6. User feedback collection
7. Analytics setup

**Tasks**:
- Add meta tags to all routes
- Generate dynamic sitemaps
- Optimize images and fonts
- Security headers
- GDPR compliance (if needed)
- User feedback form
- Monitoring and alerts

---

## Technical Specifications

### Tech Stack

**Core**:
- **Framework**: React Router v7
- **Deployment**: Cloudflare Workers + D1
- **Database**: SQLite (local) / D1 (production)
- **ORM**: Drizzle
- **Validation**: Zod
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **State**: URL-based (React Router)

**No** tRPC, **No** React Query - React Router 7 handles all data needs

### Database Schema (Phase 1)

**Tables**:
1. `regions` - Geographic hierarchy
2. `listings` - Rental listings (simplified)

**Phase 2 additions**:
3. `sellers` - Seller profiles
4. `priceHistory` - Price tracking
5. `scrapingSessions` - Scraping runs

### URL Structure

**Paths**:
- `/` - Austria (country view)
- `/:state` - State view (e.g., `/wien`)
- `/:state/:district` - District view (e.g., `/wien/favoriten`)

**Query Params**:
- `?page=1` - Pagination
- `?sortBy=price&sortOrder=desc` - Sorting
- `?minPrice=500&maxPrice=2000` - Price filter
- `?minArea=50&maxArea=100` - Area filter
- `?limited=true` - Contract type filter
- `?platforms=willhaben,derstandard` - Platform filter
- `?metric=limitedPercentage` - Heatmap metric

### Loader Pattern

**Standard Loader Structure** (all routes):

1. Extract params from URL (path + query)
2. Validate with Zod schema
3. Get database client
4. Call service layer methods
5. Return data

**Service Layer Pattern**:

1. Receive validated params
2. Build Drizzle queries
3. Execute queries
4. Transform/aggregate data
5. Return typed results

**Param Schema Pattern**:

Define once in `app/lib/params.ts`, use everywhere:
- Loaders: validate incoming params
- Components: type-safe param access
- Services: know exact param shape

---

## Risk Mitigation

### High-Risk Items

**1. Data Import Issues**
- **Risk**: Location data doesn't map to regions
- **Mitigation**: Fallback mapping, log unmapped listings
- **Contingency**: Import as much as possible, show warnings

**2. Performance with Large Datasets**
- **Risk**: Slow queries on large regions (Wien)
- **Mitigation**: Database indexes, pagination, server-side filtering
- **Contingency**: Limit result sets, add search

**3. Mobile UX Complexity**
- **Risk**: Map/heatmap hard to use on small screens
- **Mitigation**: Simplified mobile view, drawer for filters
- **Contingency**: Mobile-first list view as default

**4. Tight Timeline**
- **Risk**: Can't finish all features by Day 4
- **Mitigation**: Prioritize core features (map + listings)
- **Contingency**: Hide incomplete tabs, add "Coming Soon" labels

### Medium-Risk Items

**5. GeoJSON Data Quality**
- **Risk**: Incorrect or missing bounds data
- **Mitigation**: Use OpenStreetMap data, validate bounds
- **Contingency**: Use simple center points + radius

**6. Chart Performance**
- **Risk**: Charts slow with many data points
- **Mitigation**: Sample data, lazy loading, pre-compute aggregations
- **Contingency**: Server-side chart rendering

### Low-Risk Items

**7. Branding Assets**
- **Risk**: Missing logos or fonts
- **Mitigation**: Use placeholders, Google Fonts
- **Contingency**: Simple text-based branding

---

## Summary

This plan provides a **realistic path to launch** in 7 days by:

1. **Starting fresh** to avoid legacy issues
2. **Using React Router 7** as the only data layer (no tRPC, no React Query)
3. **Building incrementally** with clear daily goals
4. **Prioritizing core features** for stakeholder presentation
5. **Deferring complexity** (scraping, admin) to Phase 2

**Key Success Factors**:
- URL-driven state (simple, standard web)
- Service layer pattern (clean separation)
- Zod param schemas (type safety)
- Drizzle ORM (type-safe queries)
- Momentum Institut branding throughout
- Mobile-first responsive design
- Bounds-based map (simpler than zoom levels)

This approach ensures a **polished, working demo** by Day 4 while setting up a foundation for the production system in Phase 2.
