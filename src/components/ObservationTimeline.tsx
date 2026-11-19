"use client";

import { useEffect, useRef, useState, type AnimationEvent } from "react";
import Link from "next/link";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  Check,
  Clock,
  Cloud,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

type ObservationTimelineProps = {
  onClose: () => void;
  title?: string;
  place?: string;
  status?: string;
};

type Comment = {
  id: string;
  author: string;
  time: string;
  score: number;
  body: string;
  replies?: Comment[];
};

const COMMENTS: Comment[] = [
  {
    id: "c1",
    author: "rohan_delhi",
    time: "2h",
    score: 18,
    body: "The inlet by the market gate was cleared last week but it's already backing up. Same spot every time it rains.",
    replies: [
      {
        id: "c1-r1",
        author: "ward_watch",
        time: "1h",
        score: 7,
        body: "Walked past this morning — the silt pile is still on the footpath, so it will wash straight back in.",
      },
    ],
  },
  {
    id: "c2",
    author: "monsoon_watch",
    time: "4h",
    score: 12,
    body: "IMD has another spell forecast for tomorrow evening. Worth flagging to the ward before it peaks.",
    replies: [
      {
        id: "c2-r1",
        author: "ajay_pwd",
        time: "3h",
        score: 4,
        body: "Raised it with the central division. They added the location to the pre-monsoon checklist.",
      },
    ],
  },
];

const COMMENT_COUNT = COMMENTS.reduce(
  (total, comment) => total + 1 + (comment.replies?.length ?? 0),
  0
);

