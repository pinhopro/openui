/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import type { DesignSystem } from "../../src/design/design-system";
import { useDesignSystem } from "../../src/design/design-system-context";
import { walkLeaves, type TokenLeaf } from "../../src/design/token-paths";
import type { TypeStyle } from "../../src/design/tokens";
import { createLibrary, defineComponent, type Library } from "../../src/library";

/*
 * A page component for the showcase: the design tokens of the active design
 * system, group by group, with a mark on the ones the theme set itself. It
 * reads the design system from context, so switching the theme in the
 * sidebar redraws it.
 */

const SET_MARK = "●";
const DEFAULT_MARK = "○";
const STOPS = ["100", "300", "500", "700", "900"];
const SEMANTIC_GROUPS = [
  "canvas",
  "border",
  "text",
  "textBackground",
  "button.background",
  "button.text",
  "icon",
];
const TYPE_STYLES = ["display", "h1", "h2", "h3", "h4", "h5", "h6", "body", "label", "helper"];

/** True when the theme set this path itself, or the primitive scale it belongs to. */
function isAssigned(system: DesignSystem, path: string): boolean {
  if (system.assigned.includes(path)) return true;
  const segments = path.split(".");
  if (segments[1] !== "primitive") return false;
  return system.assigned.includes(segments.slice(0, 3).join("."));
}

interface MarkProps {
  assigned: boolean;
  accent: string;
}

function Mark({ assigned, accent }: MarkProps) {
  if (assigned) return <Text color={accent}>{SET_MARK + " "}</Text>;
  return <Text dimColor>{DEFAULT_MARK + " "}</Text>;
}

interface SwatchProps {
  color: string;
}

/** Two cells painted in the color; a dotted pair when the token is empty (terminal default). */
function Swatch({ color }: SwatchProps) {
  if (color === "" || color === "dim") return <Text dimColor>{"··"}</Text>;
  if (color === "inverse") return <Text inverse>{"  "}</Text>;
  return <Text backgroundColor={color}>{"  "}</Text>;
}

/** The text of a color token: the value, or what an empty one means. */
function colorLabel(color: string): string {
  if (color === "") return "terminal";
  return color;
}

interface LeafIndex {
  get: (path: string) => TokenLeaf | undefined;
}

function indexLeaves(system: DesignSystem): LeafIndex {
  const leaves = new Map<string, TokenLeaf>();
  for (const leaf of walkLeaves(system.tokens)) leaves.set(leaf.path.join("."), leaf);
  return {
    get: function get(path) {
      return leaves.get(path);
    },
  };
}

interface GroupTitleProps {
  title: string;
  accent: string;
}

function GroupTitle({ title, accent }: GroupTitleProps) {
  return (
    <Text bold color={accent}>
      {title}
    </Text>
  );
}

interface SheetProps {
  system: DesignSystem;
  leaves: LeafIndex;
  accent: string;
}

/** One row per primitive scale: the five stops as swatches and the 500 value. */
function PrimitiveRows({ system, leaves, accent }: SheetProps) {
  const rows: ReactNode[] = [];
  for (const name of Object.keys(system.tokens.color.primitive)) {
    const swatches: ReactNode[] = [];
    for (const stop of STOPS) {
      const leaf = leaves.get(`color.primitive.${name}.${stop}`);
      swatches.push(
        <Box key={stop} marginRight={1}>
          <Swatch color={leaf === undefined ? "" : String(leaf.value)} />
        </Box>,
      );
    }
    const middle = leaves.get(`color.primitive.${name}.500`);
    rows.push(
      <Box key={name} flexDirection="row">
        <Box width={12}>
          <Text>
            <Mark assigned={isAssigned(system, `color.primitive.${name}`)} accent={accent} />
            {name}
          </Text>
        </Box>
        {swatches}
        <Text dimColor>{colorLabel(middle === undefined ? "" : String(middle.value))}</Text>
      </Box>,
    );
  }
  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Box width={12}>
          <GroupTitle title="Primitives" accent={accent} />
        </Box>
        <Text dimColor>{STOPS.join(" ")}</Text>
      </Box>
      {rows}
    </Box>
  );
}

/** One wrapping row per semantic group: `name swatch value` per token. */
function SemanticRows({ system, leaves, accent }: SheetProps) {
  const groups: ReactNode[] = [];
  for (const group of SEMANTIC_GROUPS) {
    const entries: ReactNode[] = [];
    for (const leaf of walkLeaves(system.tokens.color.semantic)) {
      const path = leaf.path.join(".");
      if (!path.startsWith(group + ".") || path.slice(group.length + 1).includes(".")) continue;
      const full = "color.semantic." + path;
      const name = leaf.path[leaf.path.length - 1] as string;
      entries.push(
        <Box key={path} marginRight={2}>
          <Text>
            <Mark assigned={isAssigned(system, full)} accent={accent} />
            {name + " "}
          </Text>
          <Swatch color={String(leaf.value)} />
          <Text dimColor>{" " + colorLabel(String(leaf.value))}</Text>
        </Box>,
      );
    }
    groups.push(
      <Box key={group} flexDirection="row">
        <Box width={18} flexShrink={0}>
          <Text bold>{group}</Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" flexGrow={1}>
          {entries}
        </Box>
      </Box>,
    );
  }
  void leaves;
  return (
    <Box flexDirection="column">
      <GroupTitle title="Semantic colors" accent={accent} />
      {groups}
    </Box>
  );
}

