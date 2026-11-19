"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ArrowDown, ArrowUp, BadgeCheck, Camera, Check, ChevronDown, Clock3,
  Droplet, MapPin, MessageCircle, Search, ShieldAlert, TrendingUp, X,
} from "lucide-react";
import ObservationTimeline from "@/components/ObservationTimeline";
import ReportModal from "@/components/ReportModal";

type Area = "Central Delhi" | "South Delhi" | "West Delhi" | "North Delhi";
type Report = {
  id: string; title: string; area: Area; place: string; kind: string;
  status: "Needs attention" | "Work underway" | "Resolved";
  time: string; age: number; votes: number; comments: number; author: string;
  reputation: number; longitude: number; latitude: number; photo?: boolean;
  source: "Resident report" | "Sample agency update";
};

const REPORTS: Report[] = [
  { id: "cp", title: "Water backing up at the market crossing", area: "Central Delhi", place: "Connaught Place · Ward 79", kind: "Waterlogging", status: "Needs attention", time: "12 min ago", age: 12, votes: 128, comments: 34, author: "Rohan Mehta", reputation: 1240, longitude: 77.219, latitude: 28.632, photo: true, source: "Resident report" },
  { id: "karol", title: "Storm drain still blocked after last week’s clean-up", area: "West Delhi", place: "Karol Bagh · Ward 82", kind: "Blocked drain", status: "Work underway", time: "48 min ago", age: 48, votes: 86, comments: 19, author: "Aditi Sharma", reputation: 860, longitude: 77.1909, latitude: 28.6519, source: "Resident report" },
  { id: "lajpat", title: "Open manhole on the school route", area: "South Delhi", place: "Lajpat Nagar · Ward 90", kind: "Safety hazard", status: "Needs attention", time: "2 hours ago", age: 120, votes: 64, comments: 12, author: "Sameer K.", reputation: 315, longitude: 77.243, latitude: 28.5679, photo: true, source: "Resident report" },
  { id: "vasant", title: "Desilting marked complete on service road", area: "South Delhi", place: "Vasant Vihar · Ward 66", kind: "Works update", status: "Resolved", time: "5 hours ago", age: 300, votes: 52, comments: 8, author: "Sample agency account", reputation: 0, longitude: 77.166, latitude: 28.557, source: "Sample agency update" },
  { id: "civil", title: "Overflow reported near the bus depot", area: "North Delhi", place: "Civil Lines · Ward 12", kind: "Waterlogging", status: "Needs attention", time: "Yesterday", age: 1440, votes: 39, comments: 6, author: "neighbourhoodwatch", reputation: 590, longitude: 77.225, latitude: 28.678, source: "Resident report" },
];

const AREAS: ("All Delhi" | Area)[] = ["All Delhi", "Central Delhi", "South Delhi", "West Delhi", "North Delhi"];
const SORTS = ["Hot", "Top", "New"] as const;
type Sort = (typeof SORTS)[number];
const INITIAL_VIEW = { longitude: 77.209, latitude: 28.6139, zoom: 11.2 };

