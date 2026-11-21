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

<!-- impeccable:design-map -->
Name: Groundwork
Colors: primary: pine #173F3A; secondary: underway #987137; tertiary: urgent #A95245; neutral: ink #172A27; accent: warm-highlight #F2D28C; secondary: resolved #457762; neutral: muted-ink #53655F (+3 more in the sidecar)
Fonts: Geist (display, title, body, label); Geist Mono (data)
Spacing: sm 8px, md 12px, lg 16px, xl 22px
Radius: chip 8px, control 12px, card 16px, shell 20px
North Star: “A City, Held in Glass”
Rules:
- The Status Is Text Rule. A status color always appears with its written status; color never carries report meaning alone.
- The Glass Has a Job Rule. Use blur where an interface surface overlays the map or groups controls.
- The Scan Before Style Rule. Report titles and status lead; community and timing metadata follow in a quieter voice.
- The Readable Layer Rule. The more text a surface carries, the more opaque its background becomes.
Elevation:
- Floating glass: 0 14px 42px rgb(26 48 48 / 13%), 0 2px 6px rgb(26 48 48 / 5%), inset 0 1px 0 rgb(255 255 255 / 92%)
- Report card: 0 7px 20px rgb(28 48 44 / 5%), inset 0 1px 0 rgb(255 255 255 / 93%)
Don't:
- Don't place the full report feed over the map by default.
- Don't blur report titles, source details, or evidence.
- Don't use status color as the only signal of a report's state.
- Don't style sample data as a verified live civic record.
Do:
- Do keep the map as the first view and Community as a separate second view.
- Do use glass for controls that float over map geography.
- Do pair status color with a readable status label.
- Do keep demo and sample disclosures visible in report content.
- Do preserve keyboard focus, reduced-motion support, and comfortable touch targets.
Full: .impeccable/design-full.md (read a section when you need its detail)
