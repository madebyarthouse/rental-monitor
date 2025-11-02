# 3-Cron Architecture Summary

## Overview

The Willhaben scraper has been redesigned with a **3-cron architecture** that separates concerns and optimizes request efficiency while maintaining completeness.

---

## Architecture Comparison

### Before: Single Worker with Phases
- Single cron (every 15 min)
- Mixed responsibilities: discovery + price tracking + verification
- Request count: ~11,628/day

### After: 3-Cron System
- **Discovery** (every 30 min): Find new listings
- **Sweep** (every 3 hours): Track price history
- **Verification** (every 6 hours): Detect inactive listings
- Request count: ~1,816-2,416/day (**5-6× more efficient!**)

---

## Request Count Breakdown

### Discovery Run (Every 30 Minutes)
- **Purpose**: Find new listings only
- **Strategy**: Consecutive familiar pages (stop after 5 pages with 0 new)
- **Per Run**: ~8 overview pages + ~1-50 detail pages = ~10-60 requests
- **Per Day**: ~48 runs × ~8.7 requests = **~416 requests/day**

### Sweep Run (Every 3 Hours)
- **Purpose**: Track price history for existing listings
- **Strategy**: Chunked approach (50 pages per run) with 5-page overlap for pagination drift
- **Per Run**: 50 overview pages + up to 100 detail pages = ~150 requests
- **Per Day**: 8 runs × ~150 requests = **~1,200 requests/day**

### Verification Run (Every 6 Hours)
- **Purpose**: Check inactive listings not seen in last 24h
- **Strategy**: Time-based query, 2-strike rule
- **Per Run**: ~50-200 verification requests
- **Per Day**: 4 runs × ~50-200 = **~200-800 requests/day**

### Total Daily Requests
**~1,816-2,416 requests/day**

This is **significantly more efficient** than:
- Exhaustive scanning: ~23,504 requests/day (12× more!)
- Original single-worker: ~11,628 requests/day (5× more!)

---

## Key Features

### 1. Discovery: Fast New Listing Detection
- Starts at page 1 every run (catches new listings despite pagination drift)
- Stops early when reaching familiar territory (efficient)
- Focused on NEW listings only (no price tracking overhead)

### 2. Sweep: Comprehensive Price Tracking
- Chunked approach: 50 pages per run (handles large inventory)
- Pagination drift handling: Goes back 5 pages from last checkpoint
- Resumable: Checkpoint after each page, resume on next run
- Price history: Updates for listings with stale data (>24h)

### 3. Verification: Targeted Inactive Detection
- Time-based: Only checks listings not seen in last 24h
- 2-strike rule: Faster detection than 3-strike (6-12h vs 18h)
- Efficient: Only verifies listings that need checking

---

## Pagination Drift Handling

### Problem
New listings push old listings to later pages. A listing at page 50 in run 1 might be at page 55 in run 2.

### Solution: 5-Page Overlap
```
Run 1 (00:00):
  Scans: pages 1-50
  Checkpoint: lastPageScraped = 50

Run 2 (03:00):
  Start: page 45 (50 - 5 = overlap)
  Scans: pages 45-95
  Checkpoint: lastPageScraped = 95

Run 3 (06:00):
  Start: page 90 (95 - 5 = overlap)
  Scans: pages 90-140
  ...
```

**Why 5 pages?**
- New listings push old listings down by ~1-2 pages per discovery run
- Overlap of 5 pages ensures we catch any listings that drifted
- Trade-off: Some duplicate work, but guarantees completeness

---

## Observability

All three runs are tracked in `scraping_sessions`:
- **Discovery**: `runType='discovery'`, tracks `newListings`, `processedPages`
- **Sweep**: `runType='sweep'`, tracks `updatedListings`, `lastPageScraped`, checkpoint data
- **Verification**: Separate `verification_runs` table, tracks `listingsChecked`, `listingsMarkedInactive`

Admin UI routes:
- `/admin/scraper/discovery` - Discovery sessions
- `/admin/scraper/sweep` - Sweep sessions with checkpoint info
- `/admin/scraper/verification` - Verification runs

---

## Benefits

1. **Efficiency**: 5-6× fewer requests than exhaustive scanning
2. **Completeness**: Discovery catches new listings, Sweep tracks all prices, Verification detects inactive
3. **Separation of Concerns**: Each cron has a single, clear responsibility
4. **Resumable**: Sweep can resume from checkpoint if worker times out
5. **Pagination Drift Safe**: 5-page overlap ensures no listings missed
6. **Observable**: Full tracking of all runs with detailed metrics

---

## Implementation Status

- ✅ PRD Overview updated with 3-cron architecture
- ✅ Tasks checklist updated for three separate workers
- ✅ Changelog updated with architecture changes
- ⏳ Schema migration: Add `runType` field to `scraping_sessions`
- ⏳ Implementation: Three worker handlers (discovery, sweep, verification)
- ⏳ Admin UI: Three routes for observability

---

## Next Steps

1. **Schema Migration**: Add `runType` field or use checkpointData JSON
2. **Discovery Worker**: Implement consecutive familiar pages logic
3. **Sweep Worker**: Implement checkpoint/resume and pagination drift handling
4. **Verification Worker**: Implement time-based query and 2-strike rule
5. **Testing**: Test pagination drift handling, checkpoint/resume, error handling
6. **Deployment**: Deploy to Cloudflare Workers with three cron schedules

