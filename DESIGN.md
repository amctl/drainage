# Groundwork — product & visual design

> **A street-level public record, built by the people who live there.**

Groundwork is a community map for drainage problems and the work done to fix them. It should feel like a neighbourhood noticeboard with the rigour of a local newsroom: direct, useful, and hard to dismiss. It is not a government portal and should never imply that an unverified community post is an official finding.

## Design direction: The Glass Neighbourhood

Keep the map as the canvas and place a Reddit-inspired neighbourhood feed over it. Use familiar community patterns—Hot / Top / New, a clear vote rail, comment counts, contributor context—inside a calmer civic interface. The interface should feel social and active while keeping the evidence and source of every claim easy to read.

Use translucent warm-paper panels over a restrained map, with ink-green structure and muted earth-toned status cues. Glass belongs on floating navigation, search, the feed shell, and dialogs. Keep report content itself crisp and readable; do not blur text or put translucent layers over photographs. Each report should answer, at a glance: **what happened, where, when, who confirmed it, and what the agency has done since.**

### Product principles

1. **Show the evidence.** Label citizen observations, community confirmations, and official updates separately. Display the source and date of every government action.
2. **Make place concrete.** Use neighbourhood, ward, road, and nearby landmark names. A pin should open the same report shown in the feed.
3. **Give the community useful control.** Hot, Top, and New sorting; clear geographic filters; Reddit-familiar voting; and a direct route to report a problem.
4. **Treat trust as earned.** Show a contributor’s track record and verification status with context. Never let a badge imply government endorsement.
5. **Use glass with restraint.** Translucency should establish map overlays and depth. Colour communicates status, source, or action. Avoid gradients, neon glow, and decorative motion.

## Reference points

These are references for specific interaction and editorial qualities, not templates to copy.

