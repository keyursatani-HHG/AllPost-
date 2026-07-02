"use client";

import * as React from "react";

import { authApi, setAccessToken } from "@/lib/api";
import type { User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [status, setStatus] = React.useState<AuthStatus>("loading");

  // Bootstrap the session on mount: the httpOnly refresh cookie (if present)
  // lets us mint a fresh access token without exposing tokens to JS storage.
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const tokens = await authApi.refresh();
        setAccessToken(tokens.access_token);
        const me = await authApi.me();
        if (active) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (active) {
          setAccessToken(null);
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const { user, tokens } = await authApi.login({ email, password });
    setAccessToken(tokens.access_token);
    setUser(user);
    setStatus("authenticated");
    return user;
  }, []);

  const register = React.useCallback(
    async (name: string, email: string, password: string) => {
      const { user, tokens } = await authApi.register({ name, email, password });
      setAccessToken(tokens.access_token);
      setUser(user);
      setStatus("authenticated");
      return user;
    },
    []
  );

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const value = React.useMemo(
    () => ({ user, status, login, register, logout, refreshUser }),
    [user, status, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
