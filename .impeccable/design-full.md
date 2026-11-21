---
name: Groundwork
description: A city map for resident drainage reports and civic follow-up.
colors:
  pine: "#173F3A"
  ink: "#172A27"
  muted-ink: "#53655F"
  map-ground: "#E6EDEE"
  community-ground: "#E9EFF0"
  glass: "rgb(249 252 252 / 0.85)"
  urgent: "#A95245"
  underway: "#987137"
  resolved: "#457762"
  warm-highlight: "#F2D28C"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 780
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 760
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 650
    lineHeight: 1.4
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  chip: "8px"
  control: "12px"
  card: "16px"
  shell: "20px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 13px"
  button-primary-hover:
    backgroundColor: "#0D322D"
  navigation-active:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.pine}"
    rounded: "10px"
    height: "38px"
  input-search:
    backgroundColor: "rgb(255 255 255 / 0.62)"
    textColor: "{colors.ink}"
    rounded: "13px"
    height: "42px"
    padding: "0 11px"
  report-card:
    backgroundColor: "rgb(250 252 251 / 0.77)"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
---

# Design System: Groundwork

## Overview

**Creative North Star: “A City, Held in Glass”**

Groundwork uses clear frosted surfaces to keep civic tools readable over a living map. Cool city fields and deep pine controls make the interface feel calm and precise; report-state colors carry urgent meaning. Glass is structural: it separates search, navigation, and report details from the map beneath them.

The Community view gives residents a familiar social reading pattern with voting, sort controls, discussion counts, and contributor context. Its cards stay crisp rather than blurred so status, source, place, and time remain easy to scan. The interface is dense enough to browse a city, with generous touch targets and strong text contrast.

**Key Characteristics:**
- The map is the primary surface; Community is a distinct second view.
- Translucent glass groups controls and selected-report context over geography.
- Deep pine anchors actions; status colors are semantic and always paired with labels.
- Community posts use a clear vote rail and compact civic metadata.

## Colors

The palette uses cool blue-gray map and feed grounds, translucent near-white glass, deep pine for action, and restrained report-state colors.

### Primary
- **Deep Pine** (`pine`): Brand mark, primary actions, selected navigation, and map context headings.
- **Warm Highlight** (`warm-highlight`): A small note of warmth in the brand mark and camera actions.

### Secondary
- **Urgent Rust** (`urgent`): Reports needing attention.
- **Work Amber** (`underway`): Work underway.
- **Resolved Sage** (`resolved`): Resolved reports.

### Neutral
- **Ink** (`ink`): Main interface text.
- **Quiet Ink** (`muted-ink`): Supporting labels, metadata, and secondary copy.
- **Map Mist** (`map-ground`): Map loading and fallback field.
- **Community Mist** (`community-ground`): Feed view background.
- **Frosted White** (`glass`): Navigation, overlays, and feed surfaces.

### Named Rules
**The Status Is Text Rule.** A status color always appears with its written status; color never carries report meaning alone.

**The Glass Has a Job Rule.** Use blur where an interface surface overlays the map or groups controls. Keep report text and evidence crisp.

## Typography

**Display Font:** Geist (with ui-sans-serif and system sans-serif fallbacks)

**Body Font:** Geist (with ui-sans-serif and system sans-serif fallbacks)

**Label/Mono Font:** Geist for labels; Geist Mono for aligned counts and audit-like values.

**Character:** Compact, clean sans-serif typography supports fast scanning. Headings use a restrained tight fit; metadata remains sentence case and secondary to report titles.

### Hierarchy
- **Display** (weight 780, 34px, line-height 1.1): Community view title.
- **Headline** (weight 760, 17px, line-height 1.3): Selected report title on the map.
- **Title** (weight 740, 15px): Feed report titles.
- **Body** (weight 400, 12px, line-height 1.5): Supporting instructions and descriptions.
- **Label** (weight 550–700, 9–11px): Status, source, location, and time metadata.

### Named Rules
**The Scan Before Style Rule.** Report titles and status lead; community and timing metadata follow in a quieter voice.

## Layout

