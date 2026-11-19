import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Palette } from './tokens';
import { useStore } from '../context/store';

const Ctx = createContext<Palette>(lightTheme);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = useStore((s) => s.themePref);
  const sys = useColorScheme();
  const p = useMemo(() => (pref === 'system' ? (sys === 'dark' ? darkTheme : lightTheme) : pref === 'dark' ? darkTheme : lightTheme), [pref, sys]);
  return <Ctx.Provider value={p}>{children}</Ctx.Provider>;
}
export const useTheme = (): Palette => useContext(Ctx);
