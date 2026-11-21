"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Droplet,
  FileText,
  IndianRupee,
  Landmark,
  ShieldAlert,
  Target,
  X,
} from "lucide-react";

type Zone = {
  id: string;
  name: string;
  allocation: number;
  target: string;
};

const ZONES: Zone[] = [
  {
    id: "west",
    name: "West Zone",
    allocation: 6.35,
    target:
      "Desilt 24 km of trunk and lateral drains before the 2026 monsoon.",
  },
  {
    id: "najafgarh",
    name: "Najafgarh",
    allocation: 4.73,
    target:
      "Rehabilitate 9 km of the Najafgarh drain and clear 30 chronic waterlogging points.",
  },
  {
    id: "south",
    name: "South Zone",
    allocation: 3.21,
    target:
      "Complete 14 desilting works and upgrade 5 storm-water pumping stations.",
  },
];

function rtiTemplate(zone: Zone) {
  return `To,
The Public Information Officer (PIO),
Municipal Corporation of Delhi (MCD),
${zone.name} Zone Office,
Delhi – 1100XX

Subject: Application under Section 6(1) of the Right to Information Act, 2005 — Drainage budget allocation and contractor details for ${zone.name}, FY 2025-26

Sir/Madam,

I, [Applicant Full Name], a citizen of India, hereby request the following information under Section 6(1) of the Right to Information Act, 2005, in respect of the drainage budget for ${zone.name} for the financial year 2025-26:

1. A copy of the sanctioned budget allocation of ₹${zone.allocation.toFixed(2)} Crores for drainage works in ${zone.name}, including the budget head, sanction order number and date.
2. The revised allocation, funds released and expenditure incurred to date against the said allocation.
3. The physical and financial targets fixed for this allocation, and the progress achieved against each target as on the date of this application.
4. A list of all contractors and agencies awarded drainage works under this allocation, including their names, registration numbers and addresses.
5. Copies of the tender notices, work orders and agreements issued to each contractor, along with the value and scope of each work.
6. Details of payments made to each contractor, including payment dates, amounts and the names and designations of the approving officers.
7. Details of any works awarded without open tender, along with the reasons recorded for the exemption.
8. The names and designations of the officers responsible for preparing, approving and monitoring this budget.

If any part of the information sought is held by another public authority, kindly transfer this application under Section 6(3) of the Act and inform me accordingly.

I state that I am a citizen of India and that the information sought is in the public interest. I am not seeking any personal information and no personal interest of mine is involved.

A fee of ₹10/- is enclosed by [IPO / demand draft / cash] as prescribed under the RTI Rules. If further fees are payable, kindly intimate me in writing with the calculation.

Kindly provide the information within 30 days as required under Section 7(1) of the Act.

Place: Delhi
Date: [DD/MM/YYYY]

Applicant:
[Full Name]
[Postal Address]
[Email] | [Phone]

Signature: ______________________`;
}

type SourceLink = {
  url: string;
  label: string;
  status: "pending" | "verified" | "error";
};

