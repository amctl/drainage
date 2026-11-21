# Supabase Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Groundwork’s reports, comments, votes, and budget-source links durable and shared through Supabase.

**Architecture:** A typed browser-side Supabase client reads Vite’s publishable connection variables. A focused data module maps database rows to the current UI domain types and exposes mutations; `App` owns loading, optimistic UI state, and user-facing save errors. A SQL migration creates tables, seed data, RLS policies, and public score/count views.

**Tech Stack:** React 19, TypeScript, Vite 8, `@supabase/supabase-js`, Vitest, Supabase PostgreSQL/RLS.

**Spec:** `docs/superpowers/specs/2026-11-22-supabase-persistence-design.md`

## Global Constraints

- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may be exposed to the browser.
- Enable RLS on every public table; never use a secret/service key in the app.
- Preserve sample reports as a read-only fallback when Supabase is unavailable and clearly surface unsaved changes.
- No auth UI, image upload, real geolocation, moderation tooling, or server-side verification in this scope.
- Every new data behavior is developed test-first.

## Review Focus

- Missing or malformed Supabase variables must not crash the initial render; test client availability and fallback loading in Task 1.
- A vote toggle must replace, not duplicate, one browser’s prior choice; test upsert/deletion request selection in Task 2.
- Failed optimistic mutations must restore the previously rendered report/comment/link state; test the App mutation boundary in Task 3.
- Replies must only attach to a comment in the active report; test mapper and insert payload parent-report relationship in Task 2.
- Untrusted source labels/URLs and comment text must remain plain rendered text; test URL validation and retain React text rendering in Task 3.

---

## File Structure

- `package.json` — Supabase client and Vitest scripts/dependencies.
- `src/lib/supabase.ts` — guarded singleton Supabase browser client.
- `src/data/groundwork.ts` — data types, row mappers, browser ID, queries, and mutations.
- `src/data/groundwork.test.ts` — unit tests for mapping and mutation request behavior.
- `src/test/setup.ts` — browser storage setup for Vitest.
- `src/vite-env.d.ts` — typed Vite environment variables.
- `supabase/migrations/20261122000000_groundwork.sql` — schema, seed data, views/functions, RLS policies.
- `src/App.tsx` — loads remote state and connects current UI handlers to the data module.

### Task 1: Client setup and safe read path

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase.ts`
- Create: `src/data/groundwork.ts`
- Create: `src/data/groundwork.test.ts`
- Create: `src/test/setup.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Produces `supabase: SupabaseClient | null`, `isSupabaseConfigured(): boolean`, and `loadGroundwork(): Promise<GroundworkSnapshot>`.
- `GroundworkSnapshot` contains `reports`, `comments`, and `sourceLinks` in the current display shapes.

- [ ] **Step 1: Add `@supabase/supabase-js`, Vitest, and the `test` script to `package.json`; configure Vitest to use jsdom and `src/test/setup.ts`.**

- [ ] **Step 2: Write failing tests for `isSupabaseConfigured` and `loadGroundwork`.**

```ts
it('returns the sample snapshot when Supabase is not configured', async () => {
  expect(await loadGroundwork()).toMatchObject({ reports: expect.any(Array) })
})
```

- [ ] **Step 3: Run the focused test and verify it fails because the data module does not exist.**

Run: `npm test -- src/data/groundwork.test.ts`

- [ ] **Step 4: Implement the guarded Supabase client and `loadGroundwork(): Promise<GroundworkSnapshot>`.**

Use typed row mappers; query reports with aggregate vote/comment data and load comments/source links only when a configured client exists.

- [ ] **Step 5: Re-run the focused test and verify it passes.**

Run: `npm test -- src/data/groundwork.test.ts`

- [ ] **Step 6: Commit the client and read-path setup.**

```bash
git add package.json src/lib/supabase.ts src/data src/test src/vite-env.d.ts
git commit -m "feat: add Supabase data client"
```

### Task 2: Database schema and tested write operations

**Files:**
- Create: `supabase/migrations/20261122000000_groundwork.sql`
- Modify: `src/data/groundwork.ts`
- Modify: `src/data/groundwork.test.ts`

