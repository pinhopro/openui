/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import type { ReactNode } from "react";
import { z } from "zod/v4";
import { isPressKey } from "../../src/components/button-keys";
import { displayText, padEnd } from "../../src/components/pad";
import { countGraphemes } from "../../src/components/text-editing";
import { useIsStreaming, useTriggerAction } from "../../src/context";
import { useComponentStyle } from "../../src/design/design-system-context";
import { isElementValue } from "../../src/element-node";
import { useFocusable } from "../../src/focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../../src/library";
import { textProps } from "../../src/theme-styles";
import { bubbleLines, metaWidth } from "./chat-bubble-lines";
import { cutText } from "./chat-contact-lines";

/** The widest a bubble's text gets (the message area is about 62 cells wide). */
export const BUBBLE_TEXT_WIDTH = 40;

const OPEN_LABEL = "[ Open ]";
const QUOTE_BAR = "▌ ";

const ChatAttachmentSchema = z.object({
  name: z.string(),
  meta: z.string().describe('"PDF · 8 pages · 1.2 MB"'),
  action: z.any().optional(),
});

type ChatAttachmentProps = z.infer<typeof ChatAttachmentSchema>;

/** A file card inside a bubble: name, metadata and an Open control that is a focus stop. */
function ChatAttachmentRenderer({ props }: ComponentRenderProps<ChatAttachmentProps>) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();
  const name = displayText(props.name);
  const card = useComponentStyle(["attachment"]);
  function open(): void {
    void triggerAction(
      "Open " + name,
      undefined,
      props.action as unknown as ActionPlan | null | undefined,
    );
  }
  const focusable = useFocusable({
    isActive: !isStreaming,
    name,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) open();
      },
    },
  });
  useInput(
    function handleKey(input, key) {
      if (isPressKey(input, key)) open();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  const states: string[] = [];
  if (focusable.isFocused) states.push("focus");
  if (focusable.isHovered) states.push("hover");
  const openStyle = useComponentStyle(["open"], states);
  return (
    <Box flexDirection="column" backgroundColor={card.box.background}>
      <Text {...textProps(card.text)} bold>
        {"▣ " + name}
      </Text>
      <Box flexDirection="row" justifyContent="space-between">
        <Text {...textProps(card.text)} dimColor={card.text.dim ?? true}>
          {"  " + displayText(props.meta) + " "}
        </Text>
        <Box ref={focusable.ref} backgroundColor={openStyle.box.background}>
          <Text {...textProps(openStyle.text)}>{OPEN_LABEL}</Text>
        </Box>
      </Box>
    </Box>
  );
}

export const ChatAttachment = defineComponent({
  name: "ChatAttachment",
  props: ChatAttachmentSchema,
  description: "A file shared inside a message bubble: name, metadata and an Open action.",
  component: ChatAttachmentRenderer,
});

const ChatMessageSchema = z.object({
  direction: z.enum(["sent", "received"]),
  text: z.string(),
  time: z.string(),
  receipt: z.enum(["sent", "delivered", "read"]).optional(),
  quote: z
    .object({ author: z.string(), text: z.string() })
    .nullable()
    .optional()
    .describe("The message this one replies to"),
  attachment: z.any().optional().describe("A ChatAttachment shown above the text"),
});

type ChatMessageProps = z.infer<typeof ChatMessageSchema>;

/** The ticks of a sent message: one when sent, two when delivered or read (read is colored by `.ticks.read`). */
function receiptTicks(receipt: string | undefined): string {
  if (receipt === "sent") return "✓";
  if (receipt === "delivered" || receipt === "read") return "✓✓";
  return "";
}

/** The cells an attachment card needs: its name line or its meta line with the Open control. */
function attachmentWidth(attachment: unknown): number {
  if (!isElementValue(attachment)) return 0;
  const name = countGraphemes("▣ " + displayText(attachment.props["name"]));
  const meta =
    countGraphemes("  " + displayText(attachment.props["meta"]) + " ") + OPEN_LABEL.length;
  return Math.min(BUBBLE_TEXT_WIDTH, Math.max(name, meta));
}

/**
 * One message bubble: the quoted message, the attachment and the text, with
 * the time and ticks after the last line. Sent bubbles sit on the right,
 * received ones on the left. The stylesheet addresses `ChatMessage.sent
 * .bubble`, `.quote`, `.quote .author`, `.time`, `.ticks.read`.
 */
function ChatMessageRenderer({ props, renderNode }: ComponentRenderProps<ChatMessageProps>) {
  const isSent = props.direction === "sent";
  const classes = [isSent ? "sent" : "received"];
  const bubble = useComponentStyle(classes.concat("bubble"));
  const timeStyle = useComponentStyle(classes.concat("time"));
  const ticksStyle = useComponentStyle(classes.concat("ticks", props.receipt ?? "none"));
  const quoteStyle = useComponentStyle(classes.concat("quote"));
  const authorStyle = useComponentStyle(classes.concat("quote", "author"));
  const time = displayText(props.time);
  const ticks = isSent ? receiptTicks(props.receipt) : "";
  const layout = bubbleLines(displayText(props.text), time, ticks, BUBBLE_TEXT_WIDTH);
  const quote = props.quote ?? undefined;
  const quoteWidth =
    quote === undefined
      ? 0
      : Math.min(
          BUBBLE_TEXT_WIDTH,
          Math.max(
            countGraphemes(QUOTE_BAR + displayText(quote.author)),
            countGraphemes(QUOTE_BAR + displayText(quote.text)),
          ),
        );
  const width = Math.max(layout.width, quoteWidth, attachmentWidth(props.attachment));
  const lines: ReactNode[] = [];
  const textLines = layout.metaOnOwnLine ? layout.lines : layout.lines.slice(0, -1);
  for (let index = 0; index < textLines.length; index += 1) {
    lines.push(
      <Text key={index} {...textProps(bubble.text)}>
        {padEnd(textLines[index] as string, width)}
      </Text>,
    );
  }
  const lastText = layout.metaOnOwnLine ? "" : (layout.lines[layout.lines.length - 1] ?? "");
  const gap = width - countGraphemes(lastText) - metaWidth(time, ticks);
  lines.push(
    <Text key="meta" {...textProps(bubble.text)}>
      {lastText + " ".repeat(Math.max(0, gap))}
      <Text {...textProps(timeStyle.text)}>{time}</Text>
      {ticks === "" ? null : <Text {...textProps(ticksStyle.text)}>{" " + ticks}</Text>}
    </Text>,
  );
  return (
    <Box flexDirection="row" justifyContent={isSent ? "flex-end" : "flex-start"}>
      <Box flexDirection="column" backgroundColor={bubble.box.background} paddingX={1}>
        {quote === undefined ? null : (
          <Box flexDirection="column" backgroundColor={quoteStyle.box.background}>
            <Text {...textProps(authorStyle.text)}>
              {padEnd(QUOTE_BAR + cutText(displayText(quote.author), width - 2), width)}
            </Text>
            <Text {...textProps(quoteStyle.text)}>
              {padEnd(QUOTE_BAR + cutText(displayText(quote.text), width - 2), width)}
            </Text>
          </Box>
        )}
        {isElementValue(props.attachment) ? (
          <Box width={width}>{renderNode(props.attachment)}</Box>
        ) : null}
        {lines}
      </Box>
    </Box>
  );
}

export const ChatMessage = defineComponent({
  name: "ChatMessage",
  props: ChatMessageSchema,
  description:
    'One message bubble: direction "sent" | "received", the text, the time, an optional receipt ("sent" | "delivered" | "read"), an optional quote {author, text} and an optional ChatAttachment.',
  component: ChatMessageRenderer,
});
