"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BadgeCheck, LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";

export default function UserNav() {
  const { user, profile, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-[38px] w-20 animate-pulse rounded-[12px] bg-white/40" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="flex h-[38px] items-center gap-1.5 rounded-[12px] border border-white/90 bg-white/85 px-3 text-[12px] font-bold text-[#173F3A] shadow-[0_2px_8px_rgba(23,63,58,0.08)] backdrop-blur-md transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(23,63,58,0.12)]"
        >
          <LogIn className="size-3.5" />
          <span>Log In</span>
        </Link>
        <Link
          href="/register"
          className="flex h-[38px] items-center gap-1.5 rounded-[12px] bg-[#173F3A] px-3 text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(23,63,58,0.15)] transition-all hover:bg-[#0D322D]"
        >
          <UserPlus className="size-3.5" />
          <span>Register</span>
        </Link>
      </div>
    );
  }

  const displayName = profile?.full_name || user.displayName || user.email || "Delhi Resident";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-[38px] items-center gap-2 rounded-[12px] border border-white/90 bg-white/85 px-2.5 py-1 text-[12px] font-semibold text-[#172A27] shadow-[0_2px_8px_rgba(23,42,39,0.08)] backdrop-blur-md transition-all hover:bg-white cursor-pointer"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-[#173F3A] text-[10px] font-bold text-white">
            {initials}
          </span>
          <span className="max-w-[110px] truncate text-left text-[12px] font-bold">
            {displayName}
          </span>
          <span className="flex items-center gap-0.5 rounded-[6px] bg-[#E9EFF0] px-1.5 py-0.5 text-[10px] font-bold text-[#173F3A]">
            <BadgeCheck className="size-3" />
            <span>{profile?.reputation ?? 10} pts</span>
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-[16px] border border-white/90 bg-[rgb(250_252_251/0.95)] p-2 shadow-[0_14px_42px_rgba(26,48,48,0.18)] backdrop-blur-xl animate-in fade-in zoom-in-95"
        >
          <div className="border-b border-slate-100 px-3 py-2 text-left">
            <p className="text-[12px] font-bold text-[#172A27] truncate">{displayName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            {profile?.role === "agency" && (
              <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                <ShieldCheck className="size-2.5" />
                {profile.agency_name || "Agency Verified"}
              </span>
            )}
          </div>

          <DropdownMenu.Item
            onSelect={() => logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] font-semibold text-[#A95245] transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Log Out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