export default function BudgetPage() {
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sourceLinks, setSourceLinks] = useState<Record<string, SourceLink>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const activeZone = ZONES.find((zone) => zone.id === activeZoneId) ?? null;
  const template = activeZone ? rtiTemplate(activeZone) : "";

  useEffect(() => {
    if (!activeZoneId) return;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeZoneId]);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the textarea remains selectable.
    }
  }

  return (
    <div className="budget-page min-h-dvh font-sans text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:py-10">
        {/* Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#f3efe5] hover:text-[#173f3a]"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2.4} />
            Back to map
          </Link>

          <div className="mt-4 flex flex-wrap items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center bg-[#173f3a]">
              <Droplet
                className="size-5 fill-[#f2b544] text-[#f2b544]"
                strokeWidth={2}
              />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Delhi Drainage Budget Tracker
              </h1>
              <p className="mt-1.5 text-xs font-medium text-[#756b5b] md:text-sm">
                Demo figures · source links needed before publication
              </p>
            </div>
          </div>
        </header>

        {/* Zone cards */}
        <section aria-labelledby="zones-heading" className="mt-6 md:mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="zones-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Allocated by zone
            </h2>
            <p className="text-xs font-medium text-slate-500">
              ₹{ZONES.reduce((sum, zone) => sum + zone.allocation, 0).toFixed(2)}{" "}
              Crores · illustrative total
            </p>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ZONES.map((zone) => {
              const isActive = zone.id === activeZoneId;

              return (
                <article
                  key={zone.id}
                  className={`budget-card glass-surface flex flex-col rounded-2xl p-4 shadow-sm transition md:p-5 ${
                    isActive
                      ? "is-active"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
                      <Landmark
                        className="size-4 text-slate-400"
                        strokeWidth={2.2}
                      />
                      {zone.name}
                    </h3>
                    <span className="bg-[#f3efe5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      FY 25-26
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      <IndianRupee className="size-3" strokeWidth={2.6} />
                      Allocated budget
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                      {zone.allocation.toFixed(2)}
                      <span className="ml-1.5 text-sm font-semibold text-slate-500">
                        Crores
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2 bg-[#303b34]/[.045] p-3">
                    <Target
                      className="mt-0.5 size-3.5 shrink-0 text-[#756b5b]"
                      strokeWidth={2.4}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Target
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">
                        {zone.target}
                      </p>
                    </div>
                  </div>

                  {/* Source link status */}
                  {sourceLinks[zone.id] ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {sourceLinks[zone.id].status === "pending" && (
                        <span className="text-slate-500">Source link pending</span>
                      )}
                      {sourceLinks[zone.id].status === "verified" && (
                        <span className="text-green-600">Source linked</span>
                      )}
                      {sourceLinks[zone.id].status === "error" && (
                        <span className="text-red-600">Source link error</span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setSourceLinks((links) => ({
                          ...links,
                          [zone.id]: { url: "", label: "", status: "pending" },
                        }))
                      }
                      className="mt-2 text-[10px] font-medium text-slate-400 underline underline-offset-2 hover:text-slate-600"
                    >
                      Add source link
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveZoneId(isActive ? null : zone.id);
                      setCopied(false);
                    }}
                    aria-expanded={isActive}
                    aria-controls="rti-panel"
                    className={`mt-4 flex h-11 w-full items-center justify-center gap-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f3a] active:scale-[0.99] ${
                      isActive
                        ? "bg-[#e9e6de] text-[#454d47] hover:bg-[#ddd9cf]"
                        : "bg-[#173f3a] text-white hover:bg-[#102f2b]"
                    }`}
                  >
                    <FileText className="size-4" strokeWidth={2.2} />
                    Demand Records (RTI)
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* RTI application */}
        {activeZone && (
          <section
            key={activeZone.id}
            ref={panelRef}
            id="rti-panel"
            aria-labelledby="rti-heading"
            className="glass-surface animate-rise-in mt-6 scroll-mt-4 rounded-2xl p-4 shadow-sm md:mt-8 md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="rti-heading"
                  className="text-base font-bold tracking-tight text-slate-900"
                >
                  RTI application — {activeZone.name}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Pre-filled under the Right to Information Act, 2005. Replace
                  the bracketed fields with your details before submitting.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyTemplate}
                  className="flex h-9 items-center gap-1.5 border border-[#d7d4cc] bg-white/60 px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-[#65766f]" strokeWidth={2.4} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" strokeWidth={2.2} />
                      Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveZoneId(null)}
                  aria-label="Close RTI application"
                  className="flex size-9 items-center justify-center text-slate-500 transition hover:bg-[#f3efe5] hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]"
                >
                  <X className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={template}
              aria-label={`RTI application template for ${activeZone.name}`}
              spellCheck={false}
              className="mt-4 h-80 w-full resize-y border border-[#d7d4cc] bg-white/40 p-4 font-mono text-xs leading-6 text-slate-700 outline-none focus:border-[#a58e67] focus:ring-2 focus:ring-[#a58e67]/15 sm:h-96"
            />

            <div className="mt-3 flex items-start gap-2.5 bg-[#303b34]/[.045] px-3.5 py-3 text-slate-600">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
              <p className="text-xs font-medium leading-5">
                You must print, sign, and submit this to the MCD office
                yourself. Hisaab does not submit this on your behalf.
              </p>
            </div>
          </section>
        )}

        {/* Source link manager */}
        {activeZoneId && (
          <section
            key={activeZoneId}
            aria-labelledby="source-link-heading"
            className="glass-surface animate-rise-in mt-4 scroll-mt-4 rounded-2xl p-4 shadow-sm md:mt-8 md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="source-link-heading" className="text-base font-bold tracking-tight text-slate-900">
                  Source link for {activeZone?.name ?? "Zone"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Attach a source link before publishing budget figures as factual information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveZoneId(null)}
                aria-label="Close source link manager"
                className="text-slate-500 transition hover:bg-[#f3efe5] hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            {sourceLinks[activeZoneId] && sourceLinks[activeZoneId].status !== "pending" ? (
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={sourceLinks[activeZoneId].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 underline underline-offset-2 hover:text-slate-600"
                >
                  {sourceLinks[activeZoneId].label || "View source"}
                </a>
                <span className="text-green-600">✓ Verified</span>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const url = (e.target as HTMLFormElement).elements.namedItem("source-url") as HTMLInputElement;
                    const label = (e.target as HTMLFormElement).elements.namedItem("source-label") as HTMLInputElement;
                    setSourceLinks((links) => ({
                      ...links,
                      [activeZoneId!]: {
                        url: url.value,
                        label: label.value || "Source",
                        status: "verified",
                      },
                    }));
                    url.value = "";
                    label.value = "";
                  }}
                >
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-1">
                        Source URL
                      </label>
                      <input
                        type="url"
                        name="source-url"
                        required
                        className="w-full rounded-border border-border bg-white/20 p-2 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:border-[a58e67] focus:ring-[a58e67]/15"
                        placeholder="https://example.gov.in/..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-1">
                        Link label
                      </label>
                      <input
                        type="text"
                        name="source-label"
                        className="w-full rounded-border border-border bg-white/20 p-2 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:border-[a58e67] focus:ring-[a58e67]/15"
                        placeholder="MCD budget order"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSourceLinks((links) => ({
                          ...links,
                          [activeZoneId!]: { url: "", label: "", status: "error" },
                        }))
                      }
                      className="flex h-9 items-center gap-1.5 border border-border bg-white/60 px-2.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]"
                    >
                      <X className="size-3.5" strokeWidth={2.4} />
                      Cancel
                    </button>
                    <button type="submit" className="flex h-9 items-center gap-1.5 border border-[#173f3a] px-2.5 text-[11px] font-semibold text-[#173f3a] transition hover:bg-[#0d322d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]">
                      <Check className="size-3.5" strokeWidth={2.2} />
                      Save source
                    </button>
                  </div>
                </form>
              </div>
            )}

          </section>
        )}

      </div>
    </div>
  );
}
