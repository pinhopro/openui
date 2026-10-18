import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import { useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming, useRenderNode } from "../context";
import { isElementValue } from "../element-node";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { AccordionSchema } from "../schemas/accordion-schema";
import { isPressKey } from "./button-keys";
import { displayText } from "./pad";

type AccordionProps = z.infer<typeof AccordionSchema>;

const CLOSED_MARK = "▸";
const OPEN_MARK = "▾";

interface SectionHeaderProps {
  trigger: string;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * The focusable header line. It is its own component, rendered before the
 * content, so Ink's focus order (effect order) visits it before any button
 * inside the open section.
 */
function SectionHeader({ trigger, isOpen, onToggle }: SectionHeaderProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });

  useInput(
    function handleHeaderKey(input, key) {
      if (isPressKey(input, key)) onToggle();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  return (
    <Text inverse={focusable.isFocused} bold={isOpen}>
      {(isOpen ? OPEN_MARK : CLOSED_MARK) + " " + trigger}
    </Text>
  );
}

interface SectionProps {
  item: ElementNode;
}

/** One collapsible section; closed until its header is pressed. */
function AccordionSection({ item }: SectionProps) {
  const renderNode = useRenderNode();
  const [isOpen, setIsOpen] = useState(false);

  function toggle(): void {
    setIsOpen(function flip(previous) {
      return !previous;
    });
  }

  const trigger = item.props["trigger"];
  const title = displayText(
    trigger === undefined || trigger === null ? item.props["value"] : trigger,
  );
  return (
    <Box flexDirection="column">
      <SectionHeader trigger={title} isOpen={isOpen} onToggle={toggle} />
      {isOpen ? (
        <Box flexDirection="column" paddingLeft={2}>
          {renderNode(item.props["content"])}
        </Box>
      ) : null}
    </Box>
  );
}

function AccordionRenderer({ props }: ComponentRenderProps<AccordionProps>) {
  const sections: ReactNode[] = [];
  const items = Array.isArray(props.items) ? props.items : [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!isElementValue(item)) continue;
    sections.push(<AccordionSection key={index} item={item} />);
  }
  if (sections.length === 0) return null;
  return <Box flexDirection="column">{sections}</Box>;
}

export const Accordion = defineComponent({
  name: "Accordion",
  props: AccordionSchema,
  description: "Collapsible sections",
  component: AccordionRenderer,
});
