import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import Cookies from "js-cookie";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "indigo" | "blue" | "emerald" | "rose" | "amber";

interface ThemeContextValue {
  theme: ThemeMode;
  accentColor: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (accent: AccentColor) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_COOKIE_KEY = "app_theme";
const ACCENT_COOKIE_KEY = "app_accent_color";

// Cookie options to persist permanently (approx. 100 years)
const COOKIE_OPTIONS = {
  expires: 365 * 100,
  path: "/",
  sameSite: "lax" as const,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = Cookies.get(THEME_COOKIE_KEY);
    return (saved as ThemeMode) || "system";
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = Cookies.get(ACCENT_COOKIE_KEY);
    return (saved as AccentColor) || "indigo";
  });

  const [isDark, setIsDark] = useState(false);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
    Cookies.set(THEME_COOKIE_KEY, next, COOKIE_OPTIONS);
  };

  const setAccentColor = (next: AccentColor) => {
    setAccentColorState(next);
    Cookies.set(ACCENT_COOKIE_KEY, next, COOKIE_OPTIONS);
  };

  useEffect(() => {
    const root = document.documentElement;

    // Apply accent color data attribute
    root.setAttribute("data-accent", accentColor);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveAndApplyTheme = () => {
      const darkActive = theme === "dark" || (theme === "system" && mediaQuery.matches);

      root.classList.toggle("dark", darkActive);
      setIsDark(darkActive);
    };

    resolveAndApplyTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", resolveAndApplyTheme);
      return () => mediaQuery.removeEventListener("change", resolveAndApplyTheme);
    }
  }, [theme, accentColor]);

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
