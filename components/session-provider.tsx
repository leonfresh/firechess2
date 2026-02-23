"use client";

/**
 * SessionProvider wraps the app and provides auth + plan state to all client components.
 * Fetches /api/me on mount and exposes values via context.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type UserInfo = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type SessionState = {
  /** Still loading from /api/me */
  loading: boolean;
  /** User is signed in */
  authenticated: boolean;
  /** "pro" or "free" */
  plan: "free" | "pro";
  /** Stripe subscription status */
  subscriptionStatus: string;
  /** User info (null if not authenticated) */
  user: UserInfo | null;
  /** Force refetch (e.g. after checkout) */
  refresh: () => void;
};

const SessionContext = createContext<SessionState>({
  loading: true,
  authenticated: false,
  plan: "free",
  subscriptionStatus: "active",
  user: null,
  refresh: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Omit<SessionState, "loading" | "refresh">>({
    authenticated: false,
    plan: "free",
    subscriptionStatus: "active",
    user: null,
  });

  const fetchSession = () => {
    setLoading(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then((json) => {
        setData({
          authenticated: !!json.authenticated,
          plan: json.plan ?? "free",
          subscriptionStatus: json.subscriptionStatus ?? "active",
          user: json.user ?? null,
        });
      })
      .catch(() => {
        setData({ authenticated: false, plan: "free", subscriptionStatus: "active", user: null });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ ...data, loading, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}