export default function Home() {
  const [area, setArea] = useState<(typeof AREAS)[number]>("All Delhi");
  const [sort, setSort] = useState<Sort>("Hot");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const visibleReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return REPORTS.filter((report) =>
      (area === "All Delhi" || report.area === area) &&
      (!normalized || `${report.title} ${report.place} ${report.area} ${report.kind}`.toLowerCase().includes(normalized))
    ).sort((a, b) => sort === "New" ? a.age - b.age : sort === "Top" ? (b.votes + (votes[b.id] ?? 0)) - (a.votes + (votes[a.id] ?? 0)) : (b.votes / Math.max(1, b.age / 60)) - (a.votes / Math.max(1, a.age / 60)));
  }, [area, query, sort, votes]);
  const selectedReport = REPORTS.find((report) => report.id === selectedId);

  useEffect(() => {
    if (selectedId && !visibleReports.some((report) => report.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, visibleReports]);

  useEffect(() => {
    const resize = () => mapRef.current?.resize();
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const selectReport = (report: Report) => {
    setSelectedId(report.id);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mapRef.current?.flyTo({ center: [report.longitude, report.latitude], zoom: 13.4, duration: reducedMotion ? 0 : 900 });
    window.requestAnimationFrame(() => {
      cardRefs.current[report.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const vote = (id: string, direction: -1 | 1) => {
    setVotes((current) => ({ ...current, [id]: current[id] === direction ? 0 : direction }));
  };

  return (
    <main id="home" className="relative h-dvh w-full overflow-hidden bg-[#e9eef0] text-slate-900">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl
        style={{ width: "100%", height: "100%" }}
      >
        {visibleReports.map((report) => {
          const active = selectedId === report.id;
          const tone = report.status === "Resolved" ? "bg-[#668479]" : report.status === "Work underway" ? "bg-[#a58e67]" : "bg-[#9b6d60]";
          return (
            <Marker key={report.id} longitude={report.longitude} latitude={report.latitude} anchor="center">
              <button type="button" onClick={() => selectReport(report)} aria-pressed={active} aria-label={`${report.status}: ${report.title}`} className="group flex items-center gap-2 text-left">
                <span className={`map-marker-enter size-3.5 shrink-0 border border-white/90 shadow ring-1 ring-slate-900/20 transition ${tone} ${active ? "selected-marker outline outline-2 outline-[#b09b73]" : ""}`} />
                {active && <span className="glass-surface glass-enter border px-2 py-1 text-[10px] font-bold text-[#173f3a]">{report.place.split(" · ")[0]}</span>}
              </button>
            </Marker>
          );
        })}
      </Map>

      {/* Floating brand and search */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-5">
        <a href="#home" className="glass-surface glass-enter pointer-events-auto flex shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 sm:px-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#173f3a] text-white"><Droplet className="size-5 fill-[#d8c8a2] text-[#d8c8a2]" /></span>
          <span><span className="block text-sm font-extrabold tracking-tight">Groundwork</span><span className="hidden text-[10px] font-medium text-slate-500 sm:block">Delhi community map</span></span>
        </a>

        <div className="pointer-events-auto relative mx-auto hidden w-full max-w-[640px] md:block">
          <div className={`glass-surface glass-enter flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${searchFocused ? "border-[#a58e67] ring-2 ring-[#a58e67]/15" : "border-white/70"}`}>
            <Search className="size-5 shrink-0 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} onKeyDown={(event) => { if (event.key === "Enter" && visibleReports[0]) selectReport(visibleReports[0]); }} placeholder="Search a street, neighbourhood or issue" aria-label="Search reports and places" className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="rounded-sm p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>}
            <span className="h-7 w-px bg-slate-200" />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><MapPin className="size-4 text-[#756b5b]" /><select value={area} onChange={(event) => setArea(event.target.value as (typeof AREAS)[number])} aria-label="Choose region" className="max-w-32 cursor-pointer appearance-none bg-transparent pr-1 outline-none">{AREAS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="size-3.5" /></label>
          </div>
          {searchFocused && query && visibleReports.length > 0 && <div className="glass-surface glass-enter absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border p-1">{visibleReports.slice(0, 4).map((report) => <button key={report.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectReport(report)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#f0eadb]/80"><MapPin className="size-4 text-[#756b5b]" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{report.place}</span><span className="block truncate text-[11px] text-slate-500">{report.title}</span></span></button>)}</div>}
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setReportOpen(true)} className="flex h-11 items-center gap-2 rounded-xl bg-[#173f3a] px-3.5 text-xs font-bold text-white shadow-lg shadow-[#173f3a]/15 transition hover:-translate-y-0.5 hover:bg-[#102f2b] sm:px-4"><Camera className="size-4 text-[#d8c8a2]" /><span className="hidden sm:inline">Post a report</span><span className="sm:hidden">Report</span></button>
          <span aria-label="Demo account" className="glass-surface flex h-11 items-center rounded-xl border px-2.5 text-[10px] font-extrabold tracking-wide text-[#173f3a]">DEMO</span>
        </div>
      </header>

      {/* Mobile search */}
      <div className="absolute left-3 right-3 top-[72px] z-10 md:hidden">
        <div className="glass-surface flex items-center gap-2 rounded-2xl border px-3.5 py-3"><Search className="size-4 shrink-0 text-[#756b5b]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places and reports" aria-label="Search reports and places" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" /><select value={area} onChange={(event) => setArea(event.target.value as (typeof AREAS)[number])} aria-label="Choose region" className="max-w-24 bg-transparent text-[10px] font-semibold outline-none">{AREAS.map((item) => <option key={item}>{item}</option>)}</select></div>
      </div>

      {/* Community feed */}
      <section aria-label="Community drainage reports" className="glass-surface glass-enter absolute inset-x-2 bottom-2 top-auto z-10 flex max-h-[58dvh] w-auto flex-col overflow-hidden rounded-t-3xl border border-white/45 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:top-[92px] sm:max-h-none sm:w-[430px] sm:rounded-3xl">
        <div className="shrink-0 border-b border-[#e4dfd1] px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#a58e67]" /><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#756b5b]">r/Delhi · demo community</p></div><h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#173f3a] sm:text-2xl">Delhi drain watch</h1><p className="mt-1 text-xs text-slate-600">Resident reports and sample works updates.</p></div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div role="group" aria-label="Sort reports" className="flex items-center gap-1 rounded-xl bg-[#173f3a]/[.07] p-1">{SORTS.map((item) => <button key={item} type="button" aria-pressed={sort === item} onClick={() => setSort(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${sort === item ? "bg-white text-[#173f3a] shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>{item === "Hot" && <TrendingUp className="mr-1 inline size-3.5" />}{item}</button>)}</div>
            <label className="glass-surface flex min-w-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-semibold text-slate-600"><MapPin className="size-3.5 shrink-0 text-[#756b5b]" /><select value={area} onChange={(event) => setArea(event.target.value as (typeof AREAS)[number])} aria-label="Filter by area" className="max-w-[104px] bg-transparent outline-none">{AREAS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="size-3" /></label>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-slate-500"><span>{visibleReports.length} sample reports</span><span className="inline-flex items-center gap-1 text-[#756b5b]"><ShieldAlert className="size-3.5" /> Demo · not verified</span></div>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
          {visibleReports.map((report) => {
            const score = report.votes + (votes[report.id] ?? 0);
            const statusTone = report.status === "Resolved" ? "bg-[#668479]" : report.status === "Work underway" ? "bg-[#a58e67]" : "bg-[#9b6d60]";
            return (
              <article
                key={report.id}
                ref={(node) => { cardRefs.current[report.id] = node; }}
                className={`report-card flex gap-3 rounded-2xl p-3.5 sm:p-4 ${selectedId === report.id ? "is-selected" : ""}`}
              >
                <div className="flex w-8 shrink-0 flex-col items-center self-start border-r border-[#303b34]/10 py-1">
                  <button type="button" aria-label={`Upvote report, score ${score}`} aria-pressed={votes[report.id] === 1} onClick={() => vote(report.id, 1)} className={`vote-button p-1 transition ${votes[report.id] === 1 ? "text-[#9a7b50]" : "text-slate-500 hover:text-[#9a7b50]"}`}><ArrowUp className="size-4" /></button>
                  <span className="min-w-6 text-center text-[10px] font-extrabold tabular-nums text-[#173f3a]">{score}</span>
                  <button type="button" aria-label={`Downvote report, score ${score}`} aria-pressed={votes[report.id] === -1} onClick={() => vote(report.id, -1)} className={`vote-button p-1 transition ${votes[report.id] === -1 ? "text-[#65766f]" : "text-slate-500 hover:text-[#65766f]"}`}><ArrowDown className="size-4" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">{report.kind}</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[9px] font-semibold text-[#625f57]"><span className={`size-1.5 rounded-full ${statusTone}`} />{report.status}</span>
                  </div>
                  <h2 className="mt-2 text-[13px] font-bold leading-[1.45] tracking-tight text-slate-900 sm:text-sm"><button type="button" onClick={() => selectReport(report)} aria-label={`Locate report: ${report.title}`} className="text-left hover:text-[#53645e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]">{report.title}</button></h2>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] font-medium text-slate-500"><MapPin className="size-3 shrink-0" />{report.place}<span className="text-slate-300">·</span><Clock3 className="size-3 shrink-0" />{report.time}</p>
                  <p className="mt-1 text-[9px] font-medium text-slate-500">{report.source}{report.source === "Sample agency update" ? " · source not linked" : " · demo post"}</p>
                  {report.photo && <p className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-medium text-slate-500"><Camera className="size-3 text-[#756b5b]" />Demo photo attached · preview unavailable</p>}
                  {report.status !== "Needs attention" && <div className="mt-2 flex items-start gap-1.5 text-[9px] font-medium text-slate-500"><Check className="mt-px size-3 shrink-0 text-[#756b5b]" />{report.status === "Resolved" ? "Sample completion · resident confirmation pending" : "Resident follow-up · sample record"}</div>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#303b34]/[.08] pt-2.5">
                    <div className="flex min-w-0 items-center gap-2"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9e6de] text-[9px] font-extrabold text-[#454d47]">{report.author.split(/[ _]/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="max-w-[112px] truncate text-[10px] font-bold text-slate-700">{report.author}</span>{report.reputation > 0 && <span title={`${report.reputation} demo reputation points`} className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#64766b]"><BadgeCheck className="size-3" />{report.reputation.toLocaleString()} pts</span>}</div>
                    <button type="button" onClick={() => { selectReport(report); setTimelineOpen(true); }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-[#173f3a]/[.07]"><MessageCircle className="size-3.5" />{report.comments} comments</button>
                  </div>
                </div>
              </article>
            );
          })}
          {visibleReports.length === 0 && <div className="border border-dashed border-[#c9c2b1] bg-white/50 px-5 py-10 text-center"><Search className="mx-auto size-5 text-slate-400" /><p className="mt-2 text-sm font-semibold">No reports found</p><p className="mt-1 text-xs text-slate-500">Try another place or choose a wider area.</p></div>}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t border-[#303b34]/[.08] bg-white/30 px-4 py-2.5 text-[9px] font-medium text-slate-600 sm:px-5"><span>Demo votes and reputation · this device only</span><span className="inline-flex items-center gap-1 text-[#65766f]"><BadgeCheck className="size-3" />Reputation is a demo</span></footer>
      </section>

      <div className="glass-surface glass-enter absolute bottom-14 right-5 z-[5] hidden items-center gap-2 rounded-xl border border-white/35 px-3 py-2 text-[10px] font-semibold text-slate-700 lg:flex"><span className="size-1.5 rounded-full bg-[#9b6d60]" />Needs attention<span className="ml-2 size-1.5 rounded-full bg-[#a58e67]" />Work underway<span className="ml-2 size-1.5 rounded-full bg-[#668479]" />Resolved</div>

      {timelineOpen && <div className="glass-enter absolute inset-y-0 right-0 z-30 w-full max-w-[430px] overflow-hidden rounded-l-3xl border-l border-white/70"><ObservationTimeline onClose={() => setTimelineOpen(false)} title={selectedReport?.title} place={selectedReport?.place} status={selectedReport?.status} /></div>}
      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} />}
    </main>
  );
}
