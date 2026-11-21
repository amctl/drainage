"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Droplet, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await loginWithEmail(email.trim(), password);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#E6EDEE] p-4 text-[#172A27]">
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/90 bg-[rgb(249_252_252/0.88)] p-8 shadow-[0_14px_42px_rgba(26,48,48,0.14),0_2px_6px_rgba(26,48,48,0.06)] backdrop-blur-2xl">
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
            Sign in to Groundwork
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Delhi drainage reporting & civic accountability
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-[10px] bg-red-50/90 border border-red-200/60 p-3 text-[12px] font-medium text-[#A95245]">
            {error}
          </div>
        )}

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
            or sign in with email
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3.5">
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
              placeholder="Enter your password"
              required
              className="h-11 w-full rounded-[12px] border border-slate-200/90 bg-white px-3.5 text-[13px] text-[#172A27] placeholder:text-slate-400 focus:border-[#173F3A] focus:outline-none focus:ring-2 focus:ring-[#173F3A]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-[12px] bg-[#173F3A] px-4 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(23,63,58,0.2)] transition-colors hover:bg-[#0D322D] disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing In…" : "Sign In with Email"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-slate-500">
          New resident?{" "}
          <Link
            href="/register"
            className="font-bold text-[#173F3A] underline underline-offset-2 hover:text-[#0D322D]"
          >
            Register with Email OTP
          </Link>
        </p>
      </div>
    </main>
  );
}