function CommentThread({ comment }: { comment: Comment }) {
  return (
    <li>
      <div className="flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e8e2d5] text-[10px] font-bold uppercase text-[#173f3a] ring-1 ring-[#d7d0c0]">
          {comment.author.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
            <span className="font-semibold text-slate-700">u/{comment.author}</span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-400">{comment.time}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">{comment.body}</p>
          <div className="mt-1 flex items-center gap-0.5 text-slate-400">
            <button
              type="button"
              aria-label={`Upvote u/${comment.author}`}
              className="p-0.5 transition hover:bg-[#f3efe5] hover:text-[#65766f]"
            >
              <ArrowBigUp className="size-4" strokeWidth={2} />
            </button>
            <span className="min-w-4 text-center text-[11px] font-semibold text-slate-600">
              {comment.score}
            </span>
            <button
              type="button"
              aria-label={`Downvote u/${comment.author}`}
              className="p-0.5 transition hover:bg-[#f3efe5] hover:text-[#9b6d60]"
            >
              <ArrowBigDown className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="ml-1.5 inline-flex items-center gap-1 border-b border-transparent px-2 py-1 text-[11px] font-semibold transition hover:border-[#a58e67] hover:text-[#53645e]"
            >
              <MessageCircle className="size-3.5" strokeWidth={2} />
              Reply
            </button>
          </div>
        </div>
      </div>

      {comment.replies?.length ? (
        <ul className="ml-3.5 mt-3 space-y-3 border-l border-[#d7d0c0] pl-3.5">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function ObservationTimeline({
  onClose,
  title = "Drainage near residential zone",
  place = "Delhi · demo location",
  status = "Needs attention",
}: ObservationTimelineProps) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const handleClose = () => {
    if (closing) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    // Sheets only animate on mobile; close immediately elsewhere.
    if (reduced || !mobile) {
      onClose();
      return;
    }

    setClosing(true);
    // Fallback in case the exit animation never reports completion.
    closeTimer.current = window.setTimeout(onClose, 400);
  };

  const handleExitAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (!closing || event.target !== event.currentTarget) return;
    if (event.animationName !== "sheet-out") return;
    onClose();
  };

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleClose}
        className={`fixed inset-0 z-20 bg-[#173f3a]/25 md:hidden ${
          closing ? "animate-overlay-out" : "animate-overlay-in"
        }`}
      />
      <section
        aria-labelledby="timeline-title"
        onAnimationEnd={handleExitAnimationEnd}
        className={`glass-surface absolute bottom-0 left-0 z-30 flex h-[80dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/45 shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.16)] md:static md:h-full md:rounded-none md:border-0 md:shadow-none ${
          closing ? "animate-sheet-out" : "animate-sheet-in"
        }`}
      >
      {/* Drag handle — mobile sheet only */}
      <div
        className="mx-auto mt-2.5 h-1 w-10 shrink-0 bg-[#b7aa8f] md:hidden"
        aria-hidden="true"
      />

      {/* Header and context */}
      <div className="shrink-0 px-5 pb-4 pt-3 md:px-0 md:pt-0">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Back to evidence lanes"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-[#d7d4cc] bg-white/60 text-slate-600 transition hover:bg-white/80 hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]"
          >
            <ArrowLeft className="size-4" strokeWidth={2.2} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              SAMPLE REPORT · {status.toUpperCase()}
            </p>
            <h2
              id="timeline-title"
              className="mt-1 text-lg font-bold leading-6 tracking-tight text-slate-900 md:text-xl"
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Weather context */}
        <div className="mt-4 flex items-center gap-2 bg-[#303b34]/[.04] px-3.5 py-2.5 text-[#454d47]">
          <Cloud className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <p className="min-w-0 text-xs leading-5">
            <span className="font-semibold">Area context · demo</span>
            <span className="mx-2 text-[#b7aa8f]" aria-hidden="true">
              |
            </span>
            <span className="font-medium text-slate-600">{place}</span>
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1 md:px-0">
        <ol className="border-l border-[#d7d0c0] pl-6">
          {/* Active observation */}
          <li className="relative pb-6">
            <span
              className="absolute -left-9 top-0 flex size-6 items-center justify-center bg-[#9b6d60] ring-4 ring-[#faf9f5]"
              aria-hidden="true"
            >
              <span className="size-2 bg-white" />
            </span>

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-slate-900">
                Blocked inlet • citizen report
              </h3>
              <span className="shrink-0 px-2 py-1 text-[10px] font-semibold text-[#756b5b]">
                Resident report · sample
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                16 Nov 2026 · 09:42
              </span>
              <span>Updated 16 Nov · 11:05</span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Standing water above the kerb. Leaves and silt are blocking the
              stormwater inlet near the residential entrance.
            </p>

            <div className="mt-3 overflow-hidden border border-[#d7d0c0] bg-[#f3efe5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80"
                alt="Blocked drain inlet surrounded by standing water"
                loading="lazy"
                className="h-32 w-full object-cover md:h-36"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">
              Demo image · sample observation, not a live report
            </p>
          </li>

          {/* Completed follow-up */}
          <li className="relative pb-6">
            <span
              className="absolute -left-9 top-0 flex size-6 items-center justify-center bg-[#e2e6df] text-[#64766b] ring-4 ring-[#faf9f5]"
              aria-hidden="true"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-slate-900">
                Water receded • follow-up
              </h3>
              <span className="shrink-0 px-2 py-1 text-[10px] font-semibold text-[#756b5b]">
                Resident follow-up · sample
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                16 Nov 2026 · 14:20
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              A resident follow-up says the water returned to normal. This
              demo has no agency record to confirm the work.
            </p>
          </li>

          {/* Pending authority update */}
          <li className="relative">
            <span
              className="absolute -left-9 top-0 size-6 border border-[#d7d4cc] bg-[#faf9f5] ring-4 ring-[#faf9f5]"
              aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-slate-900">
                No authority update recorded
              </h3>
              <span className="shrink-0 px-2 py-1 text-[10px] font-semibold text-slate-500">
                No update
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                Last checked 16 Nov 2026 · 16:00
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              No official maintenance record is linked in this demo. That does
              not confirm that no work has taken place.
            </p>
          </li>
        </ol>

        {/* Community discussion */}
        <section
          aria-labelledby="discussion-heading"
          className="mt-6 border-t border-slate-100 pt-5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3
              id="discussion-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Community discussion
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              {COMMENT_COUNT} comments
            </span>
          </div>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="mt-3 flex items-start gap-2.5"
          >
            <span className="flex size-7 shrink-0 items-center justify-center bg-[#173f3a] text-[10px] font-bold text-white">
              Y
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor="timeline-comment" className="sr-only">
                Add a comment
              </label>
              <input
                id="timeline-comment"
                type="text"
                placeholder="Add a comment…"
                className="h-9 w-full border border-[#d7d4cc] bg-white/60 px-3.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-[#a58e67] focus:bg-white/80 focus:ring-2 focus:ring-[#a58e67]/15"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#173f3a] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#102f2b] active:scale-[0.98]"
                >
                  Post
                </button>
              </div>
            </div>
          </form>

          <ul className="mt-4 space-y-4">
            {COMMENTS.map((comment) => (
              <CommentThread key={comment.id} comment={comment} />
            ))}
          </ul>
        </section>
      </div>

      {/* Budget source */}
      <div className="shrink-0 border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-0 md:pb-4">
        <Link
          href="/budget"
          className="group flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 transition hover:text-[#53645e]"
        >
          <span>
            Budget records{" "}
            <span className="font-normal text-slate-400">• FY 2025-26</span>
          </span>
          <ExternalLink className="size-4 shrink-0 text-slate-400 transition group-hover:text-[#53645e]" />
        </Link>
      </div>
    </section>
    </>
  );
}
