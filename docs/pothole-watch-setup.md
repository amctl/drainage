# Pothole Watch pilot setup

The React app reads and writes pothole reports through Supabase. Push delivery and private photos need the one-time server setup below. Until it is deployed, the app reports that notification delivery is unavailable and keeps map reporting available.

## 1. Configure the frontend

Set these public values in the Vite environment (for example, `.env.local`):

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_MAPBOX_ACCESS_TOKEN=pk...
VITE_VAPID_PUBLIC_KEY=...
```

Use the Supabase publishable key, never a secret key, in the browser. The app uses anonymous Supabase Auth sessions for posting and responding, so enable anonymous sign-ins in Auth settings. Serve the production app over HTTPS for browser push.

## 2. Apply the database migration

Apply `supabase/migrations/20261123000000_pothole_watch.sql` to the project using the Supabase CLI or SQL editor. It creates isolated pothole and response tables, a safe public summary view, row-level policies, and the follow-up outbox and service-only queue functions. Existing drainage tables are not used by the new app.

## 3. Create the private photo bucket

Create a **private** Storage bucket named `pothole-photos` in the Supabase Dashboard (or Storage API). Set its maximum file size to 8 MB and allow `image/jpeg`, `image/png`, and `image/webp`. The migration adds owner-only upload and delete policies. Do not make this bucket public: the app requests a 30-minute signed URL from `pothole-photo-url` after confirming a report has an attached photo.

## 4. Configure push keys and deploy functions

Generate a VAPID key pair with a Web Push VAPID generator. Put only the public key in `VITE_VAPID_PUBLIC_KEY`. Set the following in Supabase Edge Function Secrets:

```text
VAPID_SUBJECT=mailto:YOUR_OPERATIONS_EMAIL
VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
```

The public key must match the frontend value. Keep the private key and Supabase secret API key out of the frontend and source control. Deploy these functions:

```sh
supabase functions deploy pothole-photo-url
supabase functions deploy notify-nearby-report
supabase functions deploy process-pothole-followups
```

`process-pothole-followups` accepts the project's default secret key in the `apikey` header. Its `verify_jwt = false` setting is required because it authenticates that secret through `@supabase/server`.

## 5. Schedule weekly check-ins

In Supabase, enable `pg_cron`, `pg_net`, and Vault. Store the project URL and default secret API key in Vault, then schedule the worker once per minute. The worker queues only due reports, creates each report/cycle job once, advances the check-in cycle atomically, and retries temporary push failures. It sends at most eight weekly reminders per report.

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'pothole_project_url');
select vault.create_secret('sb_secret_...', 'pothole_scheduler_key');

select cron.schedule(
  'process-pothole-followups-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'pothole_project_url') || '/functions/v1/process-pothole-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'pothole_scheduler_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Use the project's current default `sb_secret_...` key. If the project is still on legacy keys, migrate to the current secret key format before using this schedule. Supabase documents Vault-backed credentials for `pg_cron` calls to Edge Functions; the decrypted key is briefly present in `pg_net`'s request queue while the request is sent.

## 6. Verify the pilot

- Open the app over HTTPS and confirm the report map loads from `pothole_summaries`.
- Submit a report with map placement and confirm it appears after refresh.
- In a second account, respond “Yes, it’s here”; a report becomes active after two distinct confirmations.
- On a test report, move `next_check_at` into the past and invoke `process-pothole-followups` with the secret key. Confirm one nearby opted-in device gets a weekly prompt and a second invocation does not create another cycle.
- Submit two `fixed` responses in one check-in cycle and confirm the report becomes community-confirmed fixed. The fix heat layer then includes it within the selected 30/90/180-day window.
- Turn alerts off in the app; confirm its subscription and stored coarse location are removed.

Browser push requires user permission and a supported browser. iOS browsers generally require the web app to be installed on the Home Screen. If push is unsupported or declined, reports and map browsing continue to work, and check-ins remain available from report details.

## Current limits

- Reports are resident submitted and resident verified; this app does not ingest a city work-order feed or claim official repair completion.
- Nearby targeting uses the location the person explicitly shared when enabling alerts, rounded to three decimal places, and a 500 m radius. The app does not collect background location.
- Photo storage, notifications, and periodic check-ins remain unavailable until the external Supabase setup above is deployed. The frontend build alone does not activate server-side delivery.
- Mapbox requires a valid public token and network access to Mapbox styles and tiles.
