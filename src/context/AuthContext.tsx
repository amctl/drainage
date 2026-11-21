"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "@/lib/firebase";

export interface UserProfile {
  id: string; // Firebase UID
  full_name: string;
  email: string;
  role: "resident" | "agency" | "admin";
  agency_name?: string | null;
  reputation: number;
  avatar_url?: string | null;
  is_email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendEmailOtp: (email: string, name: string) => Promise<{ debugOtp?: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  completeRegistration: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_BACKEND_URL = process.env.NEXT_PUBLIC_AUTH_BACKEND_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Backend / Supabase
  const syncProfile = async (firebaseUid: string, email: string, name: string, avatarUrl?: string | null) => {
    try {
      const res = await fetch(`${AUTH_BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid,
          email,
          name: name || "Delhi Resident",
          avatarUrl: avatarUrl || undefined,
        }),
      }).catch(() => null);

      if (res?.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          localStorage.setItem("groundwork_profile", JSON.stringify(data.profile));
          return;
        }
      }
    } catch {
      // Ignore network errors and use fallback
    }

    // Fallback profile if backend isn't reached
    const fallbackProfile: UserProfile = {
      id: firebaseUid,
      full_name: name || "Delhi Resident",
      email: email || "",
      role: "resident",
      reputation: 10,
      avatar_url: avatarUrl || null,
      is_email_verified: true,
      agency_name: null,
    };
    setProfile(fallbackProfile);
    localStorage.setItem("groundwork_profile", JSON.stringify(fallbackProfile));
  };

  useEffect(() => {
    // Check cached profile first for fast UI render
    const cached = localStorage.getItem("groundwork_profile");
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(
          currentUser.uid,
          currentUser.email || "",
          currentUser.displayName || "Delhi Resident",
          currentUser.photoURL
        );
      } else {
        setProfile(null);
        localStorage.removeItem("groundwork_profile");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncProfile(
          result.user.uid,
          result.user.email || "",
          result.user.displayName || "Delhi Resident",
          result.user.photoURL
        );
      }
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      throw err;
    }
  };

  const sendEmailOtp = async (email: string, name: string) => {
    const res = await fetch(`${AUTH_BACKEND_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to send verification OTP.");
    }
    return { debugOtp: data.debugOtp };
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    const res = await fetch(`${AUTH_BACKEND_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid or expired verification code.");
    }
  };

  const completeRegistration = async (name: string, email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result.user) {
      await fetch(`${AUTH_BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email,
          name,
        }),
      }).catch(() => null);

      await syncProfile(result.user.uid, email, name, null);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (result.user) {
      await syncProfile(
        result.user.uid,
        result.user.email || email,
        result.user.displayName || "Delhi Resident",
        result.user.photoURL
      );
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    localStorage.removeItem("groundwork_profile");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        sendEmailOtp,
        verifyEmailOtp,
        completeRegistration,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
