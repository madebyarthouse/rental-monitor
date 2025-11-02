# Rental Monitor

An Austrian rental market monitoring platform that scrapes, tracks, and analyzes rental listings from Willhaben.at (Austria's primary real estate platform). Get real-time insights into rental prices, availability, market trends, and landlord activity across Austria.

## What is Rental Monitor?

Rental Monitor is a full-stack application built on Cloudflare's edge infrastructure that:

- **Scrapes** rental listings from Willhaben.at every 30 minutes
- **Tracks** price changes, listing duration, and market availability over time
- **Analyzes** rental market trends by state and district across Austria
- **Visualizes** data through interactive maps, charts, and statistics

### Key Features

- **Interactive Maps** - Heatmaps showing average price per m², listing density, and limited rental percentages by district
- **Market Analytics** - Real-time statistics on average prices, price distributions, and market trends
- **Listings Browser** - Searchable, filterable, and sortable table of all tracked rental listings
- **Multi-Level Navigation** - Explore data at country, state, or district levels

## Tech Stack

### Frontend

- **React Router v7** - Full-stack React framework with SSR
- **TypeScript** - Type-safe development
- **TailwindCSS v4** - Modern styling
- **shadcn/ui** - Component library with:
  - **Radix UI** - Accessible component primitives
  - **Recharts** - Data visualization
- **React Leaflet** - Interactive maps with district boundaries

### Backend & Infrastructure

- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare D1** - Distributed SQLite database
- **Drizzle ORM** - Type-safe database access
- **Vitest** - Unit testing

### Data Collection

- **Scheduled Cron Jobs** - Three separate jobs for discovery, updates, and verification
- **HTML Parsing** - Extracts data from Willhaben's Next.js application
- **Concurrency Control** - Rate-limiting to avoid detection

## Architecture

The system consists of two main components:

1. **Web Application** ([app/](app/)) - React Router SSR application serving the UI
2. **Cron Scraper** ([workers/cron-scraper/](workers/cron-scraper/)) - Scheduled jobs that fetch and process data

For detailed architecture documentation, see:

- [Architecture & Data Loading](docs/ARCHITECTURE.md) - Frontend routing, services, and features
- [Cron Scraper Documentation](docs/CRON-SCRAPER.md) - How data is fetched and processed
- [Package Scripts Guide](docs/PACKAGE-SCRIPTS.md) - All available npm scripts explained

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** package manager
- **Cloudflare account** (for deployment)
- **Wrangler CLI** (installed via dependencies)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rental-monitor.git
cd rental-monitor

# Install dependencies
pnpm install

# Generate Cloudflare types (runs automatically via postinstall)
# pnpm run cf-typegen
```

### Database Setup

```bash
# Generate database migrations
pnpm run db:generate

# Apply migrations locally
pnpm run db:migrate

# (Optional) Seed with Austrian region data
pnpm run data:import-regions:local

# (Optional) Generate test listings data
pnpm run data:import-listings:local
```

### Local Development

#### Run the Web Application

```bash
# Start the React Router dev server with HMR
pnpm run dev
```

Your application will be available at `http://localhost:5173`.

#### Run the Cron Scraper Locally

```bash
# Start the cron scraper worker
pnpm run cron:dev
```

Then trigger specific cron jobs manually:

```bash
# Trigger discovery job (finds new listings)
pnpm run cron:discovery

# Trigger sweep job (updates prices)
pnpm run cron:sweep

# Trigger verification job (validates listings)
pnpm run cron:verification
```

#### Database Management

```bash
# Open Drizzle Studio for local database
pnpm run db:studio

# Open Drizzle Studio for remote database
pnpm run db:studio:remote
```

### Testing

```bash
# Run all cron scraper tests
pnpm run cron:test

# Run specific test suites
pnpm run cron:test:discovery
pnpm run cron:test:sweep
pnpm run cron:test:verification
```

## Deployment

### Deploy Web Application

```bash
# Build and deploy to Cloudflare Pages/Workers
pnpm run build
pnpm run deploy
```

### Deploy Cron Scraper

```bash
# Deploy scheduled worker
pnpm run cron:deploy
```

### Database Migrations (Production)

```bash
# Apply migrations to remote D1 database
pnpm run db:migrate:remote

# Import region data to production
pnpm run data:import-regions:remote
```

### Database Backup & Sync

```bash
# Copy remote database to local
pnpm run db:import:remote-to-local

# Copy local database to remote (use with caution!)
pnpm run db:import:local-to-remote
```

## Project Structure

```
rental-monitor/
├── app/                      # React Router web application
│   ├── routes/              # File-based routes
│   ├── components/          # React components
│   ├── services/            # Business logic layer
│   ├── db/                  # Database schema and client
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utilities
├── workers/
│   └── cron-scraper/        # Scheduled scraper worker
│       ├── runs/            # Discovery, sweep, verification jobs
│       ├── sources/         # Willhaben parsing logic
│       └── utils/           # Helper utilities
├── drizzle/                 # Database migrations
├── docs/                    # Documentation
└── public/                  # Static assets
```

## How It Works

### Data Collection (3-Cron Architecture)

The scraper uses three scheduled jobs:

1. **Discovery** (every 30 min) - Finds NEW listings on Willhaben
2. **Sweep** (every 3 hours) - Updates PRICES on known listings
3. **Verification** (every hour) - Validates active listings still exist

See [Cron Scraper Documentation](docs/CRON-SCRAPER.md) for detailed flow diagrams.

### Data Flow

1. Cron jobs scrape Willhaben.at HTML pages
2. Parse JSON embedded in Next.js `__NEXT_DATA__` script tags
3. Extract listing data, seller info, and location details
4. Store in D1 database with temporal tracking
5. React Router loaders query database via services
6. Components render interactive UI with maps and charts

See [Architecture Documentation](docs/ARCHITECTURE.md) for detailed data flow.

## Configuration

### Environment Variables

Create a `.dev.vars` file in the root directory for local development:

```env
# Optional: Add any API keys or configuration here
```

### Wrangler Configuration

Main app: [wrangler.toml](wrangler.toml)
Cron scraper: [workers/cron-scraper/wrangler.jsonc](workers/cron-scraper/wrangler.jsonc)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

## Acknowledgments

- Data sourced from [Willhaben.at](https://www.willhaben.at)
- Built with [React Router](https://reactrouter.com/)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Maps by [Leaflet](https://leafletjs.com/)
