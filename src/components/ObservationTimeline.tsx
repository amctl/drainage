"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
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

function CommentThread({ comment, votes, onVote, onReply }: { comment: Comment; votes: Record<string, -1 | 0 | 1>; onVote: (id: string, direction: -1 | 1) => void; onReply: (id: string, author: string) => void }) {
  const vote = votes[comment.id] ?? 0;
  const [repliesOpen, setRepliesOpen] = useState(true);
  return (
    <li className="min-w-0">
      <article className="flex items-start gap-2.5 sm:gap-3">
        <div role="group" aria-label={`Vote score ${comment.score + vote}`} className="flex shrink-0 flex-col items-center rounded-xl bg-[#edf3f3] py-1 text-[#526966]">
            <button
              type="button"
              aria-label={`Upvote u/${comment.author}`}
              aria-pressed={vote === 1}
              onClick={() => onVote(comment.id, 1)}
              className={`vote-button flex size-8 items-center justify-center rounded-lg transition hover:bg-[#dcebea] hover:text-[#126357] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#477c75] ${vote === 1 ? "text-[#126357]" : ""}`}
            >
              <ArrowBigUp className="size-[18px]" strokeWidth={2.4} />
            </button>
            <span className="min-w-8 text-center text-[11px] font-bold tabular-nums text-[#344b48]" aria-live="polite">
              {comment.score + vote}
            </span>
            <button
              type="button"
              aria-label={`Downvote u/${comment.author}`}
              aria-pressed={vote === -1}
              onClick={() => onVote(comment.id, -1)}
              className={`vote-button flex size-8 items-center justify-center rounded-lg transition hover:bg-[#f2e7e4] hover:text-[#9b493e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#477c75] ${vote === -1 ? "text-[#9b493e]" : ""}`}
            >
              <ArrowBigDown className="size-[18px]" strokeWidth={2.4} />
            </button>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex min-h-8 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#dce9e8] text-[9px] font-bold uppercase text-[#173f3a]" aria-hidden="true">{comment.author.charAt(0)}</span>
            <span className="font-bold text-[#263b3a]">u/{comment.author}</span>
            <span className="text-[#758784]" aria-hidden="true">·</span>
            <span className="text-[#607574]">{comment.time === "now" ? "just now" : `${comment.time} ago`}</span>
          </div>
          <p className="mt-1 text-[13px] leading-[1.6] text-[#344b48]">{comment.body}</p>
          <div className="mt-2 flex min-h-8 flex-wrap items-center gap-1 text-[#536a67]">
            <button
              type="button"
              onClick={() => { setRepliesOpen(true); onReply(comment.id, comment.author); }}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition hover:bg-[#e7efef] hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#477c75]"
            >
              <MessageCircle className="size-3.5" strokeWidth={2} />
              Reply
            </button>
          </div>
        </div>
      </article>

      {comment.replies?.length ? (
        <div className="ml-[15px] mt-1 border-l-2 border-[#d7e2e1] pl-3 sm:ml-[17px] sm:pl-4">
          <button type="button" aria-expanded={repliesOpen} onClick={() => setRepliesOpen((open) => !open)} className="mb-2 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-[#536a67] transition hover:bg-[#e7efef] hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-[#477c75]">
            <ChevronDown className={`size-3.5 transition-transform ${repliesOpen ? "" : "-rotate-90"}`} aria-hidden="true" />
            {repliesOpen ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}` : `View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
          </button>
          {repliesOpen && <ul className="space-y-4 pb-1">{comment.replies.map((reply) => <CommentThread key={reply.id} comment={reply} votes={votes} onVote={onVote} onReply={onReply} />)}</ul>}
        </div>
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
  const [comments, setComments] = useState(COMMENTS);
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [posted, setPosted] = useState(false);
  const [commentSort, setCommentSort] = useState<"Relevance" | "Top" | "New">("Relevance");
  const [commentSortMenuOpen, setCommentSortMenuOpen] = useState(false);
  const commentInput = useRef<HTMLTextAreaElement>(null);

  const handleVote = (id: string, direction: -1 | 1) => {
    setVotes((current) => ({ ...current, [id]: current[id] === direction ? 0 : direction }));
  };

  const handleReply = (id: string, author: string) => {
    setReplyingTo({ id, author });
    commentInput.current?.focus();
  };

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const id = `local-${Date.now()}`;
    const newComment: Comment = {
      id,
      author: "you",
      time: "now",
      score: 0,
      body,
    };
    if (replyingTo) {
      const addReply = (items: Comment[]): Comment[] => items.map((item) => item.id === replyingTo.id
        ? { ...item, replies: [...(item.replies ?? []), newComment] }
        : { ...item, replies: item.replies ? addReply(item.replies) : undefined });
      setComments((current) => addReply(current));
    } else {
      setComments((current) => [newComment, ...current]);
    }
    setDraft("");
    setReplyingTo(null);
    setPosted(true);
    window.setTimeout(() => setPosted(false), 2500);
  };

  const sortedComments = [...comments].sort((a, b) => {
    const ageMinutes = (time: string) => time === "now" ? 0 : Number.parseInt(time, 10) * (time.endsWith("d") ? 1440 : 60);
    if (commentSort === "New") return ageMinutes(a.time) - ageMinutes(b.time);
    if (commentSort === "Top") return (b.score + (votes[b.id] ?? 0)) - (a.score + (votes[a.id] ?? 0));
    return ((b.score + (votes[b.id] ?? 0)) / Math.max(1, ageMinutes(b.time))) - ((a.score + (votes[a.id] ?? 0)) / Math.max(1, ageMinutes(a.time)));
  });

  return (
      <section
        aria-labelledby="timeline-title"
        className="timeline-panel glass-surface relative flex w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/70 shadow-[0_18px_46px_rgba(20,38,34,0.10)]"
      >
      {/* Header and context */}
      <div className="timeline-context shrink-0 border-b border-[#d7e1e1] px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to posts"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#d7e1e1] bg-white/70 text-[#536a67] transition hover:bg-white hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477c75]"
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
        <div className="timeline-weather-context mt-4 flex items-center gap-2 bg-[#303b34]/[.04] px-3.5 py-2.5 text-[#454d47]">
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
      <div className="timeline-body grid min-h-0 flex-1 px-5 pb-3 pt-1 sm:px-6">
        <section className="timeline-activity" aria-labelledby="activity-heading">
          <div className="timeline-activity-heading">
            <h3 id="activity-heading">Report activity</h3>
            <span>2 resident updates · no agency record</span>
          </div>
          <ol className="timeline-progress-list" aria-label="Report progress">
          <li className="activity-step">
            <span className="activity-marker activity-marker-recorded" aria-hidden="true"><Check /></span>
            <div className="activity-step-content">
              <div className="activity-step-title"><h4>Report logged</h4><span>Resident report · sample</span></div>
              <div className="activity-step-meta"><Clock aria-hidden="true" />16 Nov · 09:42 <span>Updated 11:05</span></div>
              <p>Standing water above the kerb. Leaves and silt are blocking the stormwater inlet near the residential entrance.</p>
              <div className="activity-evidence-placeholder" role="img" aria-label="Demo photo attached; preview unavailable">
                <Camera aria-hidden="true" />
                <span>Demo photo attached</span>
                <small>Preview unavailable</small>
              </div>
            </div>
          </li>
          <li className="activity-step">
            <span className="activity-marker activity-marker-recorded" aria-hidden="true"><Check /></span>
            <div className="activity-step-content">
              <div className="activity-step-title"><h4>Resident follow-up</h4><span>Sample update</span></div>
              <div className="activity-step-meta"><Clock aria-hidden="true" />16 Nov · 14:20</div>
              <p>A resident follow-up says the water returned to normal. No agency record confirms the work.</p>
            </div>
          </li>
          <li className="activity-step activity-step-pending">
            <span className="activity-marker activity-marker-pending" aria-hidden="true"><Clock /></span>
            <div className="activity-step-content">
              <div className="activity-step-title"><h4>Agency response</h4><span>No update</span></div>
              <div className="activity-step-meta"><Clock aria-hidden="true" />Checked · 16 Nov · 16:00</div>
              <p>No linked maintenance record. This does not confirm that no work has taken place.</p>
            </div>
          </li>
          </ol>
        </section>
        <section
          aria-labelledby="discussion-heading"
          className="timeline-discussion mt-0 flex min-h-0 flex-col border-t border-[#d7e1e1] pt-3"
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <h3
              id="discussion-heading"
              className="text-base font-bold tracking-[-0.02em] text-[#203936]"
            >
              {comments.reduce((total, comment) => total + 1 + (comment.replies?.reduce((replyTotal, reply) => replyTotal + 1 + (reply.replies?.length ?? 0), 0) ?? 0), 0)} comments
            </h3>
            <DropdownMenu.Root open={commentSortMenuOpen} onOpenChange={setCommentSortMenuOpen}>
              <DropdownMenu.Trigger asChild>
                <button type="button" className="feed-sort-trigger" aria-label={`Sort comments, currently ${commentSort}`}>
                  {commentSort}<ChevronDown aria-hidden="true" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="community-sort-menu" align="end" side="top" sideOffset={7}>
                  <DropdownMenu.Label className="community-sort-label">Sort comments by</DropdownMenu.Label>
                  <DropdownMenu.RadioGroup value={commentSort} onValueChange={(value) => { setCommentSort(value as typeof commentSort); setCommentSortMenuOpen(false); }}>
                    {(["Relevance", "Top", "New"] as const).map((sort) => <DropdownMenu.RadioItem key={sort} value={sort} className="community-sort-option">
                      <DropdownMenu.ItemIndicator><Check aria-hidden="true" /></DropdownMenu.ItemIndicator>{sort}
                    </DropdownMenu.RadioItem>)}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="timeline-comment-form mt-2 flex shrink-0 items-start gap-2.5 rounded-2xl border border-[#d8e2e2] bg-white/65 p-3 shadow-[0_2px_8px_rgba(30,56,53,0.04)]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center bg-[#173f3a] text-[10px] font-bold text-white">Y</span>
            <div className="min-w-0 flex-1">
              <label htmlFor="timeline-comment" className="sr-only">Add a comment</label>
              {replyingTo && <div className="mb-1 flex items-center justify-between text-[11px] text-[#536a67]">Replying to u/{replyingTo.author}<button type="button" onClick={() => setReplyingTo(null)} className="rounded px-1.5 py-0.5 font-semibold hover:bg-[#e7efef]">Cancel</button></div>}
              <textarea
                id="timeline-comment"
                ref={commentInput}
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                placeholder={replyingTo ? `Reply to u/${replyingTo.author}…` : "Share a useful update…"}
                className="min-h-12 w-full resize-y rounded-xl border border-[#d4e0e1] bg-white/75 px-3.5 py-2.5 text-[13px] leading-5 text-[#203936] outline-none transition placeholder:text-[#667b79] focus:border-[#56837d] focus:bg-white focus:ring-2 focus:ring-[#56837d]/20"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#536a67]" aria-live="polite">{posted ? "Added to this demo" : "Demo discussion · stays on this page"}</span>
                <button type="submit" disabled={!draft.trim()} className="min-h-9 rounded-xl bg-[#173f3a] px-4 text-[11px] font-semibold text-white transition hover:bg-[#102f2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#7b918d]">Post</button>
              </div>
            </div>
          </form>

          <ul aria-label="Comments" className="timeline-comment-list mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-2">
            {sortedComments.map((comment) => <CommentThread key={comment.id} comment={comment} votes={votes} onVote={handleVote} onReply={handleReply} />)}
          </ul>
        </section>


      </div>

      {/* Budget source */}
      <div className="shrink-0 border-t border-[#d7e1e1] px-5 py-4 sm:px-6">
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
  );
}
