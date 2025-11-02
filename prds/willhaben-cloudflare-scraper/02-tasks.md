### Willhaben Cloudflare Scraper — Tasks (3-Cron Architecture)

This is the implementation checklist for migrating the Willhaben scraper to a separate Cloudflare Worker with D1, three separate cron schedules, and full observability.

---

#### A. Repository prep

- [ ] Remove/archive headless scraper (`scraper/scrapers/willhaben-headless/`)
- [ ] Replace Axios with `fetch` utilities compatible with Workers
- [ ] Extract Willhaben parsing into pure functions (overview/detail) re-usable by Worker

---

#### B. Database & schema

- [ ] Confirm existing tables cover needs (`listings`, `price_history`, `sellers`, `scraping_sessions`, `verification_runs`, `verification_attempts`)
- [ ] Add `runType` field to `scraping_sessions` table: `'discovery' | 'sweep'` (or use checkpointData JSON)
- [ ] Add helpful indexes if missing:
  - `idx_scraping_sessions_runtype_status` on (runType, status)
  - `idx_listings_last_seen_24h` on (lastSeenAt, isActive) for verification queries
- [ ] Backfill null `lastScrapedAt` with `lastSeenAt` where appropriate

---

#### C. Worker project structure

- [ ] Create new Worker: `willhaben-scraper-worker`
- [ ] Bind D1 DB in `wrangler.jsonc` (prod + dev)
- [ ] Add three Cron triggers:
  - Discovery: `*/30 * * * *` (every 30 minutes)
  - Sweep: `0 */3 * * *` (every 3 hours)
  - Verification: `0 */6 * * *` (every 6 hours)
- [ ] Project structure:
  ```
  /workers/willhaben/
    handler.ts          - Cron entrypoint (routes to discovery/sweep/verification)
    discovery.ts        - Discovery worker logic
    sweep.ts            - Sweep worker logic
    verification.ts     - Verification worker logic
    scraper.ts          - Willhaben scraper (overview + detail parsing)
    db.ts               - D1/Drizzle wrappers for Worker
    types.ts            - Shared types
    utils.ts            - fetch helpers, retry logic, rate limiting
  ```

---

#### D. Discovery worker (every 30 minutes)

- [ ] Implement `handleDiscovery()` function:
  - Create session with `runType='discovery'`
  - Start at page 1, fetch overview pages with `rows=90`
  - Maintain in-memory `seenListingIds` set
  - Stop after 5 consecutive pages with 0 new listings
  - For each new listing: fetch detail page immediately
  - Track: `newListings`, `processedPages`, `consecutiveFamiliar`
- [ ] Parse overview pages (extract listing URLs/IDs from Willhaben JSON)
- [ ] Fetch detail pages for new listings (concurrency: 2-4)
- [ ] Upsert listings into `listings` table:
  - New: `firstSeenAt=now`, `lastSeenAt=now`, `isActive=true`
  - Existing: Skip (already in DB)
- [ ] Append to `price_history` for all new listings
- [ ] Upsert sellers
- [ ] Update session on completion: status, stats, errors
- [ ] Respect rate limits (500-2000ms delay between requests)

---

#### E. Sweep worker (every 3 hours)

- [ ] Implement `handleSweep()` function:
  - Create session with `runType='sweep'`
  - Load last sweep checkpoint from DB:
    ```sql
    SELECT checkpointData FROM scraping_sessions 
    WHERE runType='sweep' AND status='completed' 
    ORDER BY completedAt DESC LIMIT 1
    ```
  - Calculate start page: `lastPageScraped - 5` (overlap for pagination drift)
  - If no checkpoint: start from page 1
- [ ] Scan 50 pages sequentially:
  - Fetch overview page
  - For each listing:
    - Update `lastSeenAt = now`
    - Check if detail needed: `lastScrapedAt IS NULL OR lastScrapedAt < now - 24h`
    - If needed: fetch detail page (bounded: max 100 per run)
    - Append to `price_history` if price changed
  - Update checkpoint after each page: `{ lastPageScraped: currentPage, sweepStartPage: startPage }`
- [ ] Track: `updatedListings`, `processedPages`, `lastPageScraped`
- [ ] Update session on completion: status, stats, checkpoint, errors
- [ ] Handle resumption: If worker times out, resume from checkpoint on next run

---

#### F. Verification worker (every 6 hours)

- [ ] Implement `handleVerification()` function:
  - Create `verification_runs` entry
  - Query candidates:
    ```sql
    SELECT id, url FROM listings 
    WHERE lastSeenAt < datetime('now', '-24 hours') 
    AND isActive = true 
    AND platform = 'willhaben'
    ```
- [ ] For each candidate:
  - Create `verification_attempts` entry
  - HEAD request to `listing.url` (or GET if HEAD not supported)
  - Handle responses:
    - `200 OK`: Update `lastVerifiedAt=now`, reset `notFoundCount=0`
    - `404 Not Found`: Increment `notFoundCount`
      - If `notFoundCount >= 2`: Set `isActive=false`, `deactivatedAt=now`
    - `429 Rate Limit`: Retry with exponential backoff
    - `5xx Error`: Log error, don't update status
