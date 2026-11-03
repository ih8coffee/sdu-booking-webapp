import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEMO_USERS } from "./demoUsers";

const KEY = "sdu.user";

function loadUser() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = useCallback((role, loginId, password) => {
    const account = DEMO_USERS.find((u) => u.login === loginId);
    if (!account || account.password !== password) {
      return { ok: false, error: "Wrong ID or password." };
    }
    if (account.role !== role) {
      return {
        ok: false,
        error: `This is a ${account.role} account. Use the ${account.role} tab to sign in.`,
      };
    }
    const next = { login: account.login, name: account.name, role: account.role };
    setUser(next);
    saveUser(next);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isStaff: user?.role === "staff",
      isStudent: user?.role === "student",
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
