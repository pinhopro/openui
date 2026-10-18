import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { isElementValue } from "../element-node";
import { defineComponent, type ComponentRenderProps } from "../library";
import { StepsSchema } from "../schemas/steps-schema";
import { useTheme } from "../theme";
import { displayText } from "./pad";

type StepsProps = z.infer<typeof StepsSchema>;

/** Numbered steps: an accent number, a bold title and the dim details under it. */
function StepsRenderer({ props }: ComponentRenderProps<StepsProps>) {
  const theme = useTheme();
  const lines: ReactNode[] = [];
  const items = Array.isArray(props.items) ? props.items : [];
  let number = 0;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!isElementValue(item)) continue;
    const element = item as ElementNode;
    number += 1;
    const marker = `${number}.`;
    lines.push(
      <Text key={`${index}-title`}>
        <Text color={theme.accent}>{marker}</Text>
        <Text bold>{" " + displayText(element.props["title"])}</Text>
      </Text>,
    );
    const details = displayText(element.props["details"]);
    if (details !== "") {
      lines.push(
        <Text key={`${index}-details`} dimColor>
          {" ".repeat(marker.length + 1) + details}
        </Text>,
      );
    }
  }
  if (lines.length === 0) return null;
  return <Box flexDirection="column">{lines}</Box>;
}

export const Steps = defineComponent({
  name: "Steps",
  props: StepsSchema,
  description: "Step-by-step guide",
  component: StepsRenderer,
});
