import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {DEFAULT_THEME_ID, Theme, getTheme} from '../theme';
import {getSavedThemeId, setSavedThemeId} from '../native/SilenceTimer';

interface ThemeContextValue {
  theme: Theme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme(DEFAULT_THEME_ID),
  setThemeId: () => {},
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [themeId, setId] = useState(() => getSavedThemeId() ?? DEFAULT_THEME_ID);

  const setThemeId = useCallback((id: string) => {
    setId(id);
    setSavedThemeId(id);
  }, []);

  const value = useMemo(() => ({theme: getTheme(themeId), setThemeId}), [themeId, setThemeId]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Builds a component's StyleSheet from the active theme. Pass a module-level
 * factory so the styles are only rebuilt when the theme actually changes.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const {theme} = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
