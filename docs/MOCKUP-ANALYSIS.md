# Mockup Analysis & Design Breakdown

**Created**: January 2025
**Source**: User-provided mockups (4 screenshots)

---

## Table of Contents

1. [Overview](#overview)
2. [Mobile Design (Mockups 1-2)](#mobile-design-mockups-1-2)
3. [Desktop Design (Mockups 3-4)](#desktop-design-mockups-3-4)
4. [Component Breakdown](#component-breakdown)
5. [Design System](#design-system)
6. [Implementation Notes](#implementation-notes)
7. [Improvements & Recommendations](#improvements--recommendations)

---

## Overview

### Mockup Summary

**Total Mockups**: 4 screenshots
- **2 Mobile** (portrait, 390x844)
- **2 Desktop** (landscape, ~1440x900)

**Key Screens**:
1. Mobile Map View
2. Mobile Listings View
3. Desktop Map View with Charts
4. Desktop Listings View (pagination)

**Branding**: MOMENT.at (Momentum Institut)
**Color Scheme**: Orange (#E63946 primary) + neutral grays

---

## Mobile Design (Mockups 1-2)

### Mockup 1: Mobile Map View

**Layout Structure**:
```
┌─────────────────────────────────┐
│  Karte    Inserate              │ ← Tabs
├─────────────────────────────────┤
│                                 │
│     [Austria Map - Heatmap]     │
│                                 │
│                                 │
├─────────────────────────────────┤
│  Preisverteilung                │
│  [Bar Chart]                    │
├─────────────────────────────────┤
│  MOMENT.at                      │ ← Branding Footer
├─────────────────────────────────┤
│  Übersicht                      │
│  €18  11480  49%  71m²         │
├─────────────────────────────────┤
│  Bundesländer                   │
│  Wien →                         │
│  €20  2334  57%  74m²          │
└─────────────────────────────────┘
```

**Elements**:

1. **Top Tabs** (sticky)
   - "Karte" (active)
   - "Inserate"
   - Simple horizontal tabs, no icons

2. **Map Section** (60% viewport height)
   - Austria outline with colored regions
   - Heatmap visualization (green → yellow → orange → red)
   - Appears to show state-level data
   - No zoom controls visible
   - No legend shown on this view

3. **Preisverteilung Chart** (below map)
   - Bar chart icon + title
   - Blue bar chart showing price distribution
   - X-axis has ranges
   - Compact, scrollable view

4. **Momentum Branding** (full-width banner)
   - Coral/salmon background (#F4A688 or similar)
   - White "MOMENT.at" logo
   - Full width, moderate height (~80px)

5. **Übersicht Section** (summary stats)
   - 4 key metrics in grid:
     - €18 "Preis/m²" (with € icon)
     - 11,480 "Inserate" (with document icon)
     - 49% "Befristet" (with warning icon)
     - 71m² "Ø Fläche" (with area icon)
   - Icons are gray outlines
   - Values in bold, labels below

6. **Bundesländer Section** (region list)
   - Title: "Bundesländer"
   - Wien entry with right arrow →
   - Sub-metrics: €20 pro/m², 2334 Inserate, 57% befristet, 74m² Ø Fläche
   - Tappable card, likely expands or navigates

---

### Mockup 2: Mobile Listings View

**Layout Structure**:
```
┌─────────────────────────────────┐
│  Karte    Inserate              │ ← Tabs (Inserate active)
├─────────────────────────────────┤
│  Neueste zuerst  ▼   ↓          │ ← Sort + Filter
│  20 von 11480 Ergebnissen       │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ Einziehen. Durchatmen...│   │ ← Listing Card 1
│  │ • Linz                   │   │
│  │ €789.72  38.64m²  €20...│   │
│  │ willhaben  Befristet(60)│   │
│  │ [Ansehen →] [Aktiv]     │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ Wunderschöne Neubau...  │   │ ← Listing Card 2
│  │ • Wien                   │   │
│  │ €1,245  57m²  €21,842   │   │
│  │ willhaben  Befristet(60)│   │
│  │ [Ansehen →] [Aktiv]     │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  ... more listings ...          │
├─────────────────────────────────┤
│  MOMENT.at                      │
│  Übersicht + Bundesländer       │
│  (same as mockup 1)             │
└─────────────────────────────────┘
```

**Elements**:

1. **Tabs** (sticky)
   - "Inserate" now active (bold/underlined)

2. **Filter/Sort Bar**
   - Dropdown: "Neueste zuerst ▼"
   - Download icon (↓)
   - Result count: "20 von 11480 Ergebnissen"

3. **Listing Card** (repeating component)
   - **Title**: Bold, 2-line truncation with ellipsis
   - **Location**: Bullet point + city name
   - **Metrics Row**:
     - Price (bold, large): €789.72
     - Area: 38.64m²
     - Price per sqm: €20,438
   - **Meta Row**:
     - Platform badge: "willhaben"
     - Contract type badge: "Befristet (60 Monate)" (orange/red)
   - **Action Button**: "Ansehen →" (link to external listing)
   - **Status Badge**: "Aktiv" (purple/blue, top-right)
   - White background, subtle shadow
   - Rounded corners (~8px)
   - Padding: 16px

4. **Footer** (same as mockup 1)
   - MOMENT.at branding
   - Übersicht stats
   - Bundesländer list

---

## Desktop Design (Mockups 3-4)

### Mockup 3: Desktop Map View

**Layout Structure**:
```
┌──────────────┬────────────────────────────────────────────────┐
│              │  Karte    Inserate                             │
│  MOMENT.at   ├────────────────────────────────────────────────┤
│              │  ━━━━━━ 22% ━━━━━━━━━━━━━━━━━ 76% ━━━━━━━━   │ ← Horizontal bar
│  Übersicht   │                                                │
│  €18  11480  │                                                │
│  49%  71m²   │         [Austria Map - Heatmap]                │
│              │                                                │
│ Bundesländer │                                                │
│  Wien →      │                                                │
│  Steiermark  │                                                │
│  Niederöst.  ├────────────────────────────────────────────────┤
│  Oberöst.    │ % befristet | Preis pro m2 | Anzahl Inserate  │ ← Metric selector
│  Kärnten     ├────────────────────────────────────────────────┤
│  Burgenland  │  ┌──────────────────┐  ┌───────────────────┐  │
│  Tirol       │  │ Preisverteilung  │  │ Fläche vs. Preis  │  │
│  Salzburg    │  │  [Bar Chart]     │  │ [Scatter Plot]    │  │
│  Vorarlberg  │  └──────────────────┘  └───────────────────┘  │
└──────────────┴────────────────────────────────────────────────┘
```

**Key Differences from Mobile**:

1. **Sidebar Layout** (left, fixed, 320px)
   - MOMENT.at branding at top
   - Übersicht stats (4 metrics in 2x2 grid)
   - Bundesländer list (scrollable)
   - Each state shows 4 metrics inline
   - Right arrow (→) for navigation
   - Hover state likely changes background

2. **Main Area** (right, flexible width)
   - Tabs at top (Karte active)
   - Horizontal summary bar showing distribution
     - Green-Blue-Yellow-Red color segments
     - Percentages: 22% and 76% marked
     - Likely shows limited vs. unlimited contracts
   - Large map (60% of main area height)
   - Metric selector below map (3 buttons)
   - Charts grid below (2 columns)

3. **Map Enhancements**
   - Larger, more detailed
   - All districts visible
   - Color-coded regions
   - Likely has hover tooltips

4. **Horizontal Bar Chart** (above map)
   - Full-width progress bar style
   - Color-coded segments
   - Shows aggregate distribution
   - 0% to 100% scale

5. **Metric Selector** (below map)
   - Three options (radio buttons or tabs):
     - "% befristet"
     - "Preis pro m2"
     - "Anzahl an Inseraten"
   - Changes heatmap coloring

6. **Charts Grid**
   - 2-column layout
   - Left: "Preisverteilung" (Price Distribution)
     - Bar chart
     - X-axis: price ranges
     - Y-axis: count
   - Right: "Fläche vs. Preis" (Area vs. Price)
     - Scatter plot
     - X-axis: area (m²)
     - Y-axis: price (€)
     - Green dots

---

### Mockup 4: Desktop Listings View

**Layout Structure**:
```
┌──────────────┬────────────────────────────────────────────────┐
│              │  Karte    Inserate                             │
│  MOMENT.at   ├────────────────────────────────────────────────┤
│              │                                                │
│  Übersicht   │                                                │
│  €18  11480  │                                                │
│  49%  71m²   │           [Empty/Listings Table Area]          │
│              │                                                │
│ Bundesländer │                                                │
│  Wien →      │                                                │
│  Steiermark  │                                                │
│  Niederöst.  │                                                │
│  Oberöst.    │                                                │
│  Kärnten     │                                                │
│  Burgenland  ├────────────────────────────────────────────────┤
│  Tirol       │  ← Previous  1  2  3  ...  Next →             │ ← Pagination
│  Salzburg    │                                                │
│  Vorarlberg  │                                                │
└──────────────┴────────────────────────────────────────────────┘
```

**Key Elements**:

1. **Pagination** (bottom center)
   - "← Previous" button
   - Page numbers: 1, 2, 3
   - Ellipsis: "..."
   - "Next →" button
   - Current page highlighted
   - Clean, minimal design

2. **Empty Content Area**
   - Appears to be placeholder for listings table
   - Would show paginated results
   - Likely table or card grid layout

---

## Component Breakdown

### 1. App Shell

**Desktop**:
```tsx
<div className="flex h-screen">
  <Sidebar /> {/* Fixed left, 320px */}
  <Main />    {/* Flex-1, scrollable */}
</div>
```

**Mobile**:
```tsx
<div className="flex flex-col h-screen">
  <Tabs />
  <Content /> {/* Scrollable */}
  <Footer />  {/* Sticky bottom */}
</div>
```

---

### 2. Sidebar (Desktop Only)

**Structure**:
```tsx
<aside className="w-80 border-r bg-white flex flex-col">
  {/* Branding */}
  <div className="bg-[#F4A688] p-6">
    <h1>MOMENT.at</h1>
  </div>

  {/* Overview Stats */}
  <div className="p-4 border-b">
    <h2>Übersicht</h2>
    <div className="grid grid-cols-2 gap-3">
      <Stat icon={Euro} label="Preis/m²" value="€18" />
      <Stat icon={FileText} label="Inserate" value="11 480" />
      <Stat icon={AlertTriangle} label="Befristet" value="49%" />
      <Stat icon={Square} label="Ø Fläche" value="71m²" />
    </div>
  </div>

  {/* States List */}
  <div className="flex-1 overflow-y-auto">
    <h2 className="p-4 font-semibold">Bundesländer</h2>
    <nav>
      <StateItem name="Wien" stats={...} />
      <StateItem name="Steiermark" stats={...} />
      {/* ... */}
    </nav>
  </div>
</aside>
```

**StateItem Component**:
```tsx
<button className="w-full p-4 hover:bg-gray-50 border-b flex items-center justify-between">
  <div className="flex-1">
    <h3 className="font-semibold text-left">Wien</h3>
    <div className="flex gap-3 text-sm text-gray-600 mt-1">
      <span className="text-orange-500">€20</span>
      <span>2334 Inserate</span>
      <span className="text-orange-500">57% befristet</span>
      <span>74m²</span>
    </div>
  </div>
  <ChevronRight className="h-5 w-5 text-gray-400" />
</button>
```

---

### 3. Tabs Component

**Mobile** (simple):
```tsx
<div className="flex border-b bg-white sticky top-0 z-10">
  <button className={cn("flex-1 py-3 font-semibold", isActive && "border-b-2 border-orange-500")}>
    Karte
  </button>
  <button className={cn("flex-1 py-3 font-semibold", isActive && "border-b-2 border-orange-500")}>
    Inserate
  </button>
</div>
```

**Desktop** (integrated in header):
```tsx
<div className="flex items-center gap-6 px-6 py-4 border-b">
  <Link to="/" className={cn("font-semibold", isActive && "text-orange-500")}>
    Karte
  </Link>
  <Link to="/inserate" className={cn("font-semibold", isActive && "text-orange-500")}>
    Inserate
  </Link>
</div>
```

---

### 4. Map View Components

#### a. Distribution Bar (Desktop)

```tsx
<div className="flex items-center gap-2 px-6 py-3 bg-gray-50">
  <span className="text-sm">0%</span>
  <div className="flex-1 h-8 flex rounded overflow-hidden">
    <div style={{ width: "22%", backgroundColor: "#10B981" }} /> {/* Green */}
    <div style={{ width: "54%", backgroundColor: "#3B82F6" }} /> {/* Blue */}
    <div style={{ width: "10%", backgroundColor: "#FBBF24" }} /> {/* Yellow */}
    <div style={{ width: "14%", backgroundColor: "#EF4444" }} /> {/* Red */}
  </div>
  <span className="text-sm">100%</span>

  {/* Labels */}
  <div className="absolute left-[22%] top-0">
    <div className="border-l-2 border-gray-800 h-8" />
    <span className="text-sm font-bold">22%</span>
  </div>
  <div className="absolute right-[24%] top-0">
    <div className="border-l-2 border-gray-800 h-8" />
    <span className="text-sm font-bold">76%</span>
  </div>
</div>
```

#### b. Map Container

```tsx
<div className="relative h-[500px] bg-gray-100">
  <MapContainer
    center={[47.5162, 14.5501]}
    zoom={7}
    className="h-full w-full"
  >
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

    {regions.map(region => (
      <GeoJSON
        key={region.id}
        data={region.bounds}
        style={{
          fillColor: getHeatmapColor(region.value),
          fillOpacity: 0.7,
          color: "#1D3557",
          weight: 1,
        }}
      />
    ))}
  </MapContainer>
</div>
```

#### c. Metric Selector

```tsx
<div className="flex justify-center gap-4 p-4 border-b">
  <button className={cn("px-4 py-2 rounded", metric === "limited" && "bg-orange-100")}>
    % befristet
  </button>
  <button className={cn("px-4 py-2 rounded", metric === "price" && "bg-orange-100")}>
    Preis pro m2
  </button>
  <button className={cn("px-4 py-2 rounded", metric === "count" && "bg-orange-100")}>
    Anzahl an Inseraten
  </button>
</div>
```

#### d. Charts Grid

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
  {/* Price Distribution Chart */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Preisverteilung
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={priceData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* Area vs Price Scatter Plot */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Fläche vs. Preis
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis dataKey="area" name="Fläche (m²)" />
          <YAxis dataKey="price" name="Preis (€)" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={scatterData} fill="#10B981" />
        </ScatterChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
</div>
```

---

### 5. Listings View Components

#### a. Filter/Sort Bar (Mobile)

```tsx
<div className="sticky top-[48px] z-10 bg-white border-b p-4 flex items-center gap-3">
  <Select defaultValue="newest">
    <SelectTrigger className="flex-1">
      <SelectValue placeholder="Sortieren" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="newest">Neueste zuerst</SelectItem>
      <SelectItem value="price-asc">Preis aufsteigend</SelectItem>
      <SelectItem value="price-desc">Preis absteigend</SelectItem>
      <SelectItem value="area-desc">Fläche absteigend</SelectItem>
    </SelectContent>
  </Select>

  <Button variant="ghost" size="icon">
    <Download className="h-5 w-5" />
  </Button>
</div>

<div className="px-4 py-2 text-sm text-gray-600">
  20 von 11 480 Ergebnissen
</div>
```

#### b. Listing Card (Mobile)

```tsx
<Card className="m-4 overflow-hidden">
  {/* Status Badge */}
  <Badge className="absolute top-3 right-3 bg-purple-500">Aktiv</Badge>

  <CardContent className="p-4">
    {/* Title */}
    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
      Einziehen. Durchatmen. Losleben. | City-Apartment
    </h3>

    {/* Location */}
    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
      <MapPin className="h-4 w-4" />
      <span>Linz</span>
    </div>

    {/* Metrics */}
    <div className="flex items-center gap-4 mb-3">
      <div>
        <div className="text-sm text-gray-500">Preis</div>
        <div className="text-xl font-bold">€789,72</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">Fläche</div>
        <div className="text-lg font-semibold">38.64 m²</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">€/m²</div>
        <div className="text-lg font-semibold">€20,438</div>
      </div>
    </div>

    {/* Meta */}
    <div className="flex items-center gap-2 mb-3">
      <Badge variant="outline">willhaben</Badge>
      <Badge variant="destructive">Befristet (60 Monate)</Badge>
    </div>

    {/* Action */}
    <Button className="w-full" variant="default" asChild>
      <a href={listing.url} target="_blank" rel="noopener">
        Ansehen
        <ExternalLink className="ml-2 h-4 w-4" />
      </a>
    </Button>
  </CardContent>
</Card>
```

#### c. Pagination (Desktop)

```tsx
<div className="flex items-center justify-center gap-2 py-6">
  <Button variant="outline" disabled={page === 1}>
    <ChevronLeft className="h-4 w-4" />
    Previous
  </Button>

  <div className="flex gap-1">
    {[1, 2, 3].map(p => (
      <Button
        key={p}
        variant={p === page ? "default" : "outline"}
        size="sm"
        onClick={() => setPage(p)}
      >
        {p}
      </Button>
    ))}

    <span className="px-3 py-2">...</span>

    <Button variant="outline" size="sm">
      {totalPages}
    </Button>
  </div>

  <Button variant="outline" disabled={page === totalPages}>
    Next
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

---

### 6. Footer Component (Mobile)

```tsx
<footer className="mt-auto">
  {/* Branding Banner */}
  <div className="bg-[#F4A688] py-6 px-4">
    <h1 className="text-white text-3xl font-bold">MOMENT.at</h1>
  </div>

  {/* Overview Stats */}
  <div className="bg-white p-4 border-t">
    <h2 className="text-sm font-semibold mb-3">Übersicht</h2>
    <div className="grid grid-cols-4 gap-2 text-center">
      <div>
        <div className="flex justify-center mb-1">
          <Euro className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-xs text-gray-500">Preis/m²</div>
        <div className="text-orange-500 font-bold">€18</div>
      </div>
      <div>
        <div className="flex justify-center mb-1">
          <FileText className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-xs text-gray-500">Inserate</div>
        <div className="font-bold">11 480</div>
      </div>
      <div>
        <div className="flex justify-center mb-1">
          <AlertTriangle className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-xs text-gray-500">Befristet</div>
        <div className="text-orange-500 font-bold">49%</div>
      </div>
      <div>
        <div className="flex justify-center mb-1">
          <Square className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-xs text-gray-500">Ø Fläche</div>
        <div className="font-bold">71m²</div>
      </div>
    </div>
  </div>

  {/* States List */}
  <div className="bg-white p-4 border-t">
    <h2 className="text-sm font-semibold mb-3">Bundesländer</h2>
    <button className="w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between">
      <div className="flex-1 text-left">
        <h3 className="font-semibold">Wien</h3>
        <div className="flex gap-3 text-xs text-gray-600 mt-1">
          <span className="text-orange-500">€20 pro/m²</span>
          <span>2334 Inserate</span>
          <span className="text-orange-500">57% befristet</span>
          <span>74m² Ø Fläche</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  </div>
</footer>
```

---

## Design System

### Colors

**Primary Palette**:
```css
--primary: #E63946;           /* Orange/Red (MOMENT.at brand) */
--primary-light: #F4A688;     /* Coral (branding banner) */
--primary-dark: #D62828;      /* Darker orange */

--secondary: #3B82F6;         /* Blue (charts, accents) */
--success: #10B981;           /* Green (heatmap low, charts) */
--warning: #FBBF24;           /* Yellow (heatmap mid) */
--destructive: #EF4444;       /* Red (heatmap high, limited badges) */

--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-400: #9CA3AF;
--gray-600: #4B5563;
--gray-800: #1F2937;
```

**Heatmap Scale** (5 colors):
```css
/* Low → High */
--heatmap-1: #10B981;  /* Green (low values) */
--heatmap-2: #84CC16;  /* Light green */
--heatmap-3: #FBBF24;  /* Yellow (medium) */
--heatmap-4: #F97316;  /* Orange */
--heatmap-5: #EF4444;  /* Red (high values) */
```

---

### Typography

**Font Family**:
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Space Grotesk', sans-serif; /* For headings? */
```

**Font Sizes**:
```css
/* Mobile */
--text-xs: 0.75rem;    /* 12px - labels, meta */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - card titles */
--text-xl: 1.25rem;    /* 20px - large values */
--text-2xl: 1.5rem;    /* 24px - headings */
--text-3xl: 1.875rem;  /* 30px - MOMENT.at logo */

/* Desktop - slightly larger */
--text-lg: 1.25rem;    /* 20px */
--text-xl: 1.5rem;     /* 24px */
```

**Font Weights**:
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

### Spacing

**Padding/Margin Scale**:
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px - default card padding */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

**Layout Widths**:
```css
--sidebar-width: 320px;        /* Desktop sidebar */
--max-content-width: 1400px;   /* Main content max-width */
--mobile-breakpoint: 768px;
```

---

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);  /* Cards */
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1); /* Modals, popovers */
```

---

### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px - small elements */
--radius-md: 0.5rem;    /* 8px - cards, buttons */
--radius-lg: 0.75rem;   /* 12px - large cards */
--radius-full: 9999px;  /* Pills, badges */
```

---

## Implementation Notes

### 1. Responsive Breakpoints

```tsx
// Tailwind config
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',   // Switch to desktop layout
      'lg': '1024px',
      'xl': '1280px',
    }
  }
}
```

**Layout Switch**:
- Mobile: `< 768px` (stacked, tabs, footer)
- Desktop: `>= 768px` (sidebar + main, no footer)

---

### 2. State Management

**URL State** (React Router):
```tsx
// Route: /wien?page=2&sortBy=price&limited=true
const [searchParams, setSearchParams] = useSearchParams();

const page = parseInt(searchParams.get("page") || "1");
const sortBy = searchParams.get("sortBy") || "newest";
const limited = searchParams.get("limited") === "true";

// Update URL
setSearchParams({ page: "2", sortBy: "price" });
```

**Server State** (tRPC + React Query):
```tsx
const { data, isLoading } = trpc.listings.getFiltered.useQuery({
  regionId: params.state,
  filters: { limited },
  pagination: { page, sortBy },
});
```

---

### 3. Performance Considerations

**Large Datasets**:
- Pagination: Max 20-50 items per page
- Virtual scrolling for long lists (react-virtual)
- Debounced filter inputs (300ms)
- Memoize expensive calculations

**Map Rendering**:
- Lazy load map component (React.lazy)
- Limit visible regions (only show current level)
- Use bounds instead of zoom (simpler, faster)

**Charts**:
- Sample data for scatter plots (max 500 points)
- Pre-compute aggregations on server
- Lazy load chart library (recharts is heavy)

---

### 4. Accessibility

**Keyboard Navigation**:
- Tab through region list
- Arrow keys in pagination
- Enter to select/navigate

**Screen Readers**:
- Proper ARIA labels on icons
- Alt text for map regions
- Semantic HTML (`<nav>`, `<main>`, `<aside>`)

**Color Contrast**:
- Ensure text meets WCAG AA (4.5:1 ratio)
- Don't rely on color alone (use icons + labels)

---

### 5. Mobile Optimizations

**Touch Targets**:
- Minimum 44x44px for buttons
- Adequate spacing between tappable elements

**Scroll Performance**:
- Use `overflow-y: auto` with `-webkit-overflow-scrolling: touch`
- Minimize layout shifts (fixed heights where possible)

**Data Loading**:
- Show skeleton loaders while fetching
- Optimistic updates on filter changes

---

## Improvements & Recommendations

### Design Issues Identified

#### 1. **Mobile Footer is Too Long**
**Problem**: Footer repeats "Übersicht" and "Bundesländer" which are already in main content
**Solution**:
- Remove footer on mobile OR
- Make footer collapsible/drawer OR
- Only show branding in footer, move stats to sticky header

#### 2. **No Filter UI on Mobile**
**Problem**: Sort dropdown visible, but no price/area filters shown
**Solution**: Add drawer/sheet for advanced filters

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter className="h-4 w-4" />
      Filter
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Filter</SheetTitle>
    </SheetHeader>
    {/* Price, area, contract type sliders/selects */}
  </SheetContent>
</Sheet>
```

#### 3. **Distribution Bar Needs Context**
**Problem**: Horizontal bar shows 22% and 76% but unclear what they represent
**Solution**: Add labels or legend

```tsx
<div className="flex items-center justify-between text-xs text-gray-600 mb-1">
  <span>Unbefristet</span>
  <span>Befristet</span>
</div>
<div className="relative h-8 flex rounded overflow-hidden">
  {/* Segments */}
</div>
```

#### 4. **Listing Card "Aktiv" Badge Unclear**
**Problem**: What does "Aktiv" mean? (Is it currently available? Recently added?)
**Solution**:
- Use more specific labels ("Neu", "Verfügbar", timestamp)
- Or remove if not adding value

#### 5. **No Legend on Mobile Map**
**Problem**: Heatmap colors not explained
**Solution**: Add collapsible legend at bottom of map

#### 6. **Charts Without Labels**
**Problem**: Bar chart and scatter plot lack axis labels
**Solution**: Always include:
- X-axis label
- Y-axis label
- Title
- Tooltip on hover

#### 7. **Pagination Style**
**Problem**: Desktop pagination looks orphaned (no visual container)
**Solution**: Either:
- Add to footer/bottom bar
- Or integrate into listings header (total + pagination together)

---

### Missing Components

**Not shown in mockups but needed**:

1. **Loading States**
   - Skeleton loaders for cards
   - Spinner for map
   - Shimmer effect for charts

2. **Empty States**
   - "No listings found" message
   - "No data for this region" on map

3. **Error States**
   - Failed to load data
   - Network error
   - Retry button

4. **Filter UI (Desktop)**
   - Sidebar shows states but no filter controls
   - Where are price/area range sliders?

5. **Search Bar**
   - Quick search by address, zip code, or title

6. **Export/Download**
   - Download icon shown but not explained
   - Export to CSV? PDF? Share link?

---

### Suggested Additions

#### 1. **Sticky Summary Bar (Mobile)**
Instead of long footer, add sticky bar at top showing key metrics:

```tsx
<div className="sticky top-[48px] z-10 bg-white border-b px-4 py-2">
  <div className="flex gap-4 text-xs overflow-x-auto">
    <div className="flex items-center gap-1 whitespace-nowrap">
      <Euro className="h-3 w-3 text-gray-400" />
      <span className="text-orange-500 font-bold">€18/m²</span>
    </div>
    <div className="flex items-center gap-1 whitespace-nowrap">
      <FileText className="h-3 w-3 text-gray-400" />
      <span className="font-bold">11 480</span>
    </div>
    <div className="flex items-center gap-1 whitespace-nowrap">
      <AlertTriangle className="h-3 w-3 text-gray-400" />
      <span className="text-orange-500 font-bold">49%</span>
    </div>
  </div>
</div>
```

#### 2. **Filter Panel (Desktop Sidebar)**
Add filter controls below "Bundesländer":

```tsx
<div className="p-4 border-t">
  <h2 className="font-semibold mb-3">Filter</h2>

  <div className="space-y-4">
    {/* Price Range */}
    <div>
      <label className="text-sm font-medium">Preis</label>
      <Slider
        min={0}
        max={5000}
        step={50}
        value={priceRange}
        onValueChange={setPriceRange}
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>€{priceRange[0]}</span>
        <span>€{priceRange[1]}</span>
      </div>
    </div>

    {/* Area Range */}
    <div>
      <label className="text-sm font-medium">Fläche (m²)</label>
      <Slider
        min={0}
        max={200}
        step={5}
        value={areaRange}
        onValueChange={setAreaRange}
      />
    </div>

    {/* Contract Type */}
    <div>
      <label className="text-sm font-medium">Vertragsart</label>
      <Select value={contractType} onValueChange={setContractType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="limited">Nur befristet</SelectItem>
          <SelectItem value="unlimited">Nur unbefristet</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</div>
```

#### 3. **Breadcrumb Navigation**
Add breadcrumb to show hierarchy:

```tsx
<nav className="flex items-center gap-2 px-6 py-3 border-b text-sm">
  <Link to="/" className="text-gray-600 hover:text-gray-900">Österreich</Link>
  {state && (
    <>
      <ChevronRight className="h-4 w-4 text-gray-400" />
      <Link to={`/${state}`} className="text-gray-600 hover:text-gray-900">{state}</Link>
    </>
  )}
  {district && (
    <>
      <ChevronRight className="h-4 w-4 text-gray-400" />
      <span className="font-semibold">{district}</span>
    </>
  )}
</nav>
```

#### 4. **Heatmap Legend (Desktop)**
Add proper legend to map:

```tsx
<Card className="absolute bottom-4 right-4 z-[1000]">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm">Legende</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <div className="flex items-center gap-2 text-xs">
      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10B981" }} />
      <span>Niedrig: €10-12/m²</span>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#FBBF24" }} />
      <span>Mittel: €15-18/m²</span>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#EF4444" }} />
      <span>Hoch: €20+/m²</span>
    </div>
  </CardContent>
</Card>
```

---

## Summary

These mockups show a **clean, functional design** for the Momentum Institut rental monitor. Key strengths:

✅ **Clear information hierarchy**
✅ **Consistent branding** (MOMENT.at colors throughout)
✅ **Responsive layouts** (mobile & desktop considered)
✅ **Good data visualization** (maps, charts, cards)
✅ **Accessible structure** (semantic layout, clear labels)

Areas for improvement:

⚠️ **Mobile footer too long** (redundant content)
⚠️ **Missing filter UI** (especially on desktop)
⚠️ **Distribution bar needs context** (labels unclear)
⚠️ **No loading/error states** shown
⚠️ **Charts lack proper labels** (axis titles, legends)

The design provides a **solid foundation** for implementation, with minor refinements needed for production.