**Interfaces:**
- Consumes `supabase` and `GroundworkSnapshot` from Task 1.
- Produces `createReport`, `createComment`, `setReportVote`, `setCommentVote`, and `createSourceLink`, each returning the mapped saved entity.

- [ ] **Step 1: Write failing tests for vote replacement/removal and comment payload construction.**

```ts
it('removes the existing report vote when the same direction is selected', async () => {
  await expect(setReportVote(4, 1, 1)).resolves.toEqual({ vote: 0 })
})
```

- [ ] **Step 2: Run the focused tests and verify they fail with missing mutation exports.**

Run: `npm test -- src/data/groundwork.test.ts`

- [ ] **Step 3: Create the SQL migration.**

Create `reports`, `comments`, `report_votes`, `comment_votes`, and `source_links`; seed the five current reports and six comments; add safe score/count views or RPC functions; enable RLS and policies that allow public reads and constrained browser writes keyed by a UUID device ID.

- [ ] **Step 4: Implement the mutations and `getDeviceId(): string` in `src/data/groundwork.ts`.**

Validate HTTP(S) links before insertion, use a unique `(report_id, device_id)` or `(comment_id, device_id)` vote constraint, and return an explicit error when the client is unavailable.

- [ ] **Step 5: Re-run the focused tests and verify they pass.**

Run: `npm test -- src/data/groundwork.test.ts`

- [ ] **Step 6: Apply the migration in the Supabase SQL Editor, then verify seeded queries and RLS as an unauthenticated browser client.**

- [ ] **Step 7: Commit schema and data mutations.**

```bash
git add supabase/migrations src/data/groundwork.ts src/data/groundwork.test.ts
git commit -m "feat: persist Groundwork community data"
```

### Task 3: Connect the React interface to persistent data

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/data/groundwork.test.ts`

**Interfaces:**
- Consumes `loadGroundwork` and all Task 2 mutations.
- Produces a UI that renders remote values, reports connection state, and rolls back failed optimistic changes.

- [ ] **Step 1: Write failing tests for an optimistic vote rollback and rejected source URL.**

```ts
it('restores the previous score when a report vote request fails', async () => {
  // render App with a rejected setReportVote and assert the original score returns
})
```

- [ ] **Step 2: Run the focused tests and verify they fail against the current local-only handlers.**

Run: `npm test -- src/data/groundwork.test.ts`

- [ ] **Step 3: Replace hard-coded active data state in `src/App.tsx` with a load effect and connection state.**

Keep the sample seed only as fallback, replace demo-only labels where persistence is active, and maintain existing filtering/sorting/map selection behavior.

- [ ] **Step 4: Convert report submission, comment submission, both vote controls, and source saving to optimistic async handlers.**

On success, reconcile state from the returned entity/score; on failure, roll back state and show `notice`. Keep the simulated verification as an explicit pre-submit demo check and do not upload the selected photo.

- [ ] **Step 5: Re-run focused tests and verify they pass.**

Run: `npm test -- src/data/groundwork.test.ts`

- [ ] **Step 6: Run the complete test suite and production build.**

Run: `npm test && npm run build`

Expected: all tests pass and Vite completes without TypeScript errors.

- [ ] **Step 7: Manually verify the configured preview.**

Load seed reports, submit one comment and one source, vote once, refresh, and confirm each persisted result remains visible; temporarily disable one connection variable and confirm the sample fallback and unsaved-state message render.

- [ ] **Step 8: Commit the UI integration.**

```bash
git add src/App.tsx src/data/groundwork.test.ts
git commit -m "feat: connect Groundwork UI to Supabase"
```

## Self-review

- Spec coverage: Tasks 1–3 cover direct browser client, the five persistent models, RLS migration, sample fallback, user-visible failures, and no-auth limits. Image upload and server verification are deliberately excluded.
- Type consistency: `GroundworkSnapshot` is created in Task 1, extended only by Task 2 mutation entities, and consumed by Task 3.
- Review focus: each listed failure mode has a named test in its owning task.
- Proportion: three testable deliverables keep the plan focused without spelling out implementation bodies.
