# Firebase Google login and persistence completion

## Intent

Make Groundwork a shared, durable community app: people sign in with Google
through Firebase and use that identity for Supabase-backed reports, comments,
votes, and source links.

## Goals

- Add a clear Google sign-in/sign-out UI and show the signed-in profile.
- Exchange Firebase ID tokens for Supabase-authorized requests so RLS ownership
  applies to the same person using the UI.
- Repair the SQL migration so it runs in the SQL Editor and seeds reports,
  comments, and initial vote totals successfully.
- Persist report creation and budget source links, complete optimistic rollback
  behavior, and add realtime refresh for community data.

## Non-goals

- No email/password account UI, photo upload, admin moderation panel, or
  personal-data collection beyond the Google profile Firebase returns.
- No service/secret key is exposed to the browser.

## Approaches

1. **Firebase Google login plus Supabase third-party JWT trust (chosen):**
   Firebase handles Google popup/login and issues an ID token. Supabase is
   configured to verify Firebase JWTs, allowing `auth.uid()` policies to own
   rows securely.
2. **Supabase Google OAuth:** simpler but does not use Firebase for the UI.
3. **Firebase login plus anonymous Supabase:** creates two unrelated
   identities, so it cannot reliably secure votes or authored content.

## Design

- Add Firebase browser configuration variables and a small auth module. The UI
  initializes Firebase, uses `GoogleAuthProvider`, persists the user profile,
  and supplies a fresh Firebase ID token to database calls.
- Update the direct Supabase REST adapter to require a Firebase access token
  for mutations and use it as the Bearer token. Reads remain public.
- Replace anonymous-user policies with policies keyed to the Firebase user UUID
  as recognized by Supabase. The Supabase project must be configured with the
  Firebase issuer, project ID, and JWT validation/key source before deployment.
- Correct seed rows to use a dedicated nullable `seeded`/system author path,
  insert all original comments and aggregate baseline vote values, then set
  identity sequences correctly.
- Wire the existing report flow to create an actual report after the simulated
  check; wire source links to `createSourceLink`; provide immediate UI updates
  and rollback failures.
- Subscribe to Supabase Realtime changes for reports, comments, votes, and
  links; reload the relevant snapshot on a received change.

## Required configuration

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Enable Google in Firebase Authentication and authorize the preview/deployment
domains. Configure Supabase third-party authentication to trust Firebase JWTs.
These browser values are public identifiers; Firebase service-account
credentials and Supabase secret keys must never be added to `.env` with a
`VITE_` prefix.

## Verification

- Test Firebase-token-to-Supabase authorization headers, unauthenticated write
  rejection, and optimistic rollback paths.
- Apply the revised migration to a fresh Supabase project and verify all seed
  tables/views load.
- Manually sign in with Google, create a report/comment/source link, vote,
  refresh, and verify the same account can see and modify only its own vote.
