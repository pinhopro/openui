/** The flex props shared by Stack and Card, as the model writes them. */
export interface FlexProps {
  direction?: string | undefined;
  gap?: string | undefined;
  align?: string | undefined;
  justify?: string | undefined;
  wrap?: boolean | undefined;
}

export type FlexDirection = "row" | "column";

export type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline";

export type JustifyContent =
  "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";

/** The same props in the shape Ink's Box takes. */
export interface FlexBoxProps {
  flexDirection: FlexDirection;
  gap: number;
  alignItems: AlignItems | undefined;
  justifyContent: JustifyContent | undefined;
  flexWrap: "wrap" | "nowrap";
}

/** The spacing tokens the gap words map onto (cells). */
export interface GapSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export const DEFAULT_GAP_SPACING: GapSpacing = { xs: 0, sm: 1, md: 1, lg: 2, xl: 2 };

/** Gap words in terminal cells (columns in a row, lines in a column), from the spacing tokens. */
function gapCells(token: string, spacing: GapSpacing): number {
  if (token === "none") return 0;
  if (token === "xs") return spacing.xs;
  if (token === "s") return spacing.sm;
  if (token === "l") return spacing.lg;
  if (token === "xl") return spacing.xl;
  if (token === "2xl") return spacing.xl + 1;
  return spacing.md;
}

const ALIGN_ITEMS: Record<string, AlignItems> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const JUSTIFY_CONTENT: Record<string, JustifyContent> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

/** Maps the model-facing flex props to Ink Box props; unknown values fall back to the defaults. */
export function flexBoxProps(
  props: FlexProps,
  spacing: GapSpacing = DEFAULT_GAP_SPACING,
): FlexBoxProps {
  const flexDirection: FlexDirection = props.direction === "row" ? "row" : "column";
  const gap = gapCells(props.gap ?? "m", spacing);
  const alignItems = props.align === undefined ? undefined : ALIGN_ITEMS[props.align];
  const justifyContent = props.justify === undefined ? undefined : JUSTIFY_CONTENT[props.justify];
  const flexWrap = props.wrap === true ? "wrap" : "nowrap";
  return { flexDirection, gap, alignItems, justifyContent, flexWrap };
}
