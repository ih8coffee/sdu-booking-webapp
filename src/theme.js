import { useCallback, useEffect, useState } from "react";

// saved choice "light" | "dark", otherwise the OS setting (<html data-theme>)
const KEY = "sdu.theme";
const QUERY = "(prefers-color-scheme: dark)";

function storedChoice() {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

const systemPrefersDark = () => !!window.matchMedia?.(QUERY).matches;

export default function useTheme() {
  const [choice, setChoice] = useState(storedChoice);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme");
  }, [choice]);

  const theme = choice ?? (systemDark ? "dark" : "light");

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setChoice(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  return { theme, toggle };
}
