"use client";

import * as React from "react";

export type BrandTheme = "devtraco-plus" | "woodlands" | "generic";
export type ColorMode = "light" | "dark";

export const THEMES: { id: BrandTheme; label: string; description: string }[] = [
  { id: "devtraco-plus", label: "Devtraco Plus", description: "Black & gold" },
  { id: "woodlands", label: "Woodlands", description: "Green & gold" },
  { id: "generic", label: "Generic", description: "Dark mauve & light tan" },
];

const THEME_STORAGE_KEY = "devcrm-theme";
const MODE_STORAGE_KEY = "devcrm-mode";
const DEFAULT_THEME: BrandTheme = "devtraco-plus";
const DEFAULT_MODE: ColorMode = "light";

type ThemeContextValue = {
  theme: BrandTheme;
  mode: ColorMode;
  setTheme: (theme: BrandTheme) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/** Inline script string injected before hydration to avoid a flash of the wrong theme. */
export const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
    var mode = localStorage.getItem('${MODE_STORAGE_KEY}') || '${DEFAULT_MODE}';
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (mode === 'dark') root.classList.add('dark');
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<BrandTheme>(DEFAULT_THEME);
  const [mode, setModeState] = React.useState<ColorMode>(DEFAULT_MODE);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as BrandTheme | null;
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY) as ColorMode | null;
    if (storedTheme) setThemeState(storedTheme);
    if (storedMode) setModeState(storedMode);
  }, []);

  const applyTheme = React.useCallback((next: BrandTheme) => {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const applyMode = React.useCallback((next: ColorMode) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(MODE_STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setTheme: applyTheme,
      setMode: applyMode,
      toggleMode: () => applyMode(mode === "dark" ? "light" : "dark"),
    }),
    [theme, mode, applyTheme, applyMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
