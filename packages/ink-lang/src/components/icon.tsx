import { Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { IconSchema } from "../schemas/icon-schema";
import { displayText } from "./pad";

type IconProps = z.infer<typeof IconSchema>;

/** The placeholder text of an icon: its name in angle brackets. */
export function iconText(icon: unknown): string {
  if (typeof icon !== "object" || icon === null) return "";
  const props = (icon as { props?: Record<string, unknown> }).props;
  const name = displayText(props?.["name"]);
  if (name === "") return "";
  return "<" + name + ">";
}

/** Terminals have no icon fonts: the icon shows as its dim name in angle brackets. */
function IconRenderer({ props }: ComponentRenderProps<IconProps>) {
  const name = displayText(props.name);
  if (name === "") return null;
  return <Text dimColor>{"<" + name + ">"}</Text>;
}

export const Icon = defineComponent({
  name: "Icon",
  props: IconSchema,
  description:
    "A lucide icon by kebab-case name (e.g. 'circle-check'). Optional category picks a topical fallback when the name doesn't resolve.",
  component: IconRenderer,
});
