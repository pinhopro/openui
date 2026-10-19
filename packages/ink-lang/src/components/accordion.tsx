import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import { useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { isElementValue } from "../element-node";
import { SequenceLevel } from "../focus/sequence-level";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { renderValue } from "../render-value";
import { AccordionSchema } from "../schemas/accordion-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { isPressKey } from "./button-keys";
import { displayText } from "./pad";

type AccordionProps = z.infer<typeof AccordionSchema>;

const CLOSED_MARK = "▸";
const OPEN_MARK = "▾";

interface SectionHeaderProps {
  trigger: string;
  /** The section's position: the header's order, which its content takes one level down. */
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

/** The focusable header line; it comes before any stop inside its open section. */
function SectionHeader({ trigger, index, isOpen, onToggle }: SectionHeaderProps) {
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: trigger,
    order: index,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) onToggle();
      },
    },
  });

  useInput(
    function handleHeaderKey(input, key) {
      if (isPressKey(input, key)) onToggle();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const ring = focusable.isFocused ? textProps(theme.focusRing) : textProps({});
  return (
    <Box ref={focusable.ref}>
      <Text {...ring} bold={isOpen ? true : ring.bold}>
        {(isOpen ? OPEN_MARK : CLOSED_MARK) + " " + trigger}
      </Text>
    </Box>
  );
}

interface SectionProps {
  item: ElementNode;
  index: number;
}

/**
 * One collapsible section; closed until its header is pressed. Its content
 * sits one level below the header's order, its items numbered from 0.
 */
function AccordionSection({ item, index }: SectionProps) {
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
      <SectionHeader trigger={title} index={index} isOpen={isOpen} onToggle={toggle} />
      {isOpen ? (
        <Box flexDirection="column" paddingLeft={2}>
          <SequenceLevel order={index}>{renderValue(item.props["content"])}</SequenceLevel>
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
    sections.push(<AccordionSection key={index} item={item} index={index} />);
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
