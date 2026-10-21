import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const THEMES = {
  light: {
    primary: '#1A73E8',
    secondary: '#6C757D',
    background: '#FFFFFF',
    text: '#000000',
    danger: '#DC3545',
    success: '#28A745',
  },
  dark: {
    primary: '#8AB4F8',
    secondary: '#9AA0A6',
    background: '#121212',
    text: '#FFFFFF',
    danger: '#EF5350',
    success: '#66BB6A',
  },
  bball: {
    primary: '#F97316',
    secondary: '#6B7280',
    background: '#FFF7ED',
    text: '#1F2937',
    danger: '#DC2626',
    success: '#16A34A',
  },
};

const ThemeContext = createContext({
  theme: 'light',
  colors: THEMES.light,
  setTheme: () => {},
});

export function ThemeProvider({ children, initialTheme = 'light' }) {
  const [theme, setThemeState] = useState(initialTheme);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((current) => (THEMES[nextTheme] ? nextTheme : current));
  }, []);

  const colors = THEMES[theme] || THEMES.light;

  const value = useMemo(() => ({ theme, colors, setTheme }), [theme, colors, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEMES };
