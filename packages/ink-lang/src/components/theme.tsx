import { Box } from "ink";
import { useMemo } from "react";
import type { z } from "zod/v4";
import { createDesignSystem, type DesignSystemInput } from "../design/design-system";
import { DesignSystemContext, useDesignSystem } from "../design/design-system-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ThemeSchema } from "../schemas/theme-schema";
import { ThemeContext } from "../theme";

type ThemeProps = z.infer<typeof ThemeSchema>;

/** The tokens prop as the design system takes it: an object, or nothing. */
function tokenInput(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/**
 * A design system for a subtree, declared by the program itself: the tokens
 * (and the mode they name) plus a stylesheet, resolved into a cascade that
 * every component below reads. The host stylesheet of the renderer does not
 * carry into it; the subtree starts from the defaults.
 */
function ThemeRenderer({ props, renderNode }: ComponentRenderProps<ThemeProps>) {
  const parent = useDesignSystem();
  const tokens = props.tokens;
  const css = typeof props.css === "string" ? props.css : "";
  const system = useMemo(
    function buildSystem() {
      const input: DesignSystemInput = { tokens: tokenInput(tokens), css };
      return createDesignSystem(input);
    },
    [tokens, css],
  );
  const active = Object.keys(tokenInput(tokens)).length === 0 && css === "" ? parent : system;
  return (
    <DesignSystemContext.Provider value={active}>
      <ThemeContext.Provider value={active.theme}>
        <Box flexDirection="column">{renderNode(props.children)}</Box>
      </ThemeContext.Provider>
    </DesignSystemContext.Provider>
  );
}

export const Theme = defineComponent({
  name: "Theme",
  props: ThemeSchema,
  description:
    "Applies a design system to its children: tokens (primitive and semantic colors, spacing, grid, typography, shape, light/dark mode) and an optional CSS-subset stylesheet.",
  component: ThemeRenderer,
});
