"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapView, { Marker, type MapRef } from "react-map-gl/mapbox";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ArrowDown, ArrowUp, BadgeCheck, Camera, Check, ChevronDown, Clock3,
  Droplet, ExternalLink, MapPin, MessageCircle, Search, ShieldAlert,
  TrendingUp, X,
} from "lucide-react";
import ObservationTimeline from "@/components/ObservationTimeline";
import ReportModal from "@/components/ReportModal";
import UserNav from "@/components/UserNav";

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
const SORTS = ["Relevance", "Hot", "Top", "New", "Comment Count"] as const;
type Sort = (typeof SORTS)[number];
type View = "map" | "community";
const INITIAL_VIEW = { longitude: 77.209, latitude: 28.6139, zoom: 11.2 };

function statusClass(status: Report["status"]) {
  return status === "Resolved" ? "status-resolved" : status === "Work underway" ? "status-underway" : "status-attention";
}

export default function Home() {
  const [view, setView] = useState<View>("map");
  const [area, setArea] = useState<(typeof AREAS)[number]>("All Delhi");
  const [sort, setSort] = useState<Sort>("Hot");
  const [postSortMenuOpen, setPostSortMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [focusSearch, setFocusSearch] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const visibleReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return REPORTS.filter((report) =>
      (area === "All Delhi" || report.area === area) &&
      (!normalized || `${report.title} ${report.place} ${report.area} ${report.kind}`.toLowerCase().includes(normalized))
    ).sort((a, b) => {
      if (sort === "New") return a.age - b.age;
      if (sort === "Top") return (b.votes + (votes[b.id] ?? 0)) - (a.votes + (votes[a.id] ?? 0));
      if (sort === "Comment Count") return b.comments - a.comments;
      if (sort === "Relevance" && normalized) {
        const terms = normalized.split(/\s+/).filter(Boolean);
        const relevance = (report: Report) => {
          const title = report.title.toLowerCase();
          const place = `${report.place} ${report.area} ${report.kind}`.toLowerCase();
          return terms.reduce((score, term) => score + (title.includes(term) ? 3 : 0) + (place.includes(term) ? 1 : 0), 0);
        };
        const difference = relevance(b) - relevance(a);
        if (difference) return difference;
      }
      return (b.votes / Math.max(1, b.age / 60)) - (a.votes / Math.max(1, a.age / 60));
    });
  }, [area, query, sort, votes]);
  const selectedReport = REPORTS.find((report) => report.id === selectedId);

  useEffect(() => {
    if (selectedId && !visibleReports.some((report) => report.id === selectedId)) {
      const timer = setTimeout(() => setSelectedId(null), 0);
      return () => clearTimeout(timer);
    }
  }, [selectedId, visibleReports]);

  useEffect(() => {
    if (view !== "map" || !selectedReport) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mapRef.current?.flyTo({ center: [selectedReport.longitude, selectedReport.latitude], zoom: 13.4, duration: reducedMotion ? 0 : 900 });
  }, [selectedReport, view]);

  useEffect(() => {
    const resize = () => mapRef.current?.resize();
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [view]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + R: open report modal
      if ((event.metaKey || event.ctrlKey) && event.key === "r") {
        event.preventDefault();
        setReportOpen(true);
      }

      // Cmd/Ctrl + K: focus search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setFocusSearch(true);
        const searchInput = document.querySelector('input[placeholder="Search streets or reports"]') as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
      }

      // Escape: close modals
      if (event.key === "Escape") {
        event.preventDefault();
        setReportOpen(false);
        setTimelineOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setReportOpen, setFocusSearch, view]);

  function locateReport(report: Report) {
    setSelectedId(report.id);
    setTimelineOpen(false);
    setView("map");
  }

  function openDiscussion(report: Report) {
    setSelectedId(report.id);
    setTimelineOpen(true);
  }

  function vote(id: string, direction: -1 | 1) {
    setVotes((current) => ({ ...current, [id]: current[id] === direction ? 0 : direction }));
  }

  return (
    <main id="home" className={`groundwork-shell view-${view}`}>
      {view === "map" && (
        <MapView
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={INITIAL_VIEW}
          mapStyle="mapbox://styles/mapbox/light-v11"
          attributionControl
          style={{ width: "100%", height: "100%" }}
        >
          {visibleReports.map((report) => {
            const active = selectedId === report.id;
            return (
              <Marker key={report.id} longitude={report.longitude} latitude={report.latitude} anchor="center">
                <button type="button" onClick={() => setSelectedId(report.id)} aria-pressed={active} aria-label={`${report.status}: ${report.title}`} className={`map-pin ${active ? "is-active" : ""}`}>
                  <span className={`map-pin-dot ${statusClass(report.status)}`} />
                  {active && <span className="map-pin-label">{report.place.split(" · ")[0]}</span>}
                </button>
              </Marker>
            );
          })}
        </MapView>
      )}

      <header className="groundwork-header glass-surface">
        <Link href="/" aria-label="Groundwork home" className="groundwork-brand">
          <span className="brand-mark"><Droplet aria-hidden="true" /></span>
          <span className="brand-copy"><strong>Groundwork</strong><small>Delhi drainage watch</small></span>
        </Link>

        <nav className="view-switch" aria-label="Primary view">
          <button type="button" onClick={() => { setView("map"); setTimelineOpen(false); }} aria-pressed={view === "map"}>
            <MapPin aria-hidden="true" /><span>Map</span>
          </button>
          <button type="button" onClick={() => { setView("community"); setTimelineOpen(false); }} aria-pressed={view === "community"}>
            <MessageCircle aria-hidden="true" /><span>Community</span><span className="view-count">{REPORTS.length}</span>
          </button>
        </nav>

        <div className="header-search">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && visibleReports[0]) locateReport(visibleReports[0]); }} placeholder="Search streets or reports" aria-label="Search reports and places" />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X aria-hidden="true" /></button>}
          <span className="search-divider" />
          <label className="area-select"><MapPin aria-hidden="true" /><select value={area} onChange={(event) => setArea(event.target.value as (typeof AREAS)[number])} aria-label="Filter by area">{AREAS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown aria-hidden="true" /></label>
        </div>

        <div className="header-actions">
          <Link href="/budget" className="budget-link"><span>Budget</span><ExternalLink aria-hidden="true" /></Link>
          <button type="button" onClick={() => setReportOpen(true)} className="report-action"><Camera aria-hidden="true" /><span>Report an issue</span></button>
          <UserNav />
          <span className="demo-pill">DEMO · not verified</span>
        </div>
      </header>

      {view === "map" ? (
        <>
          <aside className="map-context glass-surface" aria-live="polite">
            {selectedReport ? (
              <>
                <div className="context-topline"><span className={`status-indicator ${statusClass(selectedReport.status)}`} />{selectedReport.status}<span className="context-kind">{selectedReport.kind}</span></div>
                <h1>{selectedReport.title}</h1>
                <p className="context-place"><MapPin aria-hidden="true" />{selectedReport.place}<span>·</span><Clock3 aria-hidden="true" />{selectedReport.time}</p>
                <p className={`context-source ${selectedReport.source === "Sample agency update" ? "demo-source" : "verified-source"}`}>{selectedReport.source}{selectedReport.source === "Sample agency update" ? " · source not linked" : " · demo post"}</p>
                <div className="context-actions">
                  <button type="button" onClick={() => setView("community")}><MessageCircle aria-hidden="true" />View in community</button>
                  <button type="button" className="context-clear" onClick={() => setSelectedId(null)} aria-label="Clear selected report"><X aria-hidden="true" /></button>
                </div>
              </>
            ) : (
              <>
                <span className="map-context-icon"><MapPin aria-hidden="true" /></span>
                <div><h1>Drainage reports around Delhi</h1><p>Select a marker to see its status and join the discussion.</p></div>
              </>
            )}
          </aside>
          <div className="map-legend glass-surface" aria-label="Report status key">
            <span><i className="status-attention" />Needs attention</span>
            <span><i className="status-underway" />Work underway</span>
            <span><i className="status-resolved" />Resolved</span>
            <span className="legend-count">{visibleReports.length} demo reports</span>
          </div>
        </>
      ) : (
        <section className={`community-view${timelineOpen ? " is-thread" : ""}`} aria-label={timelineOpen ? "Post discussion" : "r/Delhi community"}>
          {timelineOpen && selectedReport ? (
            <div className="community-thread-page">
              <ObservationTimeline onClose={() => setTimelineOpen(false)} title={selectedReport.title} place={selectedReport.place} status={selectedReport.status} />
            </div>
          ) : (
            <>
          <div className="community-heading">
            <div className="community-identity">
              <span className="community-avatar"><Droplet aria-hidden="true" /></span>
              <div>
                <h1 id="community-title">r/Delhi</h1>
                <p>Delhi drainage reports, resident follow-ups, and sample works updates.</p>
              </div>
            </div>
            <span className="community-status"><ShieldAlert aria-hidden="true" />Demo community <span className="demo-source">· not verified</span></span>
          </div>

          <div className="community-layout">
            <div className="community-main">
              <div className="feed-toolbar glass-surface">
                <div className="feed-toolbar-start">
                  <DropdownMenu.Root open={postSortMenuOpen} onOpenChange={setPostSortMenuOpen}>
                    <DropdownMenu.Trigger asChild>
                      <button type="button" className="feed-sort-trigger" aria-label={`Sort posts, currently ${sort}`}>
                        {sort === "Hot" && <TrendingUp aria-hidden="true" />}{sort}<ChevronDown aria-hidden="true" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="community-sort-menu" align="start" sideOffset={7}>
                        <DropdownMenu.Label className="community-sort-label">Sort posts by</DropdownMenu.Label>
                        <DropdownMenu.RadioGroup value={sort} onValueChange={(value) => { setSort(value as Sort); setPostSortMenuOpen(false); }}>
                          {SORTS.map((item) => <DropdownMenu.RadioItem key={item} value={item} className="community-sort-option">
                            <DropdownMenu.ItemIndicator><Check aria-hidden="true" /></DropdownMenu.ItemIndicator>{item}
                          </DropdownMenu.RadioItem>)}
                        </DropdownMenu.RadioGroup>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                  <span className="feed-result-count">{visibleReports.length} posts</span>
                </div>
                <button type="button" className="feed-create" onClick={() => setReportOpen(true)}><Camera aria-hidden="true" /><span>Create post</span></button>
              </div>

              <div className="community-feed" aria-label="Community drainage reports">
                {visibleReports.map((report) => {
                  const score = report.votes + (votes[report.id] ?? 0);
                  return (
                    <article key={report.id} className={`community-post ${selectedId === report.id ? "is-selected" : ""}`}>
                      <div className="post-votes" aria-label="Vote on report">
                        <button type="button" aria-label={`Upvote report, score ${score}`} aria-pressed={votes[report.id] === 1} onClick={() => vote(report.id, 1)}><ArrowUp aria-hidden="true" /></button>
                        <span>{score}</span>
                        <button type="button" aria-label={`Downvote report, score ${score}`} aria-pressed={votes[report.id] === -1} onClick={() => vote(report.id, -1)}><ArrowDown aria-hidden="true" /></button>
                      </div>
                      <div className="post-content">
                        <div className="post-meta"><span className="post-community">r/Delhi</span><span>·</span><span>{report.source === "Resident report" ? "Resident report" : "Sample agency update"}</span><span>·</span><span>{report.time}</span></div>
                        <div className="post-title-row"><span className={`status-indicator ${statusClass(report.status)}`} /><span className="post-status">{report.status}</span><span className="post-kind">{report.kind}</span></div>
                        <h2><button type="button" onClick={() => locateReport(report)}>{report.title}</button></h2>
                        <p className="post-place"><MapPin aria-hidden="true" />{report.place}</p>
                        <p className={`post-source ${report.source === "Sample agency update" ? "demo-source" : "verified-source"}`}>{report.source}{report.source === "Sample agency update" ? " · source not linked" : " · demo post"}</p>
                        {report.photo && <p className="post-attachment"><Camera aria-hidden="true" />Demo photo attached · preview unavailable</p>}
                        {report.status !== "Needs attention" && <p className="post-followup"><Check aria-hidden="true" />{report.status === "Resolved" ? "Sample completion · resident confirmation pending" : "Resident follow-up · sample record"}</p>}
                        <div className="post-actions">
                          <span className="post-author"><span className="author-avatar">{report.author.split(/[ _]/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="author-name">{report.author}</span>{report.reputation > 0 && <span className="author-reputation"><BadgeCheck aria-hidden="true" />{report.reputation.toLocaleString()} pts</span>}</span>
                          <div className="post-action-group">
                            <button type="button" onClick={() => openDiscussion(report)}><MessageCircle aria-hidden="true" />{report.comments} comments</button>
                            <button type="button" onClick={() => locateReport(report)}><MapPin aria-hidden="true" />Map</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {visibleReports.length === 0 && <div className="feed-empty"><Search aria-hidden="true" /><h2>No reports found</h2><p>Try another place or choose a wider area.</p><button type="button" onClick={() => { setQuery(""); setArea("All Delhi"); }}>Clear filters</button></div>}
              </div>
              <p className="feed-disclaimer"><BadgeCheck aria-hidden="true" />Votes and reputation are demo-only and stay on this device.</p>
            </div>

          </div>
            </>
          )}
        </section>
      )}

      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} />}
    </main>
  );
}