The map fills the desktop viewport without a decorative frame. A floating masthead carries the Groundwork identity, Map/Community switch, search and area filter, budget link, and report action. The selected report summary sits low on the left; a labeled status legend sits opposite it. Map controls remain in the upper-right corner.

Community uses a centered reading column with a sort bar and vertically stacked posts, plus a compact guidance panel on wide screens. Each post aligns a vote rail beside its content. At mobile widths the masthead becomes three short rows, the Community content moves below it, and the guidance panel follows the feed. A bottom glass summary preserves map context without hiding the central geography. Use the established 8–22px spacing rhythm and keep the map visible in the first viewport.

## Elevation & Depth

Depth comes from a fine bright edge, translucent fill, and soft offset shadow. The map remains visible through navigation and context glass, while feed cards use a more opaque field and lighter shadow to protect reading. Focus uses a visible pine outline; hover raises a report card slightly. Blur is strongest on floating controls and lighter on selected-map labels.

### Shadow Vocabulary
- **Floating glass** (`0 14px 42px rgb(26 48 48 / 13%), 0 2px 6px rgb(26 48 48 / 5%), inset 0 1px 0 rgb(255 255 255 / 92%)`): Masthead, map context, legend, and floating feed controls.
- **Report card** (`0 7px 20px rgb(28 48 44 / 5%), inset 0 1px 0 rgb(255 255 255 / 93%)`): Resting Community post; hover deepens the shadow and lifts the card by one pixel.

### Named Rules
**The Readable Layer Rule.** The more text a surface carries, the more opaque its background becomes.

## Shapes

Use gently rounded rectangles: 8px for compact tags, 10–13px for controls, 14–17px for report surfaces, and 20px for the floating masthead. Map markers and author avatars stay circular. Borders are fine and translucent; avoid nested card shells and pill-shaped report content.

## Components

### Buttons
- **Character:** Direct and tactile, with a clear pine primary action.
- **Shape:** Rounded corners (12px) and a 42px primary target height.
- **Primary:** Pine fill, white label, warm camera detail, and a soft offset shadow.
- **Hover / Focus:** Darken the fill and lift slightly on hover; use a visible pine outline on keyboard focus.
- **Secondary:** Quiet glass or a pale inset track; preserve clear text contrast.

### Chips
- **Style:** Compact translucent or tinted fills with dark text and modest corners (8px).
- **State:** Use the semantic status color beside its written label; the active sort sits on a white raised surface.

### Cards / Containers
- **Corner Style:** Medium rounded corners (16px) for Community posts and map details.
- **Background:** Near-white translucent surfaces; map summary and navigation can reveal more of the basemap than report cards.
- **Shadow Strategy:** Use the floating glass shadow for overlays and a lighter shadow for posts.
- **Border:** Fine white edge on glass; low-contrast full border around report rows.
- **Internal Padding:** 16px desktop, 12px on narrow screens.

### Inputs / Fields
- **Style:** A light translucent field with a fine white border and compact corners (13px).
- **Focus:** White field, border shift, and a visible pine focus ring.
- **Error / Disabled:** Keep native disabled affordances; pair any error with clear text and recovery.

### Navigation
- **Style:** A floating glass masthead with a raised white active view. Desktop keeps the brand, view switch, search, and actions in one row; mobile stacks them into reachable rows.

### Map Context
The selected-report panel gives status, issue type, title, place, time, and source in a single glance. It stays low and clear of the central map; its Community action carries the selected issue into the feed.

### Community Post
A Reddit-like vote rail leads into source/time, status, title, place, sample disclosure, contributor, and comment/map actions. Keep the report title as the strongest line and make the map action return to the same issue.

## Do's and Don'ts

### Do:
- **Do** keep the map as the first view and Community as a separate second view.
- **Do** use glass for controls that float over map geography.
- **Do** pair status color with a readable status label.
- **Do** keep demo and sample disclosures visible in report content.
- **Do** preserve keyboard focus, reduced-motion support, and comfortable touch targets.

### Don't:
- **Don't** place the full report feed over the map by default.
- **Don't** blur report titles, source details, or evidence.
- **Don't** use status color as the only signal of a report's state.
- **Don't** style sample data as a verified live civic record.
