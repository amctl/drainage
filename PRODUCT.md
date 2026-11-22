# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Residents who encounter a pothole and nearby residents who can confirm whether it is present or has been repaired.

## Product Purpose

Groundwork helps residents report potholes, confirm nearby reports, and record whether a reported pothole remains or has been community-confirmed fixed. Success means a local community can see current reports and a credible history of resident follow-up.

## Positioning

Groundwork uses nearby resident confirmations and scheduled follow-ups to keep pothole reports current. It organizes community evidence; it does not itself repair roads or guarantee an authority response.

## Operating Context

Residents use the product from a phone while navigating their local streets. A report can use a location selected on the map or a location the resident explicitly shares. Opted-in residents may receive browser push prompts to confirm a report or answer a later check-in.

## Capabilities and Constraints

- The active app is React/Vite with Mapbox GL JS and Supabase; a separate Flutter Web port is not the active preview.
- Pothole reports and responses are a distinct dataset from legacy drainage examples.
- New reports need nearby existence confirmations. A resident saying “cannot find it” is not evidence of repair.
- A pothole is community-confirmed fixed after two distinct residents report it fixed in the same check-in cycle, with no conflicting “still there” response in that cycle.
- Follow-ups begin seven days after a report and repeat weekly while unresolved, with a reminder cap.
- Nearby notification targeting starts at 500 m. Coarse location is retained only after explicit notification opt-in; there is no continuous background tracking.
- Browser push requires HTTPS, a service worker, VAPID credentials, deployed server-side functions, and scheduled server execution. Reporting must remain usable when push is unavailable or declined.
- The default fix-activity window is 90 days and represents resident-confirmed fixes, not official agency performance.
- Existing ward boundaries and example drainage reports are not authoritative pothole, road-condition, or repair records.
- Report images are optional and can be enabled only when Supabase Storage is configured with suitable access rules.

## Evidence on Hand

- The source contains the active React/Vite app at `src/App.tsx`.
- Mapbox GL JS is already integrated in the React app.
- `public/data/wards_delhi.geojson` and `public/data/Delhi.geojson` are supplied map boundary data; neither provides pothole or repair outcomes.
- Existing Supabase migration data contains illustrative drainage examples and must not appear as real pothole data.
- No official road-repair feed or authority integration is present.

## Product Principles

- Make a report and follow-up easy from a phone.
- Treat resident observations as evidence with visible counts and timestamps, not official certification.
- Ask for location and notification permission only when needed, explain the use, and provide controls to withdraw it.
- Keep the app useful when push notifications are unavailable.
- Never present illustrative or legacy data as live pothole or repair information.
