"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Camera,
  ChevronDown,
  ClipboardList,
  Droplet,
  Globe,
  Map as MapIcon,
  Minus,
  Plus,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import MapBottomSheet from "@/components/MapBottomSheet";
import ObservationTimeline from "@/components/ObservationTimeline";
import ReportModal from "@/components/ReportModal";

const DELHI = { longitude: 77.209, latitude: 28.6139, zoom: 11 };

type Observation = {
  id: string;
  label: string;
  longitude: number;
  latitude: number;
};

const OBSERVATIONS: Observation[] = [
  { id: "connaught-place", label: "Connaught Place", longitude: 77.209, latitude: 28.6139 },
  { id: "karol-bagh", label: "Karol Bagh", longitude: 77.1909, latitude: 28.6519 },
  { id: "lajpat-nagar", label: "Lajpat Nagar", longitude: 77.243, latitude: 28.5679 },
  { id: "vasant-vihar", label: "Vasant Vihar", longitude: 77.166, latitude: 28.557 },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

const TABS: { id: "map" | "works" | "report"; label: string; icon: LucideIcon }[] = [
  { id: "map", label: "Map", icon: MapIcon },
  { id: "works", label: "Works", icon: Wrench },
  { id: "report", label: "Report", icon: ClipboardList },
];

type TabId = (typeof TABS)[number]["id"];

const TAB_CONTENT: Record<TabId, { title: string; description: string }> = {
  map: {
    title: "City map",
    description: "Live map of drainage works and reported issues will appear here.",
  },
  works: {
    title: "Drainage works",
    description: "Track ongoing and completed drainage works in your area.",
  },
  report: {
    title: "Report an issue",
    description: "Flag blocked drains, flooding or other drainage problems.",
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [language, setLanguage] = useState("en");
  const [selectedReport, setSelectedReport] = useState(false);
  const [activeObservationId, setActiveObservationId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const activeContent = TAB_CONTENT[activeTab];
  const ActiveIcon = TABS.find((tab) => tab.id === activeTab)?.icon ?? MapIcon;

  const openObservation = (id: string | null) => {
    setActiveObservationId(id);
    setSelectedReport(true);
  };

  const closeObservation = () => {
    setSelectedReport(false);
    setActiveObservationId(null);
  };

  // Keep Mapbox in sync with the responsive shell and sidebar state changes.
  useEffect(() => {
    if (activeTab !== "map") return;

    const map = mapRef.current;
    if (!map) return;

    const resizeMap = () => map.resize();
    resizeMap();

    window.addEventListener("resize", resizeMap);

    const container = map.getMap().getContainer();
    const observer = new ResizeObserver(resizeMap);
    observer.observe(container);

    return () => {
      window.removeEventListener("resize", resizeMap);
      observer.disconnect();
    };
  }, [activeTab]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSelectedReport(false);
    setActiveObservationId(null);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-gray-50 font-sans text-slate-900 md:flex-row">
      {/* Left sidebar */}
      <aside className="z-20 flex w-full flex-col border-r border-gray-200 bg-white md:h-full md:w-[400px] lg:w-[450px]">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 md:p-6 md:pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100 md:size-10">
              <Droplet className="size-5 fill-blue-600 text-blue-600" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                Drainage
              </h1>
              <p className="hidden text-xs text-gray-500 md:block">Delhi civic map</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                aria-label="Language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="appearance-none rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                {LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              aria-label="Report a drainage issue"
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 active:scale-[0.98] md:px-3.5"
            >
              <Camera className="size-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="shrink-0 px-4 pb-3 pt-3 md:px-6 md:pb-4 md:pt-6">
          <div className="relative w-full">
            <label htmlFor="search" className="sr-only">
              Search city, ward or landmark
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="search"
              type="search"
              placeholder="Search city, ward or landmark"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 md:h-12 md:rounded-2xl"
            />
          </div>
        </div>

        {/* Segmented control */}
        <div className="shrink-0 px-4 pb-3 md:px-6 md:pb-4">
          <div
            role="tablist"
            aria-label="Drainage views"
            className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200/70"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] md:h-11 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2.2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Evidence lanes on desktop, bottom sheet on mobile */}
        <div
          className={`min-h-0 md:flex md:flex-1 md:flex-col md:p-6 md:pt-2 ${
            activeTab === "map" ? "" : "hidden md:flex"
          }`}
        >
          {selectedReport ? (
            <ObservationTimeline onClose={closeObservation} />
          ) : (
            <MapBottomSheet
              onReportIssue={() => openObservation(null)}
              onOpenTimeline={() => openObservation(null)}
            />
          )}
        </div>
      </aside>

      {/* Map area */}
      <main className="relative h-[50vh] flex-1 md:h-full">
        {activeTab === "map" ? (
          <div
            role="tabpanel"
            id="panel-map"
            aria-labelledby="tab-map"
            className="absolute inset-0"
          >
            <Map
              ref={mapRef}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
              initialViewState={DELHI}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              style={{ width: "100%", height: "100%" }}
            >
              {OBSERVATIONS.map((observation) => {
                const isActive = activeObservationId === observation.id;

                return (
                  <Marker
                    key={observation.id}
                    longitude={observation.longitude}
                    latitude={observation.latitude}
                    anchor="center"
                  >
                    <button
                      type="button"
                      title={observation.label}
                      aria-label={`Open citizen report: ${observation.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openObservation(observation.id);
                      }}
                      className={`flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white text-white shadow-lg shadow-purple-900/25 ring-4 transition hover:scale-105 focus-visible:outline-none ${
                        isActive
                          ? "bg-purple-700 ring-purple-500/40"
                          : "bg-purple-500 ring-purple-500/25 hover:bg-purple-600"
                      }`}
                    >
                      <Droplet className="size-4 fill-white" strokeWidth={2.2} />
                    </button>
                  </Marker>
                );
              })}
            </Map>

            {/* Legend — anchored to the map container */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-lg shadow-slate-900/5 backdrop-blur-md md:left-4 md:top-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Legend
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                  <span className="h-0.5 w-6 rounded-full bg-blue-600" aria-hidden="true" />
                  Official records
                </li>
                <li className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                  <span
                    className="w-6 border-t-2 border-dashed border-blue-600"
                    aria-hidden="true"
                  />
                  IMD weather
                </li>
                <li className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                  <span className="flex w-6 justify-center" aria-hidden="true">
                    <span className="size-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
                  </span>
                  Citizen reports
                </li>
              </ul>
            </div>

            {/* Zoom controls — anchored to the map container */}
            <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5 md:right-4 md:top-4">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
              >
                <Plus className="size-5" strokeWidth={2.2} />
              </button>
              <span className="h-px bg-slate-200" aria-hidden="true" />
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
              >
                <Minus className="size-5" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        ) : (
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="h-full overflow-y-auto p-4 md:p-8"
          >
            <section className="mx-auto flex h-full min-h-64 w-full max-w-2xl items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 md:p-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ActiveIcon className="size-7" strokeWidth={2} />
                </span>
                <h2 className="text-base font-semibold text-slate-900 md:text-lg">
                  {activeContent.title}
                </h2>
                <p className="max-w-64 text-sm leading-6 text-slate-500 md:max-w-xs">
                  {activeContent.description}
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      {reportModalOpen && (
        <ReportModal onClose={() => setReportModalOpen(false)} />
      )}
    </div>
  );
}
