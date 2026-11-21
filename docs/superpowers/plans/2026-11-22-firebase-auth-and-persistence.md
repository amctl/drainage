# Firebase Auth and Persistence Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase Google login, bind it to Supabase RLS, and complete all remaining persistent app workflows.

**Architecture:** Firebase Auth owns Google sign-in and provides ID tokens. The existing direct Supabase REST adapter uses those tokens for mutations, while public reads remain available. A revised migration creates seed-safe rows, user-owned data, and realtime publications; the React UI uses the adapter for every write.

**Tech Stack:** React 19, Vite 8, Firebase Auth Web SDK, Supabase PostgREST, Supabase Realtime, PostgreSQL RLS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-22-firebase-auth-and-persistence-design.md`

## Global Constraints

- Keep Firebase service-account credentials and Supabase secret keys out of browser code and all `VITE_` variables.
- Require Firebase-issued identity tokens for every Supabase mutation.
- Preserve public reads and a visible unavailable-state; do not silently save locally.
- Do not add email/password login, image uploads, moderation tooling, or personal-data forms.
- Every behavior change follows a failing test before production code.

## Review Focus

- Signed-out people must see read-only content and a clear sign-in action; test mutation authorization errors in Task 1.
- An expired Firebase ID token must refresh before a mutation; test the authorization-header provider in Task 1.
- SQL seed rows must not require `auth.uid()`; test applying the migration to a clean project in Task 2.
- A new report must be visible after refresh and must not falsely claim a photo was uploaded; test request payload in Task 3.
- Realtime events must reload current data without duplicating optimistic entries; test the reconciliation path in Task 4.

---

### Task 1: Firebase authentication and Supabase token boundary

**Files:**
- Modify: `package.json`
- Create: `src/auth/firebase.ts`
- Modify: `src/data/groundwork.ts`
- Modify: `src/data/groundwork.test.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Produces `authState`, `signInWithGoogle()`, `signOut()`, and `getAccessToken(): Promise<string | null>`.
- Changes Supabase mutation functions to reject without `getAccessToken()`.

- [ ] Write failing tests for token-header construction and signed-out mutation rejection.
- [ ] Run `node --test --experimental-strip-types src/data/groundwork.test.ts`; verify RED.
- [ ] Install the Firebase Web SDK and implement the Firebase config/auth module plus adapter token injection.
- [ ] Re-run the focused test; verify GREEN.
- [ ] Add Firebase project variables to `.env` locally without printing values.

### Task 2: Correct and secure the database migration

**Files:**
- Modify: `supabase/migrations/20261122000000_groundwork.sql`
- Create: `supabase/README.md`

**Interfaces:**
- Consumes Firebase JWT identity recognized by Supabase.
- Produces seed-safe `reports`, `comments`, vote, and source-link schema with user-owned RLS policies and realtime publication.

- [ ] Write a failing migration smoke-check that asserts seed inserts include a valid system-user path and all six comments.
- [ ] Run the check; verify RED against the existing migration.
- [ ] Revise the migration: allow seeded system rows, seed original comments and vote score totals, set sequences, replace anonymous policies with Firebase-authenticated owner policies, and publish the tables for realtime.
- [ ] Apply the migration in Supabase SQL Editor; verify table/view reads and owner RLS with a Firebase token.
- [ ] Record required Supabase Firebase JWT configuration in `supabase/README.md`.

### Task 3: Complete report and source persistence UI

**Files:**
- Modify: `src/data/groundwork.ts`
- Modify: `src/data/groundwork.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces `createReport(input)` and `createSourceLink(input)` returning mapped entities.
- `ReportFlow` receives `onReportSaved(report)` and only shows success after the report insert resolves.

- [ ] Write failing tests for report payload validation and source-link rollback.
- [ ] Run the focused test; verify RED.
- [ ] Implement report mutation and connect the report completion step to it; retain the current local photo-only behavior in copy.
- [ ] Replace localStorage source saving with authenticated `createSourceLink`, optimistic state, and rollback notice.
- [ ] Re-run focused tests and production build; verify GREEN.

### Task 4: Realtime synchronization and account UI

**Files:**
- Modify: `src/auth/firebase.ts`
- Modify: `src/data/groundwork.ts`
- Modify: `src/App.tsx`
- Modify: `src/data/groundwork.test.ts`

**Interfaces:**
- Produces `subscribeToGroundwork(onChange): () => void`.
- Displays signed-in Google name/avatar and a sign-in/sign-out control in the header.

- [ ] Write failing tests for one reload per realtime change batch and optimistic-entry reconciliation.
- [ ] Run focused test; verify RED.
- [ ] Implement Supabase Realtime WebSocket subscription and reload reconciliation.
- [ ] Add accessible Google login, account status, and sign-out UI; disable write controls with a sign-in explanation while signed out.
- [ ] Run `node --test --experimental-strip-types src/data/groundwork.test.ts && npm run build` and manually verify sign-in, writes, refresh persistence, and cross-tab update.

## External configuration checklist

1. Create/configure Firebase Web app; enable Google under Firebase Authentication; authorize local, preview, and deployed domains.
2. Add four Firebase browser config variables to `.env`.
3. Configure Supabase third-party JWT validation for the Firebase issuer/project before enabling write policies.
4. Apply the revised migration in the Supabase SQL Editor.
