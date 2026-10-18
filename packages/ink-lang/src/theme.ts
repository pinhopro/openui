import { createContext, useContext } from "react";

/** Named terminal colors the components read; any Ink/chalk color name works. */
export interface InkTheme {
  /** Card borders, headings and inline code. */
  accent: string;
  /** Destructive buttons and error lines. */
  danger: string;
  /** Secondary text such as hints and status lines. */
  muted: string;
}

export const defaultTheme: InkTheme = {
  accent: "cyan",
  danger: "red",
  muted: "gray",
};

/** Fills the slots a host left out with the default theme. */
export function resolveTheme(theme: Partial<InkTheme> | undefined): InkTheme {
  return { ...defaultTheme, ...(theme ?? {}) };
}

export const ThemeContext = createContext<InkTheme>(defaultTheme);

export function useTheme(): InkTheme {
  return useContext(ThemeContext);
}
