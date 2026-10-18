/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import type { ReactNode } from "react";
import { z } from "zod/v4";
import { isPressKey } from "../../src/components/button-keys";
import { displayText } from "../../src/components/pad";
import { useIsStreaming, useTriggerAction } from "../../src/context";
import { inkLibrary } from "../../src/default-library";
import { useComponentStyle } from "../../src/design/design-system-context";
import { isElementValue } from "../../src/element-node";
import { useFocusable } from "../../src/focus/use-focusable";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import { textProps } from "../../src/theme-styles";
import { useStateField } from "../../src/use-state-field";
import { contactLines } from "./chat-contact-lines";

/** Cells inside the contact list for one row (the list is 38 wide with a border and padding). */
const CONTACT_WIDTH = 34;

/*
 * The chat product's own components, defined the way a team extends the
 * library: a Zod schema per component, a renderer that reads its style parts
 * from the design-system cascade (`ChatMessage.sent .bubble`...) and the same
 * focus and mouse hooks the built-in components use.
 */

const ChatContactSchema = z.object({
  initials: z.string(),
  name: z.string(),
  preview: z.string(),
  time: z.string(),
  unread: z.number().optional(),
  selected: z.boolean().optional(),
  action: z.any().optional(),
});

type ChatContactProps = z.infer<typeof ChatContactSchema>;

function ChatContactRenderer({ props }: ComponentRenderProps<ChatContactProps>) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();
  const name = displayText(props.name);
  const selected = props.selected === true;
  const unread = typeof props.unread === "number" ? props.unread : 0;

  function open(): void {
    void triggerAction(name, undefined, props.action as unknown as ActionPlan | null | undefined);
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
  const classes = selected ? ["selected"] : [];
  const row = useComponentStyle(classes, states);
  const nameStyle = useComponentStyle(classes.concat("name"), states);
  const previewStyle = useComponentStyle(classes.concat("preview"), states);
  const timeStyle = useComponentStyle(classes.concat("time"), states);
  const unreadStyle = useComponentStyle(classes.concat("unread"), states);
  const marker = focusable.isFocused ? "▌" : selected ? "▎" : " ";
  const lines = contactLines(
    {
      marker,
      initials: displayText(props.initials),
      name,
      preview: displayText(props.preview),
      time: displayText(props.time),
      unread,
    },
    CONTACT_WIDTH,
  );
  return (
    <Box ref={focusable.ref} flexDirection="column" backgroundColor={row.box.background}>
      <Text>
        <Text {...textProps(row.text)}>{lines.marker + lines.initials + " "}</Text>
        <Text {...textProps(nameStyle.text)} bold={nameStyle.text.bold ?? selected}>
          {lines.name}
        </Text>
        <Text {...textProps(timeStyle.text)} dimColor={timeStyle.text.dim ?? true}>
          {lines.time}
        </Text>
      </Text>
      <Text>
        {"    "}
        <Text {...textProps(previewStyle.text)} dimColor={previewStyle.text.dim ?? true}>
          {lines.preview}
        </Text>
        {lines.badge === "" ? null : <Text {...textProps(unreadStyle.text)}>{lines.badge}</Text>}
      </Text>
    </Box>
  );
}

export const ChatContact = defineComponent({
  name: "ChatContact",
  props: ChatContactSchema,
  description:
    "One conversation in the contact list: initials, name, last message preview, time, unread count, selected flag and the action that opens it.",
  component: ChatContactRenderer,
});

const ChatContactListSchema = z.object({
  contacts: z.array(ChatContact.ref),
  unreadChats: z.number().optional(),
});

type ChatContactListProps = z.infer<typeof ChatContactListSchema>;

function ChatContactListRenderer({
  props,
  renderNode,
}: ComponentRenderProps<ChatContactListProps>) {
  const contacts = Array.isArray(props.contacts) ? props.contacts : [];
  const title = useComponentStyle(["title"]);
  const count = useComponentStyle(["count"]);
  const items: ReactNode[] = [];
  for (let index = 0; index < contacts.length; index += 1) {
    const contact = contacts[index];
    if (!isElementValue(contact)) continue;
    items.push(<Box key={index}>{renderNode(contact)}</Box>);
  }
  const unread = typeof props.unreadChats === "number" ? props.unreadChats : 0;
  return (
    <Box
      flexDirection="column"
      width={38}
      flexShrink={0}
      borderStyle="single"
      borderDimColor
      paddingX={1}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Text {...textProps(title.text)} bold={title.text.bold ?? true}>
          Conversations
        </Text>
        <Text {...textProps(count.text)} dimColor={count.text.dim ?? true}>
          {`${contacts.length} chats`}
        </Text>
      </Box>
      <Text dimColor>{unread > 0 ? `All  Unread · ${unread}` : "All"}</Text>
      <Box flexDirection="column" marginTop={1} gap={1}>
        {items}
      </Box>
    </Box>
  );
}

