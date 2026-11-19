import type { ReactNode } from "react";

// Remounts on navigation so every route change gets a soft fade-in.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="animate-page-in flex min-h-dvh w-full flex-col">
      {children}
    </div>
  );
}
