"use client";

import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Droplet, ArrowLeft, MailCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signInWithGoogle, sendEmailOtp, verifyEmailOtp, completeRegistration } = useAuth();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await signInWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await sendEmailOtp(email.trim(), name.trim());
      setStep("otp");
      if (res.debugOtp) {
        setInfo(`Test environment: your code is ${res.debugOtp}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP code to email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(5, index + pasted.length);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = value.replace(/\D/g, "");
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await verifyEmailOtp(email.trim(), otp);
      await completeRegistration(name.trim(), email.trim(), password);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed. Check the code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      setError(null);
      const res = await sendEmailOtp(email.trim(), name.trim());
      setInfo("A new verification code was sent to your email.");
      if (res.debugOtp) {
        setInfo(`New test code: ${res.debugOtp}`);
      }
      setTimeout(() => setInfo(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not resend code.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#E6EDEE] p-4 text-[#172A27]">
      <div className="w-full max-w-[440px] rounded-[24px] border border-white/90 bg-[rgb(249_252_252/0.88)] p-8 shadow-[0_14px_42px_rgba(26,48,48,0.14),0_2px_6px_rgba(26,48,48,0.06)] backdrop-blur-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-[#173F3A]"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Groundwork</span>
        </Link>

        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#173F3A] text-white shadow-[0_4px_12px_rgba(23,63,58,0.2)]">
            <Droplet className="size-6" />
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#172A27]">
            {step === "otp" ? "Verify Your Email" : "Join Groundwork Delhi"}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {step === "otp"
              ? "Enter the 6-digit code sent to your inbox"
              : "Report issues, upvote works, and track public spending"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-[10px] bg-red-50/90 border border-red-200/60 p-3 text-[12px] font-medium text-[#A95245]">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-4 rounded-[10px] bg-emerald-50/90 border border-emerald-200/60 p-3 text-[12px] font-medium text-[#457762]">
            {info}
          </div>
        )}

        {step === "form" ? (
          <>
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-[12px] border border-slate-200/90 bg-white px-4 text-[13px] font-bold text-[#172A27] shadow-[0_2px_8px_rgba(23,42,39,0.06)] transition-all hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? "Connecting to Google…" : "Continue with Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-slate-200/80" />
              <span className="relative bg-[rgb(249_252_252)] px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                or register with email OTP
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#172A27]">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Mehta"
                  required
                  className="h-11 w-full rounded-[12px] border border-slate-200/90 bg-white px-3.5 text-[13px] text-[#172A27] placeholder:text-slate-400 focus:border-[#173F3A] focus:outline-none focus:ring-2 focus:ring-[#173F3A]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#172A27]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="h-11 w-full rounded-[12px] border border-slate-200/90 bg-white px-3.5 text-[13px] text-[#172A27] placeholder:text-slate-400 focus:border-[#173F3A] focus:outline-none focus:ring-2 focus:ring-[#173F3A]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#172A27]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="h-11 w-full rounded-[12px] border border-slate-200/90 bg-white px-3.5 text-[13px] text-[#172A27] placeholder:text-slate-400 focus:border-[#173F3A] focus:outline-none focus:ring-2 focus:ring-[#173F3A]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-[12px] bg-[#173F3A] px-4 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(23,63,58,0.2)] transition-colors hover:bg-[#0D322D] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Sending Verification OTP…" : "Send Verification OTP to Email"}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: 6-digit OTP Input */
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 text-center">
            <div className="flex flex-col items-center">
              <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#173F3A]/10 text-[#173F3A]">
                <MailCheck className="size-5" />
              </span>
              <p className="text-[12px] text-slate-600">
                Code sent to <strong className="text-[#173F3A]">{email}</strong>
              </p>
            </div>

            {/* 6 Digit Inputs */}
            <div className="flex justify-center gap-2">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="size-12 rounded-[12px] border border-slate-200/90 bg-white text-center font-mono text-[20px] font-bold text-[#173F3A] shadow-sm focus:border-[#173F3A] focus:outline-none focus:ring-2 focus:ring-[#173F3A]/30"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-[12px] bg-[#173F3A] px-4 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(23,63,58,0.2)] transition-colors hover:bg-[#0D322D] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Verifying & Registering…" : "Verify Email & Complete Registration"}
            </button>

            <div className="flex items-center justify-between text-[12px]">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Edit details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="font-bold text-[#173F3A] hover:underline disabled:opacity-50 cursor-pointer"
              >
                {resending ? "Sending…" : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-[12px] text-slate-500">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-bold text-[#173F3A] underline underline-offset-2 hover:text-[#0D322D]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
