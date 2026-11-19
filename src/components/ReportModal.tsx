"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ChangeEvent,
} from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

type Phase = "idle" | "verifying" | "success" | "error";

type ReportModalProps = {
  onClose: () => void;
};

type VerifyResponse = {
  success?: boolean;
  message?: string;
};

export default function ReportModal({ onClose }: ReportModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const closeTimer = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return;

    // Respect reduced motion: skip the exit animation and close immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCloseRef.current();
      return;
    }

    setClosing(true);
    // Fallback in case the exit animation never reports completion.
    closeTimer.current = window.setTimeout(() => onCloseRef.current(), 400);
  }, []);

  const handleExitAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (!closing || event.target !== panelRef.current) return;
    if (event.animationName !== "modal-out") return;
    onCloseRef.current();
  };

  // Focus management, scroll lock and keyboard handling for the dialog.
  useEffect(() => {
    const node = panelRef.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !node) return;

      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (focusables.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === node)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = bodyOverflow;
      previous?.focus();
    };
  }, [requestClose]);

  // Cancel in-flight verification and pending close timers on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  // Release the preview object URL when it changes or the modal closes.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPreview(URL.createObjectURL(file));
    setSubmitted(false);
    setPhase("verifying");
    setMessage("");

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch("/api/verify", {
        method: "POST",
        body,
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as VerifyResponse | null;

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message ?? "We couldn't verify that photo. Please try again."
        );
      }

      setPhase("success");
      setMessage(payload?.message ?? "Demo checks passed. Nothing has been published.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setPhase("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={requestClose}
        className={`absolute inset-0 bg-[#173f3a]/55 ${
          closing ? "animate-overlay-out" : "animate-overlay-in"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        aria-describedby="report-modal-description"
        aria-busy={phase === "verifying"}
        tabIndex={-1}
        onAnimationEnd={handleExitAnimationEnd}
        className={`glass-dialog relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl outline-none ${
          closing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e4dfd1] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center bg-[#173f3a] text-[#f2b544]">
              <Camera className="size-4.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h2
                id="report-modal-title"
                className="text-base font-bold tracking-tight text-slate-900"
              >
                Report a drainage issue
              </h2>
              <p
                id="report-modal-description"
                className="mt-0.5 text-xs leading-5 text-slate-500"
              >
                Add a photo to try the demo checks. Reports are not sent to an authority.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestClose}
            aria-label="Close report dialog"
            className="flex size-8 shrink-0 items-center justify-center text-slate-500 transition hover:bg-[#f3efe5] hover:text-[#173f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a58e67]"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:py-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {preview ? (
            <div className="overflow-hidden border border-[#d7d0c0] bg-[#f3efe5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Selected drainage photo preview"
                className="h-32 w-full object-cover sm:h-44"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 bg-[#303b34]/[.045] px-4 py-8 text-center">
              <span className="flex size-12 items-center justify-center bg-[#e9e6df] text-[#65766f]">
                <Camera className="size-6" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-semibold text-slate-700">Add a photo</p>
              <p className="max-w-60 text-xs leading-5 text-slate-500">
                Location metadata is simulated in this demo.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={phase === "verifying"}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 bg-[#173f3a] text-sm font-semibold text-white transition hover:bg-[#102f2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b09b73] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Camera className="size-4.5" strokeWidth={2.2} />
            {preview ? "Retake photo" : "Take or choose a photo"}
          </button>

          {phase === "verifying" && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2.5 bg-[#65766f]/[.08] px-3.5 py-3 text-[#53645e]"
            >
              <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2.2} />
              <p className="text-xs font-medium">
                Running simulated location &amp; duplicate checks...
              </p>
            </div>
          )}

          {phase === "error" && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 bg-[#9b6d60]/[.08] px-3.5 py-3 text-[#76564d]"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
              <p className="text-xs font-medium leading-5">{message}</p>
            </div>
          )}

          {phase === "success" && (
            <div className="mt-4 space-y-3">
              <div
                role="status"
                className="flex items-start gap-2.5 bg-[#65766f]/[.08] px-3.5 py-3 text-[#53645e]"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
                <p className="text-xs font-medium leading-5">{message}</p>
              </div>

              {submitted && (
                <p className="text-center text-[11px] leading-5 text-[#53645e]">
                  Demo complete — nothing was sent to the authority.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#e4dfd1] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {phase === "success" ? (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={submitted}
              className="flex h-11 w-full items-center justify-center gap-2 bg-[#53645e] text-sm font-semibold text-white transition hover:bg-[#3e4d47] disabled:cursor-default disabled:bg-[#65766f]"
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="size-4.5" strokeWidth={2.2} />
                  Demo complete
                </>
              ) : (
                "Complete demo submission"
              )}
            </button>
          ) : (
            <p className="text-[10px] leading-4 text-slate-400">
              GPS and duplicate checks are mocked for this demo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
