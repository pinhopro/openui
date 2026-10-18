import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import { useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { isElementValue } from "../element-node";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TabsSchema } from "../schemas/tabs-schema";
import { horizontalStep } from "./arrow-keys";
import { clampIndex, stepIndex } from "./step-index";

type TabsProps = z.infer<typeof TabsSchema>;

/** The TabItem elements of the strip; anything else the model wrote is skipped. */
function tabItems(items: unknown): ElementNode[] {
  const result: ElementNode[] = [];
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    if (!isElementValue(item)) continue;
    if (typeof item.props["value"] !== "string") continue;
    result.push(item);
  }
  return result;
}

function triggerText(item: ElementNode): string {
  const trigger = item.props["trigger"];
  if (trigger === null || trigger === undefined) return String(item.props["value"]);
  return String(trigger);
}

interface TabStripProps {
  items: ElementNode[];
  activeIndex: number;
  onStep: (delta: number) => void;
}

/**
 * The focusable line of triggers: the active one bold and underlined, inverted
 * while focused. It owns the focus hook and is rendered before the content so
 * Ink's focus order (effect order) visits the strip before any button inside
 * the active tab.
 */
function TabStrip({ items, activeIndex, onStep }: TabStripProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });

  useInput(
    function handleTabsKey(_input, key) {
      const delta = horizontalStep(key);
      if (delta !== 0) onStep(delta);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const segments: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as ElementNode;
    const isActive = index === activeIndex;
    segments.push(
      <Text
        key={index}
        inverse={isActive && focusable.isFocused}
        bold={isActive}
        underline={isActive}
        dimColor={!isActive}
      >
        {" " + triggerText(item) + " "}
      </Text>,
    );
  }
  return <Text>{segments}</Text>;
}

/** A tab strip over its items; only the active tab's content is mounted. */
function TabsRenderer({ props, renderNode }: ComponentRenderProps<TabsProps>) {
  const items = tabItems(props.items);
  const [activeIndex, setActiveIndex] = useState(0);
  const current = clampIndex(activeIndex, items.length);

  // Functional updates keep several keys from one stdin chunk in sequence.
  function step(delta: number): void {
    setActiveIndex(function move(previous) {
      return stepIndex(clampIndex(previous, items.length), items.length, delta);
    });
  }

  if (items.length === 0) return null;
  const active = items[current] as ElementNode;
  return (
    <Box flexDirection="column">
      <TabStrip items={items} activeIndex={current} onStep={step} />
      <Box flexDirection="column">{renderNode(active.props["content"])}</Box>
    </Box>
  );
}

export const Tabs = defineComponent({
  name: "Tabs",
  props: TabsSchema,
  description: "Tabbed container",
  component: TabsRenderer,
});
