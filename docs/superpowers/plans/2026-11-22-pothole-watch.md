# Pothole Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the active Groundwork web app with a mobile-first pothole reporting and community verification product.

**Architecture:** Keep the root React/Vite application and Mapbox renderer. Add an additive Supabase schema for pothole reports, resident responses, and opted-in push subscriptions; use Supabase Edge Functions and scheduled invocation for push and follow-up delivery. The browser handles location only in response to a user action, and the map layers derive from persisted pothole/fix records.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Mapbox GL JS, Supabase PostgREST/RLS/Edge Functions, browser Geolocation, Notifications, Push, Service Worker, Web Push (VAPID).

**Spec:** `docs/superpowers/specs/2026-11-22-pothole-watch-design.md`

## Global Constraints

- The app is a Figma Make React/Vite project; its dev server is already running.
- Keep the root app as the implementation target and leave `flutter_app/` intact.
- Keep reporting usable without notification permission.
- Store coarse location for nearby alert delivery only after explicit opt-in; do not collect continuous background location.
- Use a 500 m initial push radius.
- The first check-in is seven days after reporting and repeats weekly while unresolved, with a strict reminder cap.
- A pothole becomes community-confirmed fixed after two distinct residents report it fixed; “cannot find it” is not a repair confirmation.
- Fix activity shows community-confirmed fixes over a selectable period, defaults to 90 days, and must not imply official agency performance.
- Do not relabel legacy drainage reports as potholes or show them as live pothole data.
- Do not add or run tests unless the user asks. Use build/static checks and manual preview verification instead.
- Push requires HTTPS, a registered service worker, VAPID keys, deployed Edge Functions, a scheduler, and server-side secrets; clearly document deployment setup and degraded states.

## Review Focus

- Missing/denied geolocation or notification permission must leave manual map placement and reports usable.
- Duplicate, stale, or conflicting resident responses must not inflate fix counts or close an active pothole.
- Expired/unsupported push subscriptions must not block other nearby deliveries or scheduled follow-ups.
- Empty Supabase configuration, RLS denial, offline upload, and failed report submission must show honest errors without fake success.
- Mobile viewport and safe-area constraints must keep report, map controls, confirmation prompts, and selected-report actions reachable.

---

### Task 1: Add isolated pothole and verification data model

**Files:**
- Create: `supabase/migrations/20261123000000_pothole_watch.sql`
- Modify: `src/data/groundwork.ts`
- Modify: `src/data/groundwork.test.ts` only if the user authorizes tests

**Interfaces:**
- Consumes: existing Supabase REST helper, anonymous auth session, Firebase token provider.
- Produces: `PotholeReport`, `PotholeResponse`, `PushSubscriptionRecord`, `loadPotholes`, `createPothole`, `respondToPothole`, and `loadFixActivity` data interfaces/functions.

- [x] Add new `pothole_reports` table with id, description, latitude/longitude, optional photo URL, status, creator, `created_at`, `last_checked_at`, `next_check_at`, and resolution timestamp.
- [x] Add `pothole_responses` table keyed by report, user, and check-in cycle; response values are `exists`, `fixed`, or `cannot_find`. Enforce one response per user per cycle.
- [x] Add `push_subscriptions` table with user id, endpoint/keys, coarse opt-in latitude/longitude, opt-in timestamp, and active state. Keep endpoints and keys inaccessible through public report reads.
- [x] Add RLS policies for public safe report/fix summaries and own report/response/subscription writes; grant no public read access to subscription data.
- [x] Add a safe report summary view with response counts and derive fixed state only after two distinct `fixed` responses in the same resolution cycle.
- [x] Implement repository functions against the new tables and view. Keep old tables and legacy rows untouched.
- [x] Run `pnpm build` and inspect the migration for RLS coverage, unique constraints, grants, and legacy-data isolation.

### Task 2: Replace the old shell with the mobile-first pothole map

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Create: `src/features/potholes/PotholeMap.tsx`
- Create: `src/features/potholes/MapControls.tsx`
- Create: `src/features/potholes/ReportDetailsSheet.tsx`

**Interfaces:**
- Consumes: Task 1 `PotholeReport`, `loadPotholes`, `loadFixActivity`.
- Produces: map events `onSelectReport(id)`, `onRequestReportAt({lat,lng})`, and layer mode `active | fixes`.

- [x] Remove Community and Budget navigation, screens, sample drainage reports, discussion, votes, RTI, and illustrative budget content from the active app.
- [x] Build the compact top location/search area, active/fix layer switch, Mapbox viewport, selected-report bottom sheet, and thumb-reachable Report button; keep map attribution and navigation controls visible.
- [x] Add active pothole point layer and a fix-activity heat layer fed only by Task 1 data for the selected period (default 90 days). Explain that the layer represents resident-confirmed fixes.
- [x] Load reports from Supabase only; show a clear empty state instead of legacy/sample data. Retain the map when Supabase is unavailable, with a visible connection state.
- [x] Use current geolocation only after an explicit “Use my location” action; fall back to Delhi/map tap if denied or unavailable.
- [x] Run `pnpm build`; inspect the live preview at narrow mobile and desktop widths for map sizing, safe areas, scroll behavior, and accessible controls.

### Task 3: Implement real pothole reporting and map placement

**Files:**
- Create: `src/features/potholes/ReportPotholeSheet.tsx`
- Create: `supabase/functions/pothole-photo-url/index.ts`
- Modify: `src/App.tsx`
- Modify: `src/data/groundwork.ts`

**Interfaces:**
- Consumes: Task 1 `createPothole(input)`, Task 2 `onRequestReportAt`.
- Produces: report submission `{latitude, longitude, description, photo?}` and selected newly-created report id.
- Also produces: private photo upload/delete helpers; `pothole-photo-url` signs a short-lived viewing URL only for a photo attached to an existing report.

