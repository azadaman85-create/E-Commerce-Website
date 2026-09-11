"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: Profile | null;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(true);
  const clientRef = useRef<SupabaseClient | null>(null);

  /**
   * supabase-js is ~196 kB and this provider wraps every page, so importing
   * it statically would put that on the critical path of the whole site.
   * Nothing on first paint depends on it — the header renders identically
   * signed in or out — so it is fetched after mount instead.
   */
  const getSupabase = useCallback(async (): Promise<SupabaseClient> => {
    if (!clientRef.current) {
      const { createClient } = await import("@/lib/supabase/client");
      clientRef.current = createClient();
    }
    return clientRef.current;
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      const supabase = await getSupabase();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile((data as Profile) ?? null);
    },
    [getSupabase],
  );

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const supabase = await getSupabase();
      if (!active) return;

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id);
      }
      setLoading(false);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          void loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      unsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [getSupabase, loadProfile]);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, [getSupabase]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      profile,
      session,
      loading,
      isAdmin: profile?.role === "admin",
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
