export interface Palette {
  name: 'light' | 'dark';
  background: string; card: string; cardBorder: string; primary: string; accent: string;
  text: string; muted: string; highlight: string; onPrimary: string; danger: string;
  shadow: { shadowColor: string; shadowOpacity: number; shadowRadius: number; shadowOffset: { width: number; height: number }; elevation: number };
}

export const lightTheme: Palette = {
  name: 'light', background: '#F7F8FC', card: '#FFFFFF', cardBorder: 'transparent', primary: '#4F46E5', accent: '#0D9488',
  text: '#1E293B', muted: '#64748B', highlight: '#E0E7FF', onPrimary: '#FFFFFF', danger: '#B91C1C',
  shadow: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
};

export const darkTheme: Palette = {
  name: 'dark', background: '#0B1020', card: '#151C2F', cardBorder: 'rgba(255,255,255,0.08)', primary: '#818CF8', accent: '#2DD4BF',
  text: '#E5E7EB', muted: '#9CA3B8', highlight: '#272E49', onPrimary: '#0B1020', danger: '#FCA5A5',
  shadow: { shadowColor: '#000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
};

export type ThemePref = 'system' | 'light' | 'dark';
export const TOUCH = 44;
export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