- [x] Let users place a pin by map tap or use their current location after browser permission; show the chosen location for review before submission.
- [x] Support a short description and optional photo with type/size limits. Use a private `pothole-photos` bucket (created through Supabase Dashboard/Storage API, not SQL metadata writes) and owner-only upload/delete policies. If the bucket is unavailable, keep the report and show a clear upload error.
- [x] Keep storage paths out of public summaries. Issue 30-minute signed photo URLs server-side only after verifying the path is attached to a report.
- [x] Submit to Supabase, display loading/success/error states, refresh active reports, and select/focus the new report only after successful persistence.
- [x] Prevent duplicate submits and reject invalid/out-of-range coordinates and blank/overlong descriptions.
- [x] Run `pnpm build`; manually verify allowed/denied location, no photo, failed upload, successful report, and duplicate click behavior in preview where backend config permits.

### Task 4: Add nearby confirmation and periodic check-in responses

**Files:**
- Create: `src/features/potholes/ResponseSheet.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/groundwork.ts`
- Modify: `supabase/migrations/20261123000000_pothole_watch.sql`

**Interfaces:**
- Consumes: Task 1 `respondToPothole(reportId, cycleId, response)` and report response summary.
- Produces: report history entries with response value, created timestamp, and distinct responder count.

- [x] Present new-report prompts with “Yes, it’s here” and “No, I can’t find it”; present scheduled prompts with “Still there” and “It’s fixed”.
- [x] Record responses per user/check-in cycle and prevent duplicate votes from counting twice.
- [x] Keep “cannot find” distinct from “fixed”; preserve active status when evidence is mixed and show the count/context on the detail sheet.
- [x] Show open report’s last check-in, next scheduled check-in, and community-confirmed repair state.
- [x] Run `pnpm build`; manually verify duplicate response and conflicting response states against configured Supabase.

### Task 5: Build notification opt-in and browser push delivery

**Files:**
- Modify: `index.html`
- Create: `public/manifest.webmanifest`
- Create: `public/push-worker.js`
- Create: `src/features/notifications/NotificationSettings.tsx`
- Modify: `src/data/groundwork.ts`
- Create: `supabase/functions/notify-nearby-report/index.ts`
- Create: `supabase/functions/_shared/web-push.ts`
- Modify: `supabase/migrations/20261123000000_pothole_watch.sql`

**Interfaces:**
- Consumes: Task 1 opted-in subscriptions and report data; Task 3 report creation.
- Produces: `enableNearbyAlerts()` that obtains explicit location consent, subscribes through PushManager, stores coarse coordinates and subscription keys; `disableNearbyAlerts()` removes the subscription and location; edge function accepts a new report id and dispatches within 500 m.

- [x] Add installable web manifest and a service worker for push display and notification-click navigation.
- [x] Explain nearby alert location use before asking notification permission; do not request permission on app load.
- [x] Store only the explicitly consented coarse location with the push subscription and provide disable/delete controls.
- [x] Send push from a Supabase Edge Function using server-side VAPID secrets. Remove dead subscriptions on provider expiration; continue sending to remaining recipients if one endpoint fails.
- [x] Trigger nearby notification dispatch after a persisted report is created. Never send push from a browser-held service-role key or VAPID private key.
- [x] Make unsupported browsers or denied permission fall back to in-app prompts and show notification setup state.
- [x] Run `pnpm build`; manually check opt-in/decline/disable/unsupported states. Document the live HTTPS and VAPID setup steps.

### Task 6: Schedule weekly follow-ups and confirmed-fix heat activity

**Files:**
- Create: `supabase/functions/process-pothole-followups/index.ts`
- Modify: `supabase/migrations/20261123000000_pothole_watch.sql`
- Modify: `src/data/groundwork.ts`
- Modify: `src/features/potholes/PotholeMap.tsx`

**Interfaces:**
- Consumes: report `next_check_at`, check-in cycles, response records, active subscriptions.
- Produces: scheduled push prompts and aggregated fix points with counts for selectable 30/90/180-day windows.

- [x] Set the first check-in due date to seven days after report creation, then weekly while unresolved; enforce a strict reminder cap and stop after confirmed fix.
- [x] Process due reports server-side through an authenticated scheduled Edge Function. Use atomic claims/idempotency so retries do not create duplicate prompts.
- [x] Target only opted-in subscriptions within the configured 500 m radius; use response links that open the relevant report and check-in cycle.
- [x] Aggregate community-confirmed fixes for heatmap data; include counts in selected cell details and avoid implying official performance.
- [x] Run `pnpm build`; inspect migration/function sources for idempotency, bounded fan-out, privacy, and schedule setup instructions.

### Task 7: Remove stale product copy and document pilot operations

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `flutter_app/README.md` only if it currently describes behavior that would be misleading about the active app
- Create: `docs/pothole-watch-setup.md`

**Interfaces:**
- Consumes: all preceding UI and schema states.
- Produces: end-user copy and operator setup guide for the live Supabase project.

- [x] Replace “Delhi drainage watch”, demo notices, drainage help text, and “Community/Budget” references with pothole-specific copy that distinguishes resident reports from official repairs.
- [x] Document applying the additive migration, creating the private photo bucket through Supabase Dashboard/Storage API, VAPID secrets, deploying the Edge Functions, setting the scheduled invocation, and validating HTTPS/service-worker requirements.
- [x] Document degraded states and the manual preview verification checklist; do not claim push or scheduler is active until the external Supabase deployment settings are configured.
- [x] Run `pnpm build` and `git diff --check`; verify that the root preview no longer exposes the old Community/Budget product surfaces.
