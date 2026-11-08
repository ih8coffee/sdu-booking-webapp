import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { postLogin } from "../api";

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
    /* storage unavailable */
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  // role is the tab picked on the login page, "student" | "staff"
  const login = useCallback(async (role, loginId, password) => {
    let data;
    try {
      data = await postLogin(loginId, password, role);
    } catch (err) {
      return { ok: false, error: err.message };
    }

    if (data.result === 1) return { ok: false, error: "Wrong ID or password." };
    if (data.result === 2) {
      const other = role === "student" ? "staff" : "student";
      return { ok: false, error: `That isn't a ${role} account. Try the ${other} tab.` };
    }
    if (data.result !== 0) return { ok: false, error: "Login failed, try again." };

    const next = { login: data.login, name: data.name, role };
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