| Reference | Borrow | Leave behind |
| --- | --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org/) | A map that stays legible and useful as the primary surface. | The assumption that the map alone explains what is happening. Groundwork adds a human report feed. |
| [Mapbox Light](https://www.mapbox.com/maps/light) | A restrained basemap that gives data overlays room to read. | Default marker styling. Groundwork’s markers encode drainage status and open report details. |
| [Reddit](https://www.reddit.com/) | Vote rail, post hierarchy, comment counts, community identity, and Hot / Top / New controls. | Dense chrome, community slang, and engagement for its own sake. Votes should help surface corroborated issues. |
| [ProPublica Local Reporting Network](https://www.propublica.org/local-reporting-network) | Evidence-led civic accountability and clear separation between claim and verified finding. | Long-form article density in the map view. Put the summary first and let the timeline carry detail. |
| [GOV.UK Design System](https://design-system.service.gov.uk/) | Plain labels, readable forms, obvious focus states, and accessibility as a baseline. | Government branding. Groundwork is an independent community service. |

## Colour

Use a warm, civic palette with clear semantic roles. Keep the map pale and low contrast so drainage data remains prominent.

| Token | Hex | Use |
| --- | --- | --- |
| `ink` | `#173F3A` | Brand, main headings, selected map marker |
| `water` | `#65766F` | Water / drainage data, quiet links, verified community details |
| `paper` | `#FFFDF7` | Feed, search, and information panels |
| `canvas` | `#E9EEF0` | Map loading background and page fallback |
| `line` | `#D7D0C0` | Dividers, outlines, and control borders |
| `silt` | `#756B5B` | Secondary text and low-priority metadata |
| `saffron` | `#D8C8A2` | Quiet highlight, active control accents |
| `urgent` | `#9B6D60` | Needs attention marker and understated status cue |
| `in-progress` | `#A58E67` | Work underway marker |
| `resolved` | `#668479` | Resolution confirmed marker |

### Colour rules

- Always pair status colour with a text label and, where useful, an icon. Colour alone is not status information.
- Use `urgent`, `in-progress`, and `resolved` consistently on cards, pins, timelines, and filters.
- Keep body text high contrast. Reserve `silt` for secondary information, never for essential instructions.
- Avoid using a full rainbow of category colours. Categories can use small labels; status owns the strong colour.

## Typography and shape

- **Interface:** Geist Sans, already loaded by the app. Use compact, practical UI labels and generous line height for report text.
- **Report titles:** Geist Sans semibold. Keep titles sentence case and specific; avoid all-caps headlines.
- **Numbers and timestamps:** Geist Mono where alignment or auditability matters, such as vote counts, ward IDs, budgets, and update times.
- **Shape:** Use `10–18px` radii for floating panels and report cards, `8–12px` for controls, and full pills for the sort selector. Reserve circles for avatars and map location dots.
- **Depth:** Use translucent warm paper (`72–86%` opacity), a `16–24px` backdrop blur, a fine white edge, and one soft shadow for map overlays. Keep cards inside the feed lighter and less blurred than the shell.
- **Spacing:** Use a 4px base scale. Give report cards room to breathe, but keep the feed information-dense enough to scan.

## Map and layout

### Desktop

- Fill the viewport with the map; do not put it inside a decorative frame.
- Keep a compact brand mark at the upper left and a wide search field near the top centre.
- Put the report feed in a fixed-width, scrollable glass panel over the left side of the map. Keep text contrast strong and photos unblurred.
- Keep map controls and the status legend in consistent, reachable corners. Do not cover key report clusters.
- Selecting a card highlights its marker and moves the map to the report. Selecting a marker highlights and scrolls the matching card into view.

### Mobile

- Keep the map visible in the upper portion of the screen.
- Put search and area selection in a compact top row. Present the feed as a bottom sheet with a clear drag or expand affordance.
- Keep the report action reachable with one hand. Ensure voting controls do not become smaller than a comfortable touch target.
- When a report opens, preserve a clear way back to the map and feed.

### Basemap and markers

- Start with Mapbox Light or a custom low-saturation light style. Reduce visual weight on minor roads and points of interest; retain neighbourhood names, major roads, and waterways.
- Distinguish reports by status, not by arbitrary category colour. Use a small solid marker for a report and a count marker only when locations are clustered.
- Show the selected report with a dark ink outline and a visible label. Do not use a constant pulsing animation; reserve motion for a new or selected update.
- Provide a compact legend with labels: **Needs attention**, **Work underway**, **Resolved**. Add a separate cue for official records when those layers exist.
- Keep Mapbox attribution visible and accessible.

## Report feed

Each card uses this order:

1. **Issue title** — a short, factual description.
2. **Place and time** — locality / ward, then when observed or updated.
3. **Status** — needs attention, work underway, or resolved; include the source and last update.
4. **Evidence** — photo preview, community confirmation, government record, or timeline entry.
5. **Contributor** — display name and a compact reputation signal with an explanation on demand.
6. **Community actions** — upvote, downvote, and comment count.

Use a Reddit-like vertical vote rail at the leading edge of each card. Keep the issue title, place, time, source, and status in a clear reading column. Cards can have a soft surface and medium corner radius, but avoid stacks of nested pills. Use a real uploaded photo when present; do not make a gradient block pretend to be evidence. Empty states should explain how to broaden the area or submit the first report.

### Sorting and area filters

- Keep **Hot / Top / New** visible together. Use a quiet inset track and a pale raised surface for the active option.
- Make the selected scope explicit: **India → State / UT → City → Zone → Ward**. Only offer scopes with supported data; show unavailable levels as disabled or omit them.
- Show the current scope beside the result count. A filter change updates both feed and map pins together.
- Define sorting in product logic: New by observation time, Top by vote score and selected time window, Hot by recent activity with a transparent ranking rule.

## Trust, progress, and social behaviour

- Separate **reported by residents**, **confirmed by residents**, **agency update**, and **resolution confirmed**. These are different claims and need different labels.
- Every official update should show the department or source, a link or record ID when available, and the date it was checked.
- Let residents add a follow-up photo or correction to the same issue instead of fragmenting one problem into duplicate posts.
- Voting changes visibility; it does not verify a claim. Make report age and corroboration visible so old, popular posts do not look current.
- Reputation should reward useful, confirmed contributions and age out or contextualize old scores. Explain how it is earned.
- Use neutral, specific language. Say “Residents report standing water” until evidence supports a stronger statement.

## Motion

- Use short transitions: `160–220ms` for hover, vote, and selection feedback; `240–340ms` for panel and card entry.
- Give newly shown cards a subtle upward fade. A selected marker can pop once, and a vote can briefly scale or tint.
- Do not pulse every map marker or animate background decoration. Motion should explain a state change.
- Respect `prefers-reduced-motion`; remove entrance, scale, and map motion where possible while keeping state changes clear.

## Interaction and accessibility

- Use visible keyboard focus in `water` or `ink`; do not remove outlines without replacing them.
- Give every icon-only action an accessible name. Keep selected tabs and votes exposed through state semantics.
- Meet WCAG AA contrast for text and controls. Test semantic status colours on both paper and map surfaces.
- Respect reduced motion. Map fly-to and sheet transitions should be short and should never block interaction.
- Keep controls square and easy to hit. Visual compactness must not reduce touch targets.
- Make filters and sorting keyboard-operable; do not rely on hover for essential actions.

## Voice and content

Write like a careful local reporter, not a campaign slogan or a dashboard vendor.

- Prefer: “Drain blocked at Lajpat Nagar market. Photo added 8:42 am.”
- Prefer: “Work marked complete by MCD, 14 Nov. Residents have not confirmed the fix.”
- Avoid: “A smarter, people-powered future starts here.”
- Avoid treating a modelled, scraped, or unverified status as live government data.

Use Indian place conventions, local time, Indian numbering where relevant, and local agency names. Keep multilingual labels short enough to fit controls without truncation.

## Current implementation notes

The home screen currently has a Mapbox Light basemap, sample Delhi reports, local-only votes, and a mock photo verification flow. The design should present these as demo data until real user accounts, report storage, moderation, image uploads, and official source integrations are connected. Never style a demo value as a verified live government record.

## Design review checklist

- [ ] Can a new resident find their locality and see the active reports quickly?
- [ ] Does every visible report say where and when it was observed?
- [ ] Is official progress distinguishable from resident-reported progress?
- [ ] Do the map pin and feed card stay in sync?
- [ ] Can someone use search, filters, sorting, voting, and reporting from a keyboard?
- [ ] Are status colours paired with text and readable against their surfaces?
- [ ] Does the page still read as a real map, rather than a stack of floating cards?
- [ ] Are sample or mocked values clearly identified as such?
