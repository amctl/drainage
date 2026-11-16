"use client";

import {
  ChevronRight,
  FileText,
  Layers,
  MapPin,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react";

const EVIDENCE_LANES: {
  id: "government" | "budget" | "citizen";
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "government",
    label: "Government records",
    description: "Source needed",
    icon: FileText,
  },
  {
    id: "budget",
    label: "Budget",
    description: "Not linked yet",
    icon: Layers,
  },
  {
    id: "citizen",
    label: "Citizen observations",
    description: "Private until reviewed",
    icon: Users,
  },
];

type MapBottomSheetProps = {
  onReportIssue: () => void;
  onOpenTimeline: () => void;
};

export default function MapBottomSheet({
  onReportIssue,
  onOpenTimeline,
}: MapBottomSheetProps) {
  return (
    <div className="absolute bottom-0 left-0 z-30 w-full md:relative md:bottom-auto md:left-auto md:z-auto md:h-full">
      <section
        aria-labelledby="area-sheet-heading"
        className="flex max-h-[calc(100vh-12rem)] w-full flex-col overflow-hidden rounded-t-3xl border border-b-0 border-gray-200 bg-white/95 pt-2.5 shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)] backdrop-blur-xl md:h-full md:max-h-none md:rounded-none md:border-0 md:bg-transparent md:pt-0 md:shadow-none md:backdrop-blur-none"
      >
        {/* Drag handle — mobile sheet only */}
        <div
          className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-slate-300 md:hidden"
          aria-hidden="true"
        />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-5 md:mt-0 md:px-0">
          {/* Header */}
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <MapPin className="size-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2
                id="area-sheet-heading"
                className="text-[15px] font-bold leading-5 tracking-tight text-slate-900 md:text-base"
              >
                Choose an area to see records
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Search above or tap on the map to select a locality.
              </p>
            </div>
          </div>

          {/* Evidence lanes */}
          <h3 className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            EVIDENCE LANES
          </h3>

          <ul className="space-y-2">
            {EVIDENCE_LANES.map((lane) => {
              const Icon = lane.icon;

              return (
                <li key={lane.id}>
                  <button
                    type="button"
                    onClick={lane.id === "citizen" ? onOpenTimeline : undefined}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 active:scale-[0.99] md:py-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {lane.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {lane.description}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Primary action */}
        <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 md:px-0 md:pb-0 md:pt-4">
          <button
            type="button"
            onClick={onReportIssue}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <Megaphone className="size-5" strokeWidth={2.2} />
            Report an issue
          </button>
        </div>
      </section>
    </div>
  );
}
