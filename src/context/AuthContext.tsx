import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "driver" | "passenger" | null;

interface Profile {
  id: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      // Use optimized RPC to get role and profile data in fewer RTTs
      const [profileRes, loginInfoRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone")
          .eq("id", userId)
          .maybeSingle(),
        supabase.rpc("get_user_login_info", { _user_id: userId }),
      ]);

      if (profileRes.error) {
        console.error("Error fetching profile:", profileRes.error);
        setProfile(null);
      } else if (profileRes.data) {
        const { is_admin, is_driver } = loginInfoRes.data as any || {};
        let role: UserRole = "passenger";
        if (is_admin) role = "admin";
        else if (is_driver) role = "driver";

        setProfile({
          id: profileRes.data.id,
          full_name: profileRes.data.full_name ?? undefined,
          phone: profileRes.data.phone ?? undefined,
          role,
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
      setProfile(null);
    }
    setIsLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
