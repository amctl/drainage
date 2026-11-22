# Pothole Watch — Product Design

## Intent

Turn Groundwork into a mobile-first pothole watch for local communities. A resident can report a pothole, nearby residents can confirm it, the map can show active reports and verified fixes, and scheduled check-ins can establish whether a road defect remains or has been repaired.

The active product is the React/Vite app at the repository root. The existing Map, Community, and Budget experience uses drainage-oriented sample reports; report creation is a local demo. Supabase currently has general reports, comments, votes, and source links. Mapbox and Delhi ward GeoJSON are already integrated. A separate Flutter Web port exists but is not the active preview.

## Goals

- Make the map and one clear “Report a pothole” action the primary mobile experience.
- Allow a resident to report a location, optionally add a photo and a short note, and save it to Supabase.
- Ask nearby opted-in residents to confirm new reports.
- Show active potholes on the map and a heat layer for community-confirmed fixes over a selectable time window.
- Schedule periodic “Still there?” check-ins for open reports and record responses as evidence in the report history.
- Make uncertainty and data provenance visible: community-confirmed means resident input, not an official road-authority record.
- Keep the core map and report flow usable without enabling notifications.

## Non-goals

- Community discussion feed, ranking/voting, civic budget pages, RTI drafting, or general issue reporting.
- Claiming that the app itself repairs roads or guarantees an agency response.
- Treating one “No, it’s gone” response as conclusive proof of repair.
- Building a native Android/iOS app in this phase; this is a responsive web app.
- Reusing legacy drainage sample rows as real pothole data.

## Product flow

1. **Map:** Open to the user’s approximate/current area when location permission is granted; otherwise show Delhi and let the user navigate. Show active, confirmed pothole pins. Offer a map layer switch between active reports and verified-fix activity.
2. **Report:** Pick the current location or tap the map, review the pin, optionally attach a photo and note, then submit. Show a clear saved/failed result.
3. **Confirm:** Nearby residents who opted in receive a push prompt (with an in-app fallback) to confirm “Yes, it’s here” or “No, I can’t find it.” Confirmation counts are visible, with each account limited to one current response per report.
4. **Follow up:** Seven days after a report, then weekly while it remains open, a scheduled check-in asks nearby opted-in residents whether it is still there. Limit repeat reminders to avoid notification fatigue. “Still there” keeps it active and records a timestamp; “It’s fixed” adds a repair claim. A report becomes a community-confirmed fix only after two distinct residents confirm it is gone, or a future explicit trusted-verifier rule is introduced. If evidence conflicts, keep it active and show the mixed responses.
5. **Fix activity:** The map heat layer shows the number of community-confirmed fixes in each map cell over the chosen period (default 90 days), not a claim about official agency performance. Show the count and sample size on selection; suppress misleading intensity where there is insufficient data.

## Approaches considered

1. **Working web pilot (selected):** React/Vite UI, existing Supabase project with additive tables/RLS, a service worker and Web Push subscriptions, plus Supabase Edge Functions and scheduled jobs for nearby notifications and check-ins. This implements the requested product loop while retaining the current web deployment path. Push delivery requires HTTPS and server-side VAPID/service credentials; unsupported browsers and users who decline permission use in-app prompts.
2. **Clickable prototype:** local-only reports, simulated nearby confirmations and reminders. Faster but does not produce the community data or notifications the product depends on.
3. **Native app:** Flutter/React Native with native push and location. Better long-term device integration, but it replaces the current active web app and requires separate distribution and platform setup.

## Data and privacy

- Add dedicated pothole tables instead of changing or relabeling legacy drainage records: pothole reports, per-user confirmation/check-in responses, push subscriptions, and notification/check-in scheduling metadata.
- Store coordinates required to place a report; request precise geolocation only at the user’s action. Never expose reporter identity or push endpoints in public report queries.
- Use the existing anonymous Supabase session for low-friction reporting and stable per-browser response identity; Google sign-in can remain an optional account path if compatible with current auth policies.
- Use RLS so public clients can read safe report summaries and write only their own reports/responses/subscriptions. Push secrets stay in Edge Function secrets, never in Vite variables.
- Ask for notification permission only after explaining the value and only after an explicit opt-in action. Provide unsubscribe/disable controls and an in-app alternative.
- Photos are optional, size/type-limited, and stored in a private or access-controlled Supabase Storage bucket with access mediated through safe public thumbnails. If storage credentials/policies are not configured, ship location-and-text reporting first and make photo upload visibly unavailable rather than pretending it worked.
- Nearby targeting uses a configurable radius (initial product default: 500 m) around a report. To deliver future alerts, the app must retain a coarse location associated with a push subscription, only after clear opt-in; never collect continuous background location. The permission explanation must state this use and provide disable/delete controls.

## Visual direction

Operate mode, mobile-first. Replace the broad editorial dashboard with a calm, high-contrast street utility: full-screen map, small top location/search control, compact active/fix layer selector, a bottom sheet for the selected pothole, and a large thumb-reachable report button. Use a small fixed bottom navigation only if needed for Map and “My reports”; do not recreate a social feed. Preserve useful map controls and attribution. At wider sizes, the map remains primary and supporting details move into a side panel.

## Technical constraints / setup

- The project is a Figma Make React/Vite app with a dev server already running. Keep the root app as the implementation target and leave the separate `flutter_app/` intact.
- Mapbox and ward geometry are already present; use Mapbox GeoJSON sources/layers for report pins and the fix heat layer.
- The existing Supabase migration contains legacy sample rows; do not present them as potholes. Add new schema/migrations rather than deleting live data.
- Real push requires HTTPS, a registered service worker, VAPID keys, deployment of Edge Functions, scheduled invocation, and runtime environment secrets. Add code and clear setup instructions, but do not imply push works until those external settings are completed.
- A scheduled task cannot run in a purely static browser. Follow-up due times and notification dispatch must be handled server-side; client-only periodic timers are not a substitute.
- If notification infrastructure or Supabase configuration is unavailable, maintain truthful degraded states and allow reports/check-ins to be recorded where the database is connected.

## Success measures for a pilot

- Residents can submit a real pothole report without an account barrier.
- At least one other opted-in nearby resident can confirm or reject it.
- Follow-up records distinguish still-present, cannot-find, and fixed claims over time.
- The map’s active and fix-activity layers are derived from real pothole records and confirmed outcomes, never hard-coded sample claims.
- A community can see what happened to its reports without the app implying official action it cannot verify.

## Open implementation calls

- Exact edge-function/runtime scheduling mechanism depends on the connected Supabase project’s enabled extensions and deployment access; implementation should provide SQL/function sources and setup steps.
- Photo upload is conditional on confirming an appropriate storage bucket and policy; text/location reports remain the minimum viable flow.
- Notification radius is configurable and begins at 500 m for the pilot; revisit using community size and response rates.
- Check-ins begin seven days after a report and repeat weekly while unresolved, with a strict reminder cap; tune after pilot response rates.
- “Cannot find it” reduces confidence but does not count as a repair. Two distinct “fixed” responses are the initial repair confirmation threshold.
