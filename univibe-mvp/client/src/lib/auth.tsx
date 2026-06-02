import { createContext, useContext, useMemo, useState } from "react";

// ----------------------------------------------------------------------------
// Auth context — demo only, lives in React state. NO browser storage.
// When swapping to Supabase Auth:
//   - replace AuthProvider with a wrapper that listens to supabase.auth.onAuthStateChange
//   - replace `signup`, `loginDemo`, `login` with thin Supabase calls
//   - the rest of the app should not change.
// ----------------------------------------------------------------------------

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  isDemo: boolean;
}

interface AuthContextValue {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      signOut: () => setUser(null),
    }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
