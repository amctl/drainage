# Flutter Web Migration Design

## Intent

Move Groundwork from its React/Vite implementation to Flutter Web while preserving the current browser experience and its existing Firebase and Supabase project. The migration should make Flutter the eventual app implementation without losing the working React preview before the Flutter version can be built and checked.

## Current product

The current app has Map, Community, and Budget views. The map displays Mapbox streets, ward outlines, region selection and highlights, report pins, and report details. Community provides searchable/filterable reports, discussion threads, comments, and votes. Budget provides illustrative zone summaries, saved source links, and an RTI letter generator. Google sign-in uses Firebase. Reports, comments, votes, and source links use Supabase when configured and sample data otherwise. The report submission flow is explicitly a local demo and does not publish an authority complaint.

The implementation is concentrated in `src/App.tsx`, with Firebase auth in `src/auth/firebase.ts` and Supabase access in `src/data/groundwork.ts`. Mapbox uses `public/data/wards_delhi.geojson` for ward outlines and derived 13-area selection. Flutter 3.50.1 is present through a mise installation, but its SDK directory is read-only to this workspace and package-registry network access is restricted.

## Goals

- Rebuild the existing browser product in Flutter Web, retaining its three views and current visual identity.
- Preserve Mapbox rendering, ward outlines, region highlights, automatic focus, report pins, and report selection.
- Preserve text search, region filtering, report discussions, comment votes, report votes, source links, and the demo-only report flow.
- Use Firebase Authentication for Google sign-in and pass the Firebase ID token to Supabase so existing RLS ownership continues to apply.
- Keep Supabase unavailable/offline states visible and preserve sample data as a fallback.
- Keep the current React/Vite implementation available during the migration; only switch the primary preview/deployment after Flutter can be built and its flows checked.

## Non-goals

- Android or iOS builds in this migration. Flutter Web is the selected target.
- A new backend, database schema, authentication provider, report moderation flow, image upload, live geolocation, or official complaint submission.
- Replacing the ward GeoJSON with new geographic data or claiming the older ward file represents exact legal revenue boundaries.
- Changing the product’s copy, report semantics, or budget figures as part of the framework migration.

## Approaches considered

1. **Standalone Flutter Web app alongside React (chosen):** create a Flutter project in a dedicated directory, port the app and its integrations, and keep the current Vite preview usable until parity is verified. This preserves the existing browser experience during migration. The Flutter app needs its own run/build command and will not appear through the current Vite server automatically.
2. **Replace the root Vite app immediately:** make Flutter the root project and remove the React implementation during the same pass. This is a shorter final structure, but the workspace has no Flutter SDK, so neither the app nor the existing preview could be validated here during the conversion.
3. **Flutter mobile app:** target Android/iOS. This does not replace the current browser app and is outside the selected web target.

The user selected Flutter Web. The selected migration shape is approach 1 so the current preview remains available until the Flutter implementation can be run in a Flutter-enabled environment.

## Architecture

- Add a standalone Flutter Web project under `flutter_app/` with Dart code organized by feature: app shell/navigation, map, community, budget, auth, and data.
- Use the official `mapbox_maps_flutter` package for the web map and load the existing `wards_delhi.geojson` as a Flutter asset. Keep the map’s source/layer behavior in a dedicated map widget/controller.
- Use `firebase_core` and `firebase_auth` for Firebase initialization, Google sign-in, signed-in profile state, and sign-out.
- Use `supabase_flutter` for reads and writes. Configure its Firebase token callback from `FirebaseAuth.instance.currentUser?.getIdToken()`, matching the project’s existing Firebase third-party JWT integration. Keep sample-data fallback and surface request errors.
- Pass Mapbox, Supabase, and Firebase public configuration through Flutter build-time defines. Add a safe example config file with empty values; do not copy live credentials into Dart source or commit them.
- Leave the current Vite root and `.env` behavior untouched during the port. Document Flutter Web run/build commands and the eventual preview/deployment cutover requirements.

## Data and behavior details

- Preserve the report, comment, vote, and source-link field mappings already used by the Supabase adapter.
- Preserve report and comment vote toggling and write-failure rollback behavior.
- Keep reports searchable by title, place, area, and type; region selection filters report pins and highlights the matching ward polygons.
- Keep the report workflow labeled as a practice/demo flow. Photo selection stays local and no report or photo is published.
- Keep budget totals illustrative and the RTI generator a local copyable draft.
- Keep current 13-area display names. Area-to-ward assignments continue to use the existing ward-name mapping because the supplied file has no revenue-district attribute.

## Configuration and platform constraints

- Flutter Web requires a Flutter SDK and browser. The installed SDK is outside the writable workspace and its normal launcher cannot update its cache; package resolution also needs access to pub.dev.
- The current Mapbox Flutter package documentation lists Flutter 3.38.1 / Dart 3.10.0 as its minimum and includes Web support. Confirm the selected stable package version when implementation begins.
- Mapbox’s Flutter Web implementation injects its Mapbox GL JS assets; the access token must be supplied at build time.
- Firebase’s Google provider must remain enabled and the eventual Flutter Web origin must be authorized in Firebase.
- Supabase must continue trusting the existing Firebase project, and its Firebase JWTs must have the `authenticated` role claim for the current RLS policies.
- Flutter source and assets can be prepared here, but `flutter pub get`, `flutter analyze`, widget tests, `flutter run`, and `flutter build web` require installing/providing the Flutter SDK first.

## Acceptance criteria

- Flutter Web contains the Map, Community, and Budget views and preserves the major current user flows.
- Mapbox displays the existing ward data; selecting an area highlights and focuses the corresponding polygons; report pins remain selectable.
- Firebase Google sign-in works in the Flutter Web app and the token is used for protected Supabase mutations.
- Supabase data loads and mutations preserve optimistic rollback; unavailable configuration or request failures display an actionable message and sample data remains usable.
- The report practice flow does not publish or upload anything.
- The current React/Vite app remains launchable until a Flutter-enabled environment verifies the web build and core flows.

## Documentation references checked

- Flutter Web build and deployment: https://docs.flutter.dev/platform-integration/web/building
- Mapbox Maps SDK for Flutter package and supported platforms: https://pub.dev/packages/mapbox_maps_flutter
- Supabase Flutter quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/flutter
- Supabase Firebase third-party auth and Dart access-token callback: https://supabase.com/docs/guides/auth/third-party/firebase-auth
- Firebase Authentication for Flutter: https://firebase.google.com/docs/auth/flutter/start
