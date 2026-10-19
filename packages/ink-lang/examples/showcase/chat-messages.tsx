/** @jsxRuntime automatic @jsxImportSource react */
import { Box, measureElement, Text, type DOMElement } from "ink";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { z } from "zod/v4";
import { displayText } from "../../src/components/pad";
import { useComponentStyle } from "../../src/design/design-system-context";
import { isElementValue } from "../../src/element-node";
import { defineComponent, type ComponentRenderProps } from "../../src/library";
import { useMouse } from "../../src/mouse/use-mouse";
import { textProps } from "../../src/theme-styles";

const DEFAULT_ROWS = 24;
const WHEEL_ROWS = 2;

interface ListView {
  /** True while the list shows the newest messages and moves with them. */
  following: boolean;
  offset: number;
}

const TAIL: ListView = { following: true, offset: 0 };

const ChatDateDividerSchema = z.object({ label: z.string() });

type ChatDateDividerProps = z.infer<typeof ChatDateDividerSchema>;

/** A centered pill with the day: `TODAY`, `YESTERDAY`, a date. */
function ChatDateDividerRenderer({ props }: ComponentRenderProps<ChatDateDividerProps>) {
  const pill = useComponentStyle(["pill"]);
  return (
    <Box justifyContent="center">
      <Text {...textProps(pill.text)} backgroundColor={pill.box.background ?? pill.text.background}>
        {" " + displayText(props.label).toUpperCase() + " "}
      </Text>
    </Box>
  );
}

export const ChatDateDivider = defineComponent({
  name: "ChatDateDivider",
  props: ChatDateDividerSchema,
  description: 'A date divider between messages: "Today", "Yesterday" or a date.',
  component: ChatDateDividerRenderer,
});

const ChatTypingSchema = z.object({});

/** A small received-side bubble with three dots: the other side is typing. */
function ChatTypingRenderer() {
  const bubble = useComponentStyle(["bubble"]);
  return (
    <Box flexDirection="row">
      <Box backgroundColor={bubble.box.background} paddingX={1}>
        <Text {...textProps(bubble.text)}>{"● ● ●"}</Text>
      </Box>
    </Box>
  );
}

export const ChatTyping = defineComponent({
  name: "ChatTyping",
  props: ChatTypingSchema,
  description: "The typing indicator: a small bubble with three dots on the received side.",
  component: ChatTypingRenderer,
});

const ChatMessagesSchema = z.object({
  children: z.array(z.any()).describe("ChatDateDivider, ChatMessage and ChatTyping, oldest first"),
  rows: z.number().optional().describe("Rows the list takes; it scrolls inside them (default 24)"),
});

type ChatMessagesProps = z.infer<typeof ChatMessagesSchema>;

/** The direction of a child when it is a message, so consecutive ones of one side group tightly. */
function directionOf(child: unknown): string {
  if (!isElementValue(child) || child.typeName !== "ChatMessage") return "";
  return displayText(child.props["direction"]);
}

/**
 * The scrollable message area: a fixed number of rows, the newest messages
 * at the bottom, the wheel scrolling back through older ones. Consecutive
 * messages from one side sit together; a change of side, a divider or the
 * typing indicator opens a one-row gap.
 */
function ChatMessagesRenderer({ props, renderNode }: ComponentRenderProps<ChatMessagesProps>) {
  const area = useComponentStyle();
  const rows = typeof props.rows === "number" && props.rows > 0 ? props.rows : DEFAULT_ROWS;
  const [view, setView] = useState<ListView>(TAIL);
  const [contentHeight, setContentHeight] = useState(0);
  const boxRef = useRef<DOMElement | null>(null);
  const contentRef = useRef<DOMElement | null>(null);
  const maxOffset = Math.max(0, contentHeight - rows);
  const offset = view.following ? maxOffset : Math.min(view.offset, maxOffset);

  useEffect(function measureContent() {
    const content = contentRef.current;
    if (content === null) return;
    const height = measureElement(content).height;
    setContentHeight(function keepIfSame(previous) {
      return previous === height ? previous : height;
    });
  });

  useMouse(boxRef, {
    onWheel: function handleWheel(event) {
      const up = event.direction === "up" || event.direction === "left";
      const next = up ? offset - event.ticks * WHEEL_ROWS : offset + event.ticks * WHEEL_ROWS;
      if (next >= maxOffset) {
        setView(TAIL);
        return;
      }
      setView({ following: false, offset: Math.max(0, next) });
    },
  });

  const children = Array.isArray(props.children) ? props.children : [];
  const items: ReactNode[] = [];
  let previousDirection = "";
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!isElementValue(child)) continue;
    const direction = directionOf(child);
    const grouped = direction !== "" && direction === previousDirection;
    items.push(
      <Box key={index} flexDirection="column" marginTop={index === 0 || grouped ? 0 : 1}>
        {renderNode(child)}
      </Box>,
    );
    previousDirection = direction;
  }
  return (
    <Box
      ref={boxRef}
      flexDirection="column"
      height={rows}
      flexShrink={0}
      paddingX={1}
      overflowY="hidden"
      backgroundColor={area.box.background}
      contentOffsetY={offset}
    >
      <Box ref={contentRef} flexDirection="column" flexShrink={0}>
        {items}
      </Box>
    </Box>
  );
}

export const ChatMessages = defineComponent({
  name: "ChatMessages",
  props: ChatMessagesSchema,
  description:
    "The scrollable message area: dividers, bubbles and the typing indicator in a fixed number of rows, newest at the bottom; the wheel scrolls back.",
  component: ChatMessagesRenderer,
});
