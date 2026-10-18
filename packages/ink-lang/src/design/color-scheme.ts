export type ColorScheme = "light" | "dark";

export type EnvironmentLike = Record<string, string | undefined>;

/**
 * The terminal's color scheme from `COLORFGBG` (`fg;bg`, set by rxvt, Konsole,
 * iTerm2 and others): a bright background index means light. Dark when the
 * variable is missing or does not say.
 */
export function detectColorScheme(env: EnvironmentLike): ColorScheme {
  const value = env["COLORFGBG"];
  if (value === undefined) return "dark";
  const parts = value.split(";");
  const background = parts[parts.length - 1] ?? "";
  if (!/^\d+$/.test(background)) return "dark";
  const index = Number(background);
  if (index === 7 || index >= 9) return "light";
  return "dark";
}