/** `name value` pairs for a flat numeric group (spacing, grid). */
function NumberRow({
  system,
  leaves,
  accent,
  title,
  group,
}: SheetProps & { title: string; group: string }) {
  const entries: ReactNode[] = [];
  for (const leaf of walkLeaves((system.tokens as unknown as Record<string, unknown>)[group])) {
    const name = leaf.path.join(".");
    entries.push(
      <Box key={name} marginRight={2}>
        <Text>
          <Mark assigned={isAssigned(system, `${group}.${name}`)} accent={accent} />
          {name + " "}
          <Text bold>{String(leaf.value)}</Text>
        </Text>
      </Box>,
    );
  }
  void leaves;
  return (
    <Box flexDirection="row">
      <Box width={12}>
        <GroupTitle title={title} accent={accent} />
      </Box>
      {entries}
    </Box>
  );
}

/** The words that describe a type style: weight, italic, underline, transform and color. */
function describeType(style: TypeStyle): string {
  const words: string[] = [style.weight];
  if (style.italic) words.push("italic");
  if (style.underline) words.push("underline");
  if (style.transform !== "none") words.push(style.transform);
  return words.join(" ");
}

/** One row per type style, drawn in that style. */
function TypographyRows({ system, leaves, accent }: SheetProps) {
  const rows: ReactNode[] = [];
  for (const name of TYPE_STYLES) {
    const style = (system.tokens.typography as unknown as Record<string, TypeStyle>)[name];
    if (style === undefined) continue;
    let assigned = false;
    for (const field of ["weight", "italic", "underline", "transform", "color"]) {
      if (isAssigned(system, `typography.${name}.${field}`)) assigned = true;
    }
    const sample =
      style.transform === "uppercase"
        ? "SAMPLE"
        : style.transform === "lowercase"
          ? "sample"
          : "Sample";
    rows.push(
      <Box key={name} flexDirection="row">
        <Box width={12}>
          <Text>
            <Mark assigned={assigned} accent={accent} />
            {name}
          </Text>
        </Box>
        <Box width={10}>
          <Text
            bold={style.weight === "bold"}
            italic={style.italic}
            underline={style.underline}
            color={style.color === "" || style.color === "dim" ? undefined : style.color}
            dimColor={style.color === "dim"}
          >
            {sample}
          </Text>
        </Box>
        <Text dimColor>{describeType(style) + (style.color === "" ? "" : " " + style.color)}</Text>
      </Box>,
    );
  }
  void leaves;
  return (
    <Box flexDirection="column">
      <GroupTitle title="Typography" accent={accent} />
      {rows}
    </Box>
  );
}

function ShapeRow({ system, accent }: SheetProps) {
  const shape = system.tokens.shape;
  return (
    <Box flexDirection="row">
      <Box width={12}>
        <GroupTitle title="Shape" accent={accent} />
      </Box>
      <Box marginRight={2}>
        <Text>
          <Mark assigned={isAssigned(system, "shape.fieldBorder")} accent={accent} />
          {"fieldBorder "}
          <Text bold>{shape.fieldBorder}</Text>
        </Text>
      </Box>
      <Box>
        <Text>
          <Mark assigned={isAssigned(system, "shape.cardBorder")} accent={accent} />
          {"cardBorder "}
          <Text bold>{shape.cardBorder}</Text>
        </Text>
      </Box>
    </Box>
  );
}

const TokenSheetSchema = z.object({});

function TokenSheetRenderer() {
  const system = useDesignSystem();
  const leaves = indexLeaves(system);
  const accent =
    system.tokens.color.primitive.primary[500] === ""
      ? undefined
      : system.tokens.color.primitive.primary[500];
  const accentColor = accent ?? "cyan";
  const props: SheetProps = { system, leaves, accent: accentColor };
  return (
    <Box flexDirection="column" gap={1}>
      <Text>
        <Text bold>{"Mode "}</Text>
        {system.tokens.mode}
        <Text dimColor>{"   "}</Text>
        <Text color={accentColor}>{SET_MARK}</Text>
        {" set by the theme   "}
        <Text dimColor>{DEFAULT_MARK}</Text>
        {" default or derived   "}
        <Text dimColor>{`${system.assigned.length} tokens set`}</Text>
      </Text>
      <PrimitiveRows {...props} />
      <SemanticRows {...props} />
      <NumberRow {...props} title="Spacing" group="spacing" />
      <NumberRow {...props} title="Grid" group="grid" />
      <TypographyRows {...props} />
      <ShapeRow {...props} />
    </Box>
  );
}

export const TokenSheet = defineComponent({
  name: "TokenSheet",
  props: TokenSheetSchema,
  description:
    "The design tokens of the active design system, group by group, marking the ones the theme set itself.",
  component: TokenSheetRenderer,
});

/** The default library plus the token sheet. */
export const tokensLibrary: Library = createLibrary({
  root: "Stack",
  componentGroups: inkLibrary.componentGroups,
  components: Object.values(inkLibrary.components).concat([TokenSheet]),
});