export const ChatContactList = defineComponent({
  name: "ChatContactList",
  props: ChatContactListSchema,
  description: "The left column of the chat: a title, a filter line and the ChatContact rows.",
  component: ChatContactListRenderer,
});

const ChatHeaderSchema = z.object({
  name: z.string(),
  subtitle: z.string(),
  status: z.string(),
  menu: z.any().optional(),
});

type ChatHeaderProps = z.infer<typeof ChatHeaderSchema>;

function ChatHeaderRenderer({ props, renderNode }: ComponentRenderProps<ChatHeaderProps>) {
  const name = useComponentStyle(["name"]);
  const subtitle = useComponentStyle(["subtitle"]);
  const status = useComponentStyle(["status"]);
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      borderStyle="single"
      borderDimColor
      paddingX={1}
    >
      <Box flexDirection="column">
        <Text {...textProps(name.text)} bold={name.text.bold ?? true}>
          {displayText(props.name)}
        </Text>
        <Text {...textProps(subtitle.text)} dimColor={subtitle.text.dim ?? true}>
          {displayText(props.subtitle)}
        </Text>
      </Box>
      <Box flexDirection="row" gap={2} alignItems="flex-start">
        <Text {...textProps(status.text)}>{"● " + displayText(props.status)}</Text>
        {isElementValue(props.menu) ? renderNode(props.menu) : null}
      </Box>
    </Box>
  );
}

export const ChatHeader = defineComponent({
  name: "ChatHeader",
  props: ChatHeaderSchema,
  description:
    "The conversation header: name, subtitle, presence status and an optional menu button.",
  component: ChatHeaderRenderer,
});

const ChatContextBarSchema = z.object({
  title: z.string(),
  meta: z.string(),
  action: z.any().optional(),
});

type ChatContextBarProps = z.infer<typeof ChatContextBarSchema>;

function ChatContextBarRenderer({ props }: ComponentRenderProps<ChatContextBarProps>) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();
  const bar = useComponentStyle();
  const title = useComponentStyle(["title"]);
  const meta = useComponentStyle(["meta"]);
  function open(): void {
    void triggerAction(
      "View in Files",
      undefined,
      props.action as unknown as ActionPlan | null | undefined,
    );
  }
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: displayText(props.title),
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
  return (
    <Box
      ref={focusable.ref}
      flexDirection="row"
      justifyContent="space-between"
      borderStyle={
        bar.box.border === undefined || bar.box.border === "none" ? "single" : bar.box.border
      }
      borderColor={bar.box.borderColor}
      borderDimColor={bar.box.borderColor === undefined}
      backgroundColor={bar.box.background}
      paddingX={1}
    >
      <Text wrap="truncate">
        <Text bold>{"▣ "}</Text>
        <Text {...textProps(title.text)}>{displayText(props.title)}</Text>
        <Text {...textProps(meta.text)} dimColor={meta.text.dim ?? true}>
          {"  " + displayText(props.meta)}
        </Text>
      </Text>
      <Text inverse={focusable.isFocused}>[ View in Files ]</Text>
    </Box>
  );
}

export const ChatContextBar = defineComponent({
  name: "ChatContextBar",
  props: ChatContextBarSchema,
  description: "A pinned document under the header: title, metadata and a View in Files action.",
  component: ChatContextBarRenderer,
});

const ChatMessageSchema = z.object({
  direction: z.enum(["Sent", "Received"]),
  kind: z.enum(["Text"]),
  text: z.string(),
  time: z.string(),
  receipt: z.enum(["Sent", "Delivered", "Read"]).optional(),
});

type ChatMessageProps = z.infer<typeof ChatMessageSchema>;

function ChatMessageRenderer({ props }: ComponentRenderProps<ChatMessageProps>) {
  const isSent = props.direction === "Sent";
  const classes = [isSent ? "sent" : "received"];
  const bubble = useComponentStyle(classes.concat("bubble"));
  const time = useComponentStyle(classes.concat("time"));
  const receipt = useComponentStyle(classes.concat("receipt"));
  const meta = displayText(props.time) + (props.receipt === undefined ? "" : "  " + props.receipt);
  return (
    <Box flexDirection="column" alignItems={isSent ? "flex-end" : "flex-start"}>
      <Box flexDirection="row" gap={1}>
        {isSent ? null : <Text dimColor>{"CR"}</Text>}
        <Box backgroundColor={bubble.box.background} paddingX={1}>
          <Text {...textProps(bubble.text)}>{displayText(props.text)}</Text>
        </Box>
      </Box>
      <Text>
        <Text {...textProps(time.text)} dimColor={time.text.dim ?? true}>
          {displayText(props.time)}
        </Text>
        {props.receipt === undefined ? null : (
          <Text {...textProps(receipt.text)}>{"  " + props.receipt}</Text>
        )}
      </Text>
      {meta === "" ? null : null}
    </Box>
  );
}

