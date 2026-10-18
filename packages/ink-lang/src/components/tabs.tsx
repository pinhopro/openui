import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { isElementValue } from "../element-node";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { TabsSchema } from "../schemas/tabs-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
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

interface TabTriggerProps {
  item: ElementNode;
  index: number;
  isActive: boolean;
  isFocused: boolean;
  onSelect: (index: number) => void;
}

/** One trigger of the strip; a click on it selects its tab. */
function TabTrigger({ item, index, isActive, isFocused, onSelect }: TabTriggerProps) {
  const theme = useTheme();
  const boxRef = useRef<DOMElement | null>(null);
  const cursorStyle = isActive && isFocused ? textProps(theme.focusRing) : textProps({});
  useMouse(boxRef, {
    onClick: function handleClick() {
      onSelect(index);
    },
  });
  return (
    <Box ref={boxRef}>
      <Text {...cursorStyle} bold={isActive} underline={isActive} dimColor={!isActive}>
        {" " + triggerText(item) + " "}
      </Text>
    </Box>
  );
}

interface TabStripProps {
  items: ElementNode[];
  activeIndex: number;
  onStep: (delta: number) => void;
  onSelect: (index: number) => void;
}

/**
 * The focusable line of triggers: the active one bold and underlined, inverted
 * while focused. It owns the focus hook and is rendered before the content so
 * Ink's focus order (effect order) visits the strip before any button inside
 * the active tab. A click selects a trigger; the wheel over the strip steps.
 */
function TabStrip({ items, activeIndex, onStep, onSelect }: TabStripProps) {
  const isStreaming = useIsStreaming();
  const active = items[activeIndex];
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: active === undefined ? "" : triggerText(active),
    // Left and Right switch tabs until the first or last one; there they move focus.
    arrows: function claims(direction) {
      if (direction === "left") return activeIndex > 0;
      if (direction === "right") return activeIndex < items.length - 1;
      return false;
    },
    mouse: {
      onWheel: function handleWheel(event) {
        if (isStreaming) return;
        onStep(event.direction === "up" || event.direction === "left" ? -1 : 1);
      },
    },
  });

  useInput(
    function handleTabsKey(_input, key) {
      const delta = horizontalStep(key);
      if (delta !== 0) onStep(delta);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  function select(index: number): void {
    if (isStreaming) return;
    focusable.focus();
    onSelect(index);
  }

  const triggers: ReactNode[] = [];
  for (let index = 0; index < items.length; index += 1) {
    triggers.push(
      <TabTrigger
        key={index}
        item={items[index] as ElementNode}
        index={index}
        isActive={index === activeIndex}
        isFocused={focusable.isFocused}
        onSelect={select}
      />,
    );
  }
  return (
    <Box ref={focusable.ref} flexDirection="row">
      {triggers}
    </Box>
  );
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

  function select(index: number): void {
    setActiveIndex(clampIndex(index, items.length));
  }

  if (items.length === 0) return null;
  const active = items[current] as ElementNode;
  return (
    <Box flexDirection="column">
      <TabStrip items={items} activeIndex={current} onStep={step} onSelect={select} />
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
