import { createContext, useContext } from "react";

/** Named terminal colors the components read; any Ink/chalk color name works. */
export interface InkTheme {
  /** Card borders, headings and inline code. */
  accent: string;
  /** Destructive buttons and error lines. */
  danger: string;
  /** Secondary text such as hints and status lines. */
  muted: string;
  /** Success tags, callouts and upward metric trends. */
  success: string;
  /** Warning tags and callouts. */
  warning: string;
}

export const defaultTheme: InkTheme = {
  accent: "cyan",
  danger: "red",
  muted: "gray",
  success: "green",
  warning: "yellow",
};

/** Fills the slots a host left out with the default theme. */
export function resolveTheme(theme: Partial<InkTheme> | undefined): InkTheme {
  return { ...defaultTheme, ...(theme ?? {}) };
}

export const ThemeContext = createContext<InkTheme>(defaultTheme);

export function useTheme(): InkTheme {
  return useContext(ThemeContext);
}