export const ChatMessage = defineComponent({
  name: "ChatMessage",
  props: ChatMessageSchema,
  description:
    'One message: direction "Sent" | "Received", kind "Text", the text, the time and an optional receipt ("Sent" | "Delivered" | "Read").',
  component: ChatMessageRenderer,
});

const ChatAttachmentCardSchema = z.object({
  name: z.string(),
  meta: z.string(),
  action: z.any().optional(),
});

type ChatAttachmentCardProps = z.infer<typeof ChatAttachmentCardSchema>;

function ChatAttachmentCardRenderer({ props }: ComponentRenderProps<ChatAttachmentCardProps>) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();
  const card = useComponentStyle();
  function open(): void {
    void triggerAction("Open", undefined, props.action as unknown as ActionPlan | null | undefined);
  }
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: displayText(props.name),
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
  return (
    <Box flexDirection="row" justifyContent="flex-end">
      <Box
        ref={focusable.ref}
        flexDirection="row"
        gap={2}
        borderStyle={
          card.box.border === undefined || card.box.border === "none" ? "single" : card.box.border
        }
        borderColor={card.box.borderColor}
        borderDimColor={card.box.borderColor === undefined}
        backgroundColor={card.box.background}
        paddingX={1}
      >
        <Box flexDirection="column">
          <Text bold>{"▣ " + displayText(props.name)}</Text>
          <Text dimColor>{"  " + displayText(props.meta)}</Text>
        </Box>
        <Text inverse={focusable.isFocused}>[ ⤓ Open ]</Text>
      </Box>
    </Box>
  );
}

export const ChatAttachmentCard = defineComponent({
  name: "ChatAttachmentCard",
  props: ChatAttachmentCardSchema,
  description: "A file shared in the conversation: name, metadata and an Open action.",
  component: ChatAttachmentCardRenderer,
});

const ChatComposerSchema = z.object({
  state: z.enum(["Empty", "Typing"]),
});

type ChatComposerProps = z.infer<typeof ChatComposerSchema>;

function ChatComposerRenderer({ props, renderNode }: ComponentRenderProps<ChatComposerProps>) {
  const field = useStateField<unknown>("draft");
  const hint = useComponentStyle(["hint"]);
  const draft = displayText(field.value);
  const composer: unknown = {
    type: "element",
    typeName: "Stack",
    props: {
      direction: "row",
      gap: "s",
      align: "center",
      children: [
        {
          type: "element",
          typeName: "IconButton",
          props: {
            name: "Attach",
            icon: {
              type: "element",
              typeName: "Icon",
              props: { name: "paperclip" },
              partial: false,
            },
            variant: "secondary",
          },
          partial: false,
        },
        {
          type: "element",
          typeName: "Input",
          props: { name: "draft", placeholder: "Write a message..." },
          partial: false,
        },
        {
          type: "element",
          typeName: "Button",
          props: { label: "Send", action: null, variant: draft === "" ? "secondary" : "primary" },
          partial: false,
        },
      ],
    },
    partial: false,
  };
  return (
    <Box flexDirection="column">
      {renderNode(composer)}
      <Text {...textProps(hint.text)} dimColor={hint.text.dim ?? true}>
        {props.state === "Typing" || draft !== ""
          ? "Enter to send · Shift+Enter for a line break"
          : "Enter to send · Shift+Enter for a line break"}
      </Text>
    </Box>
  );
}

export const ChatComposer = defineComponent({
  name: "ChatComposer",
  props: ChatComposerSchema,
  description:
    'The message composer: attach button, the message field and Send. state: "Empty" | "Typing".',
  component: ChatComposerRenderer,
});

/** The default library plus the chat components. */
export const chatLibrary: Library = createLibrary({
  root: "Stack",
  componentGroups: inkLibrary.componentGroups,
  components: Object.values(inkLibrary.components).concat([
    ChatContact,
    ChatContactList,
    ChatHeader,
    ChatContextBar,
    ChatMessage,
    ChatAttachmentCard,
    ChatComposer,
  ]),
});
