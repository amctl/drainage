# Flutter Web Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Flutter Web version of Groundwork with feature parity for map, community, budget, Firebase Google sign-in, and Supabase persistence, while keeping the current React/Vite app available until the Flutter app is verified.

**Architecture:** Add a self-contained Flutter project under `flutter_app/`. Split models, Firebase auth, Supabase data access, map, and screens into focused Dart files. Use Mapbox Maps SDK for Flutter Web, the existing ward GeoJSON as an asset, Firebase ID tokens through `supabase_flutter`'s access-token callback, and the current Supabase schema. Keep the Vite root unchanged during migration.

**Tech Stack:** Flutter Web, Dart, `mapbox_maps_flutter`, `firebase_core`, `firebase_auth`, `google_sign_in`, `supabase_flutter`.

**Spec:** `docs/superpowers/specs/2026-11-22-flutter-web-migration-design.md`

## Global Constraints

- Target Flutter Web only in this migration.
- Keep the current React/Vite project launchable and do not redirect its preview until Flutter can be built and checked.
- Preserve the current product behavior, visual identity, copy, demo boundaries, and Supabase schema.
- Do not publish reports, upload photos, or request live location; the report flow stays a local practice flow.
- Use only public Mapbox, Firebase, and Supabase client configuration; do not copy secrets into source.
- Do not add or run tests unless the user asks. Use formatter/analyzer/build checks when the Flutter SDK is available.
- Flutter 3.50.1 is installed outside the writable workspace. Its normal launcher cannot update the read-only SDK cache, and pub.dev is unreachable from the package-resolution command; Flutter compilation therefore remains unverified here.

## Review Focus

- Mapbox Web SDK/token initialization, asynchronous map style load, and cleanup on screen changes.
- GeoJSON asset bundling and selected-area highlighting with the supplied 272-ward-era geometry and existing 13-area name mapping.
- Firebase Google sign-in, Firebase ID token refresh, and Supabase RLS `authenticated` role expectations.
- Supabase response mapping, offline fallback, and rollback after failed votes/comments/source writes.
- Responsive map, report drawer, search/filter controls, and navigation at narrow and wide browser widths.
- Build-time configuration for Firebase Web options, including the messaging sender ID that is not currently listed in `.env`.

## File Structure

- `flutter_app/pubspec.yaml` — Flutter package metadata, dependencies, and GeoJSON asset registration.
- `flutter_app/lib/main.dart` — Flutter and Firebase/Supabase startup.
- `flutter_app/lib/app/groundwork_app.dart` — app shell, global state, navigation, search, and shared notices.
- `flutter_app/lib/app/groundwork_theme.dart` — colors, typography, spacing, and reusable button styles based on the current React design.
- `flutter_app/lib/config/app_config.dart` — build-time Mapbox, Firebase, and Supabase configuration.
- `flutter_app/lib/models/` — report, comment, vote, and source-link models plus the 13-area list/mapping.
- `flutter_app/lib/data/groundwork_repository.dart` — Supabase reads/writes and local fallback data.
- `flutter_app/lib/auth/auth_controller.dart` — Firebase initialization, Google sign-in/out, and auth state.
- `flutter_app/lib/features/map/` — Mapbox widget, GeoJSON source/layers, area focus/highlight, report pins, and selected-report panel.
- `flutter_app/lib/features/community/` — community report list, thread, comment composer, sorting, and vote controls.
- `flutter_app/lib/features/budget/` — illustrative zone cards, saved source links, and RTI draft/copy flow.
- `flutter_app/lib/features/report/` — local photo selection and demo-only report flow.
- `flutter_app/assets/data/wards_delhi.geojson` — copy of the existing map asset, bundled by Flutter.
- `flutter_app/web/index.html` — Flutter Web HTML shell and app title/icon setup.
- `flutter_app/README.md` — SDK requirements, build/run instructions, and required `--dart-define-from-file` keys.
- `flutter_app/config.example.json` — empty/public configuration template; no live credentials.

## Tasks

### Task 1: Create the Flutter Web package and app foundation

