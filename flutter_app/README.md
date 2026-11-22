# Groundwork Flutter Web

This is a side-by-side Flutter Web port. The existing React/Vite app remains at the repository root and is still the default preview.

## Requirements

- Flutter 3.38.1 or later and Dart 3.10 or later
- Chrome for local browser runs
- Public Mapbox token, Supabase URL/publishable key, and Firebase Web app settings
- Firebase Google provider enabled; the Flutter hosting origin authorized in Firebase
- Supabase Firebase third-party JWT integration configured for the existing Firebase project and RLS policies

## Configure

Copy `config.example.json` to `config.json` and fill it with the public settings. Flutter does not read the root `.env` automatically. Map the current Vite keys as follows:

| Flutter define | Existing Vite key |
| --- | --- |
| `MAPBOX_ACCESS_TOKEN` | `VITE_MAPBOX_ACCESS_TOKEN` |
| `SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `FIREBASE_API_KEY` | `VITE_FIREBASE_API_KEY` |
| `FIREBASE_AUTH_DOMAIN` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `FIREBASE_PROJECT_ID` | `VITE_FIREBASE_PROJECT_ID` |
| `FIREBASE_APP_ID` | `VITE_FIREBASE_APP_ID` |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project settings → General → Web app configuration |

`config.json` is ignored by Git. These are browser client values, not server secrets. Restrict the Mapbox token by allowed URL and the Firebase API key by authorized application where practical.

## Run and build

From `flutter_app/`:

```sh
flutter pub get
flutter run -d chrome --dart-define-from-file=config.json
flutter analyze
flutter build web --release --dart-define-from-file=config.json
```

The production files are written to `flutter_app/build/web/`. The current root Vite preview does not automatically serve this directory; keep using Vite until the Flutter Web build and browser flows are reviewed.

## Data behavior

- Map, Community, and Budget are ported into Flutter. Mapbox loads the bundled Delhi ward GeoJSON, outlines all wards, highlights the selected 13-area grouping, and focuses the map on the selection or selected report.
- Firebase Google sign-in supplies the Firebase ID token to Supabase. Database-backed comments, votes, and source links require a signed-in user and an available Supabase connection.
- Public report/comment/source reads use the existing summary views/tables. If Supabase is unavailable, the UI uses bundled sample reports and comments and shows a connection notice.
- The practice report/photo flow is local only. It does not create report rows, upload files, submit official complaints, or file RTI requests.
- Budget values and ward-to-area groupings are illustrative. The supplied ward GeoJSON does not include authoritative revenue district identifiers.