- [ ] Track: `listingsChecked`, `listingsConfirmedActive`, `listingsMarkedInactive`
- [ ] Update `verification_runs` on completion: status, stats, errors
- [ ] Respect rate limits (500-2000ms delay between requests)

---

#### G. Cron handler & routing

- [ ] Implement `handler.ts` entrypoint:
  - Parse `event.cron` to determine which cron triggered
  - Route to appropriate handler:
    - `*/30 * * * *` → `handleDiscovery()`
    - `0 */3 * * *` → `handleSweep()`
    - `0 */6 * * *` → `handleVerification()`
  - Handle errors: log to session, return error response
- [ ] Implement error handling:
  - Try/catch around each handler
  - Store errors in session `errorLog` JSON array
  - Update session status to 'failed' on unrecoverable errors

---

#### H. Observability

- [ ] Error aggregation: store structured errors in session `errorLog` (JSON array)
  ```typescript
  errorLog: [
    { timestamp: string, page?: number, url?: string, error: string, stack?: string }
  ]
  ```
- [ ] Session metrics:
  - Discovery: `newListings`, `processedPages`, `consecutiveFamiliar`, `errors`
  - Sweep: `updatedListings`, `processedPages`, `lastPageScraped`, `errors`
  - Verification: `listingsChecked`, `listingsMarkedInactive`, `errors`
- [ ] Basic stdout logs with run/session IDs
- [ ] Track performance: start/end timestamps, duration per phase

---

#### I. Admin UI (Remix)

- [ ] `/admin/scraper/discovery` route:
  - List discovery sessions (filter by status, date range)
  - Session detail view: page progress, new listings count, errors, consecutive familiar pages
  - Visualize: new listings over time, pages scanned per run
- [ ] `/admin/scraper/sweep` route:
  - List sweep sessions with checkpoint info
  - Session detail view: pages scanned, checkpoint data, lastPageScraped
  - Visualize: sweep progress (current page / total pages), price updates
- [ ] `/admin/scraper/verification` route:
  - List verification runs with totals
  - Run detail view: listings checked, inactive counts, attempts browser
  - Visualize: inactive listings over time, verification success rate
- [ ] Wire to D1; add better-auth later
- [ ] Add filters: status, date range, platform

---

#### J. Testing

- [ ] Unit tests for overview/detail parsers using `demo-html/*`
- [ ] Integration test for discovery stopping conditions (5 consecutive familiar)
- [ ] Integration test for sweep checkpoint/resume logic
- [ ] Integration test for sweep pagination drift handling (5 pages back)
- [ ] Integration test for verification 2-strike threshold logic
- [ ] Test cron routing (mock different cron schedules)
- [ ] Test error handling and session tracking

---

#### K. Rollout plan

- [ ] Dry-run worker against dev D1
- [ ] Test discovery: Verify finds new listings correctly
- [ ] Test sweep: Verify checkpoint/resume works, handles pagination drift
- [ ] Test verification: Verify inactive detection works
- [ ] Compare counts with current GitHub Action scraper (baseline window)
- [ ] Monitor first week: Check session logs, error rates, request counts
- [ ] Tune parameters if needed:
  - Discovery: consecutive familiar threshold (default: 5)
  - Sweep: pages per run (default: 50), overlap pages (default: 5)
  - Verification: unseen threshold (default: 24h), notFound threshold (default: 2)
- [ ] Turn off GitHub Action once Worker achieves stability
- [ ] Monitor second week with production load

---

#### L. Schema migration (if needed)

- [ ] Add `runType` column to `scraping_sessions` table (if not using checkpointData)
  ```sql
  ALTER TABLE scraping_sessions ADD COLUMN run_type TEXT;
  ```
- [ ] Add index on `runType` and `status`:
  ```sql
  CREATE INDEX idx_scraping_sessions_runtype_status ON scraping_sessions(run_type, status);
  ```
- [ ] Add index for verification queries:
  ```sql
  CREATE INDEX idx_listings_last_seen_24h ON listings(last_seen_at, is_active) 
  WHERE platform = 'willhaben' AND is_active = 1;
  ```

---

## Implementation Priority

1. **Phase 1 (Week 1)**: Discovery worker
   - Basic discovery logic with consecutive familiar stopping
   - Detail fetching for new listings
   - Session tracking

2. **Phase 2 (Week 2)**: Sweep worker
   - Checkpoint loading and saving
   - Pagination drift handling (5 pages back)
   - Price history tracking

3. **Phase 3 (Week 3)**: Verification worker
   - Time-based query for unseen listings
   - 2-strike inactive detection
   - Verification session tracking

4. **Phase 4 (Week 4)**: Observability & Admin UI
   - Admin routes for all three run types
   - Error logging and visualization
   - Performance metrics

5. **Phase 5 (Week 5)**: Testing & Optimization
   - Integration tests
   - Parameter tuning
   - Production monitoring