- Add the Flutter package structure under `flutter_app/` without changing the Vite root.
- Configure dependencies for Mapbox, Firebase Auth, and Supabase using versions compatible with the current stable Flutter SDK and Mapbox package minimum.
- Add app config parsing with clear missing-value diagnostics for Mapbox token, Supabase URL/key, and Firebase API key, auth domain, project ID, app ID, and messaging sender ID.
- Register and bundle `wards_delhi.geojson` as an asset.
- Build the shared theme and responsive app shell structure for Map, Community, and Budget navigation.
- Document Flutter SDK 3.38.1+/Dart 3.10+ requirements and `flutter run -d chrome` / `flutter build web` commands.
- Expected result: the Flutter project has a package skeleton and configuration contract; Flutter compilation is deferred until the SDK cache is writable and package resolution can reach pub.dev.

### Task 2: Port auth and Supabase data access

- Initialize Firebase from build-time options and expose signed-in user state, Google sign-in, sign-out, and ID-token refresh.
- Initialize `supabase_flutter` with an `accessToken` callback that returns the current Firebase ID token.
- Port report/comment/source row mapping, load `report_summaries`, `comment_summaries`, and `source_links`, and preserve local fallback models.
- Port comment creation, report/comment vote toggles, and source-link creation with request error messages and rollback-compatible repository results.
- Preserve existing schema and RLS behavior; do not create Supabase tables or modify migrations for this port.
- Expected result: app features can depend on a typed repository and auth controller rather than making requests from widgets.

### Task 3: Port the Mapbox map and area selection

- Load `/assets/data/wards_delhi.geojson` through Flutter assets and map features to the existing 13 area labels using ward-name aliases.
- Create Mapbox GeoJSON sources/layers for ward outlines, selected-area fill/outline, and report pins.
- Implement area highlight, auto-focus, all-areas framing, report pin selection, report focus, and map resize behavior.
- Add visible loading, missing-token, Mapbox-request, and GeoJSON-loading errors.
- Expected result: selecting each area highlights/focuses its grouped polygons and report pins remain selectable on Flutter Web.

### Task 4: Port the Map screen, search, and report context

- Recreate the current header/nav, text search, region selector, map labels, report list, selected-report panel, and empty states.
- Search reports by title, place, area, and kind; filter report list and map pin emphasis consistently with the selected area.
- Keep keyboard focus and responsive mobile/desktop layouts usable.
- Expected result: core map browsing works with local fallback data before Supabase is available.

### Task 5: Port Community and discussion flows

- Recreate community report cards and sorting, empty states, thread view, nested replies, comment composer, and vote controls.
- Connect comments and votes to the repository with optimistic updates and rollback on request errors.
- Keep reports searchable and region-filtered across Map and Community views.
- Expected result: signed-in users can create comments and vote with Supabase-backed state; read-only fallback remains available offline.

### Task 6: Port Budget, RTI draft, sources, and report practice flow

- Recreate illustrative budget-zone cards and navigation, source-link form/list, and RTI application copy flow.
- Connect source links to Supabase while preserving local validation and error feedback.
- Recreate the local photo-selection/check steps without uploading or publishing report data.
- Expected result: Budget and report practice flows match the existing app's semantics and demo boundaries.

### Task 7: Final integration notes and available verification

- Ensure all routes/views share repository/auth state and notices; verify screens do not silently report database success when fallback data is active.
- Keep the root Vite preview unchanged and document the separate Flutter Web launch/build commands and required Firebase/Supabase/Mapbox values.
- Run Flutter formatter, analyzer, and production web build only after a Flutter SDK is available; do not switch the root preview/deployment before those checks and browser flow checks pass.
- Expected result: a self-contained Flutter Web implementation is ready for review, with the existing React app still launchable.

## Completion

The migration is complete when Tasks 1–7 satisfy their expected results, Flutter Web builds in a Flutter-enabled environment, and Mapbox, Firebase Google sign-in, Supabase persistence/fallback, area selection, Community, and Budget flows have been checked in a browser. Until then, the Vite app remains the default preview.
