"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserPayload } from "@/types";

const TOKEN_KEY = "auth_token";

function formatApiError(data: any, defaultMsg: string): string {
  if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
    return data.details.map((d: any) => d.message).join(", ");
  }
  return data?.error || data?.message || defaultMsg;
}

async function fetchSession(token: string): Promise<UserPayload | null> {
  try {
    const res = await fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
      }
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetchSession(token).then((sessionUser) => {
      if (cancelled) return;
      setUser(sessionUser);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = formatApiError(data, "Invalid email or password");
        setError(errorMsg);
        return null;
      }
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      setUser(data.user);
      return data.user as UserPayload;
    } catch {
      setError("Network error. Please check your connection.");
      return null;
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          const errorMsg = formatApiError(data, "Registration failed");
          setError(errorMsg);
          return null;
        }
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setUser(data.user);
        return data.user as UserPayload;
      } catch {
        setError("Network error. Please check your connection.");
        return null;
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout };
}