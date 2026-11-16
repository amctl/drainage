"use client";

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
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200">
          {comment.author.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
            <span className="font-semibold text-gray-700">u/{comment.author}</span>
            <span className="text-gray-300" aria-hidden="true">
              ·
            </span>
            <span className="text-gray-400">{comment.time}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-600">{comment.body}</p>
          <div className="mt-1 flex items-center gap-0.5 text-gray-400">
            <button
              type="button"
              aria-label={`Upvote u/${comment.author}`}
              className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-blue-600"
            >
              <ArrowBigUp className="size-4" strokeWidth={2} />
            </button>
            <span className="min-w-4 text-center text-[11px] font-semibold text-gray-600">
              {comment.score}
            </span>
            <button
              type="button"
              aria-label={`Downvote u/${comment.author}`}
              className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-rose-500"
            >
              <ArrowBigDown className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="ml-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition hover:bg-gray-100 hover:text-gray-700"
            >
              <MessageCircle className="size-3.5" strokeWidth={2} />
              Reply
            </button>
          </div>
        </div>
      </div>

      {comment.replies?.length ? (
        <ul className="ml-3.5 mt-3 space-y-3 border-l border-gray-200 pl-3.5">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function ObservationTimeline({ onClose }: ObservationTimelineProps) {
  return (
    <section
      aria-labelledby="timeline-title"
      className="absolute bottom-0 left-0 z-30 flex h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl border border-b-0 border-gray-200 bg-white shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)] md:static md:h-full md:rounded-none md:border-0 md:shadow-none"
    >
      {/* Drag handle — mobile sheet only */}
      <div
        className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-300 md:hidden"
        aria-hidden="true"
      />

      {/* Header and context */}
      <div className="shrink-0 px-5 pb-4 pt-3 md:px-0 md:pt-0">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to evidence lanes"
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10"
          >
            <ArrowLeft className="size-4" strokeWidth={2.2} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Selected area
            </p>
            <h2
              id="timeline-title"
              className="mt-1 text-lg font-bold leading-6 tracking-tight text-gray-900 md:text-xl"
            >
              Drainage near residential zone
            </h2>
          </div>
        </div>

        {/* Weather context */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-sky-700">
          <Cloud className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <p className="min-w-0 text-xs leading-5">
            <span className="font-semibold">Weather context</span>
            <span className="mx-2 text-sky-300" aria-hidden="true">
              |
            </span>
            <span className="font-medium text-sky-600">IMD context • area-level</span>
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1 md:px-0">
        <ol className="border-l border-slate-200 pl-6">
          {/* Active observation */}
          <li className="relative pb-6">
            <span
              className="absolute -left-9 top-0 flex size-6 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white"
              aria-hidden="true"
            >
              <span className="size-2 rounded-full bg-white" />
            </span>

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-gray-900">
                Blocked inlet • citizen report
              </h3>
              <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                Awaiting review
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                16 Nov 2026 · 09:42
              </span>
              <span>Updated 16 Nov · 11:05</span>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Standing water above the kerb. Leaves and silt are blocking the
              stormwater inlet near the residential entrance.
            </p>

            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80"
                alt="Blocked drain inlet surrounded by standing water"
                loading="lazy"
                className="h-32 w-full object-cover md:h-36"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">
              Citizen photo · inlet blocked by leaves and silt
            </p>
          </li>

          {/* Completed follow-up */}
          <li className="relative pb-6">
            <span
              className="absolute -left-9 top-0 flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white"
              aria-hidden="true"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-gray-900">
                Water receded • follow-up
              </h3>
              <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200">
                Follow-up noted
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                16 Nov 2026 · 14:20
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              The ward team cleared the inlet and the water level returned to
              normal by the afternoon.
            </p>
          </li>

          {/* Pending authority update */}
          <li className="relative">
            <span
              className="absolute -left-9 top-0 size-6 rounded-full border-2 border-gray-300 bg-white ring-4 ring-white"
              aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold leading-5 text-gray-900">
                No authority update recorded
              </h3>
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                No update
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                Last checked 16 Nov 2026 · 16:00
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              No official maintenance record has been linked to this location
              yet.
            </p>
          </li>
        </ol>

        {/* Community discussion */}
        <section
          aria-labelledby="discussion-heading"
          className="mt-6 border-t border-gray-100 pt-5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3
              id="discussion-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400"
            >
              Community discussion
            </h3>
            <span className="text-[11px] font-medium text-gray-400">
              {COMMENT_COUNT} comments
            </span>
          </div>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="mt-3 flex items-start gap-2.5"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
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
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 px-3.5 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-blue-600 px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98]"
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
      <div className="shrink-0 border-t border-gray-100 px-5 py-4 md:px-0">
        <a
          href="#budget-records"
          onClick={(event) => event.preventDefault()}
          className="group flex items-center justify-between gap-3 text-xs font-semibold text-gray-700 transition hover:text-blue-600"
        >
          <span>
            Budget records{" "}
            <span className="font-normal text-gray-400">• source needed</span>
          </span>
          <ExternalLink className="size-4 shrink-0 text-gray-400 transition group-hover:text-blue-600" />
        </a>
      </div>
    </section>
  );
}
