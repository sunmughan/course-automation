"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { UserPayload } from "@/types";

interface AuthContextType {
  user: UserPayload | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserPayload | null>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<UserPayload | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}