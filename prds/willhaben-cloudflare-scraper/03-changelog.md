### Willhaben Cloudflare Scraper — Changelog

All notable changes for this PRD and implementation effort.

---

2025-11-02 (Revised: 3-Cron Architecture)

**Major Architecture Change:**
- Redesigned from single worker with phases to **three separate cron schedules**:
  1. **Discovery** (every 30 min): Find new listings with consecutive familiar pages stopping
  2. **Sweep** (every 3 hours): Track price history with pagination drift handling (5 pages back)
  3. **Verification** (every 6 hours): Check inactive listings not seen in last 24h
- Updated PRD Overview with new architecture and detailed flows
- Updated tasks checklist for three separate workers
- Added pagination drift handling strategy (sweep goes back 5 pages from checkpoint)
- Separated concerns: Discovery = new listings, Sweep = price tracking, Verification = inactive detection

**Key Changes:**
- Discovery: Focused on finding new listings only (stops after 5 consecutive familiar pages)
- Sweep: Chunked approach (50 pages per run) with checkpoint/resume capability
- Verification: Time-based query (unseen in 24h) instead of sweep-based pending marking
- Request efficiency: ~1,816-2,416 requests/day (vs ~23,504 for exhaustive scanning)

**Updated Defaults:**
- Discovery: `consecutiveFamiliarPagesToStop = 5`, schedule = every 30 min
- Sweep: `pagesPerRun = 50`, `overlapPages = 5`, schedule = every 3 hours
- Verification: `unseenThresholdHours = 24`, `notFoundThreshold = 2`, schedule = every 6 hours

**Pending:**
- Schema migration: Add `runType` field to `scraping_sessions` (or use checkpointData JSON)
- Implement three separate worker handlers
- Add admin UI routes for all three run types
- Test pagination drift handling in sweep runs
- Monitor and tune parameters after initial deployment

---

2025-11-02 (Original)

- Created PRD Overview: current implementation, target Cloudflare design, coverage strategy, deactivation policy, observability
- Defined tasks checklist for Worker migration (discovery, details, verification, admin UI)
- Documented D1 schema usage (`listings`, `price_history`, `sellers`, `scraping_sessions`, `verification_runs`, `verification_attempts`)
- Set default operational parameters (rows=60, window=100, familiar=5, notFoundThreshold=2, detailTTL=24h)

**Note:** Original PRD was superseded by 3-Cron Architecture revision above.
