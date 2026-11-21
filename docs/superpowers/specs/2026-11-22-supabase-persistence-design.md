# Supabase persistence design

## Intent

Replace the app's browser-only demo state with shared, durable data while
preserving its existing React/Vite interface and avoiding a new sign-in flow.

## Goals

- Load reports, comments, scores, and saved budget sources from Supabase.
- Persist newly submitted reports, comments, votes, and source links.
- Make votes idempotent per browser installation using a generated anonymous
  device identifier stored locally.
- Show clear loading and failure feedback, and retain the current sample data
  only as an offline/configuration fallback.

## Non-goals

- User accounts, moderation tooling, image uploads, real geolocation, and
  server-side verification are out of scope.
- No secret/server key will be used in the browser.

## Approaches considered

1. **Direct Supabase client with RLS (chosen):** the Vite app uses the
   publishable key, and database policies restrict allowed operations. This
   keeps the existing static deployment and is sufficient for public,
   low-trust community data.
2. **Partial persistence:** only reports and comments become shared. This
   leaves votes and sources misleadingly local, so it does not meet the goal.
3. **Authenticated app with server endpoints:** stronger attribution and
   moderation, but it adds account UX and backend infrastructure that do not
   exist today.

## Design

- Add `@supabase/supabase-js` and a guarded client helper that reads
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Add a SQL migration defining `reports`, `comments`, `report_votes`,
  `comment_votes`, and `source_links`; include seed reports matching the
  existing demo, row-level security, and safe aggregate score/count queries.
- Move database operations into a small data module. The React component loads
  its data on mount and uses optimistic updates that roll back with a visible
  message if a request fails.
- A locally generated UUID identifies a browser for vote upserts. It is not an
  identity or authentication mechanism; policies will allow public writes only
  to the limited fields needed by the interface.
- The report form will insert an actual report after its existing demo check;
  comments and sources will insert actual rows.

## Constraints and safeguards

- Only the Supabase URL and publishable key are client variables. RLS is
  enabled on every public table.
- SQL runs in the Supabase SQL Editor (or Supabase CLI) rather than through
  browser code.
- The app remains usable with its sample data if Supabase is unavailable, but
  will explicitly state that changes cannot be saved.

## Verification

- Add focused tests for row-to-UI mapping and vote state behavior before their
  implementation.
- Run the project test suite and production build.
- With the supplied project configured, load seeded reports and verify a new
  comment, source link, and vote persist after refresh.
