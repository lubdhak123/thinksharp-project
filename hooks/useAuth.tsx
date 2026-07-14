"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";

export type UserRole = "admin" | "volunteer" | "intern";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo Mode Credentials
const DEMO_ACCOUNTS: Record<string, { password: string; role: UserRole; id: string }> = {
  "admin@thinksharp.org": { password: "Admin@123", role: "admin", id: "00000000-0000-4000-8000-000000000001" },
  "volunteer@thinksharp.org": { password: "Volunteer@123", role: "volunteer", id: "00000000-0000-4000-8000-000000000002" },
  "intern@thinksharp.org": { password: "Intern@123", role: "intern", id: "00000000-0000-4000-8000-000000000003" },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load session
  useEffect(() => {
    const storedUser = localStorage.getItem("thinksharp_auth_user");
    const storedRole = localStorage.getItem("thinksharp_auth_role");

    if (hasSupabaseConfig && supabase) {
      // 1. Supabase Auth mode takes priority so invitation sessions are honored.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          localStorage.removeItem("thinksharp_auth_user");
          localStorage.removeItem("thinksharp_auth_role");
          syncSupabaseUser(session.user);
        } else if (storedUser && storedRole) {
          loadStoredDemoUser(storedUser, storedRole);
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          localStorage.removeItem("thinksharp_auth_user");
          localStorage.removeItem("thinksharp_auth_role");
          syncSupabaseUser(session.user);
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }

    if (storedUser && storedRole) {
      loadStoredDemoUser(storedUser, storedRole);
    } else {
      setLoading(false);
    }
  }, []);

  function loadStoredDemoUser(storedUser: string, storedRole: string) {
      try {
        const parsedUser = JSON.parse(storedUser) as CurrentUser;
        if (!UUID_RE.test(parsedUser.id)) {
          localStorage.removeItem("thinksharp_auth_user");
          localStorage.removeItem("thinksharp_auth_role");
          setLoading(false);
          return;
        }
        setUser(parsedUser);
        setRole(storedRole as UserRole);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("thinksharp_auth_user");
        localStorage.removeItem("thinksharp_auth_role");
      }
      setLoading(false);
  }

  async function syncSupabaseUser(supabaseUser: any) {
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    });
    try {
      // Fetch role from profiles table
      const { data, error } = await supabase!
        .from("profiles")
        .select("role")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      if (error) throw error;
      if (data && data.role) {
        setRole(data.role as UserRole);
      } else {
        // Fallback to metadata role or default to volunteer
        setRole((supabaseUser.user_metadata?.role as UserRole) || "volunteer");
      }
    } catch (e) {
      console.error("Failed to sync profile role", e);
      setRole((supabaseUser.user_metadata?.role as UserRole) || "volunteer");
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const demoAccount = DEMO_ACCOUNTS[email];
    if (demoAccount && demoAccount.password === password) {
      const loggedUser = { id: demoAccount.id, email, name: roleName(demoAccount.role) };
      setUser(loggedUser);
      setRole(demoAccount.role);
      localStorage.setItem("thinksharp_auth_user", JSON.stringify(loggedUser));
      localStorage.setItem("thinksharp_auth_role", demoAccount.role);
      return;
    }

    if (hasSupabaseConfig && supabase) {
      // Supabase Sign In
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    } else {
      // Demo Sign In
      throw new Error("Invalid email or password.");
    }
  }

  async function signOut() {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setRole(null);
    localStorage.removeItem("thinksharp_auth_user");
    localStorage.removeItem("thinksharp_auth_role");
    router.push("/");
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function roleName(role: UserRole) {
  if (role === "admin") return "Admin";
  return "Lubdhak";
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useCurrentUser() {
  return useAuth().user;
}

export function useUserRole() {
  return useAuth().role;
}

export function useIsAdmin() {
  return useAuth().role === "admin";
}
