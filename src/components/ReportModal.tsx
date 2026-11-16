"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close on Escape.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Cancel any in-flight verification when the modal closes.
  useEffect(() => {
    return () => abortRef.current?.abort();
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
      setMessage(payload?.message ?? "Photo verified. GPS and duplicate checks passed.");
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Camera className="size-4.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h2
                id="report-modal-title"
                className="text-base font-bold tracking-tight text-slate-900"
              >
                Report a drainage issue
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Take a photo and we&apos;ll verify the location before publishing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10"
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
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Selected drainage photo preview"
                className="h-32 w-full object-cover sm:h-44"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                <Camera className="size-6" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-semibold text-slate-700">Add a photo</p>
              <p className="max-w-60 text-xs leading-5 text-slate-500">
                Your camera will open with GPS tagging enabled.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={phase === "verifying"}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Camera className="size-4.5" strokeWidth={2.2} />
            {preview ? "Retake photo" : "Take or choose a photo"}
          </button>

          {phase === "verifying" && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-blue-700"
            >
              <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2.2} />
              <p className="text-xs font-medium">
                Verifying GPS &amp; checking duplicates...
              </p>
            </div>
          )}

          {phase === "error" && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
              <p className="text-xs font-medium leading-5">{message}</p>
            </div>
          )}

          {phase === "success" && (
            <div className="mt-4 space-y-3">
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-emerald-700"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
                <p className="text-xs font-medium leading-5">{message}</p>
              </div>

              {submitted && (
                <p className="text-center text-[11px] leading-5 text-emerald-700">
                  Mock submission complete — nothing was sent to the authority yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-5 py-3">
          {phase === "success" ? (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={submitted}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-default disabled:bg-emerald-700"
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="size-4.5" strokeWidth={2.2} />
                  Report submitted
                </>
              ) : (
                "Submit Report"
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
