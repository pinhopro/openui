/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import { z } from "zod/v4";
import { isPressKey } from "../../src/components/button-keys";
import { displayText } from "../../src/components/pad";
import { useIsStreaming, useTriggerAction } from "../../src/context";
import { useComponentStyle } from "../../src/design/design-system-context";
import { useFocusable } from "../../src/focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../../src/library";
import { textProps } from "../../src/theme-styles";
import { AVATAR_TEXT, avatarBlock, avatarColor } from "./chat-avatar";
import { contactLines, type ContactReceipt } from "./chat-contact-lines";
import { useChatSelection } from "./chat-selection";

/** Cells of the two text lines beside the avatar (the sidebar is 36 wide: padding, marker, avatar, space). */
export const CONTACT_TEXT_WIDTH = 28;

const FOCUS_MARKER = "▌";

const ChatContactSchema = z.object({
  value: z.string().describe("What selecting this contact stores in the list's binding"),
  initials: z.string(),
  name: z.string(),
  preview: z.string().describe("The last message, prefixed with the sender in a group"),
  time: z.string(),
  unread: z.number().optional(),
  pinned: z.boolean().optional(),
  muted: z.boolean().optional(),
  receipt: z
    .enum(["sent", "delivered", "read"])
    .optional()
    .describe("Ticks before the preview when the user sent the last message"),
  action: z.any().optional(),
});

type ChatContactProps = z.infer<typeof ChatContactSchema>;

function ChatContactRenderer({ props }: ComponentRenderProps<ChatContactProps>) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();
  const selection = useChatSelection();
  const name = displayText(props.name);
  const value = displayText(props.value);
  const selected = selection.selected === value;
  const unread = typeof props.unread === "number" ? props.unread : 0;
  const receipt = props.receipt as ContactReceipt | undefined;

  function open(): void {
    selection.select(value);
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
  const classes: string[] = [];
  if (selected) classes.push("selected");
  if (unread > 0) classes.push("unread");
  if (props.muted === true) classes.push("muted");
  const row = useComponentStyle(classes, states);
  const nameStyle = useComponentStyle(classes.concat("name"), states);
  const timeStyle = useComponentStyle(classes.concat("time"), states);
  const pinStyle = useComponentStyle(classes.concat("pin"), states);
  const ticksStyle = useComponentStyle(classes.concat("ticks", receipt ?? "none"), states);
  const previewStyle = useComponentStyle(classes.concat("preview"), states);
  const muteStyle = useComponentStyle(classes.concat("mute"), states);
  const badgeStyle = useComponentStyle(classes.concat("badge"), states);
  const lines = contactLines(
    {
      name,
      preview: displayText(props.preview),
      time: displayText(props.time),
      unread,
      pinned: props.pinned === true,
      muted: props.muted === true,
      receipt,
    },
    CONTACT_TEXT_WIDTH,
  );
  const initials = displayText(props.initials);
  const avatar = avatarColor(initials);
  const marker = focusable.isFocused ? FOCUS_MARKER : " ";
  return (
    <Box ref={focusable.ref} flexDirection="column" backgroundColor={row.box.background}>
      <Text>
        <Text {...textProps(row.text)}>{marker}</Text>
        <Text backgroundColor={avatar} color={AVATAR_TEXT} bold>
          {avatarBlock(initials)}
        </Text>
        <Text {...textProps(row.text)}> </Text>
        <Text {...textProps(nameStyle.text)}>{lines.name}</Text>
        <Text {...textProps(pinStyle.text)}>{lines.pin}</Text>
        <Text {...textProps(timeStyle.text)}>{lines.time}</Text>
      </Text>
      <Text>
        <Text {...textProps(row.text)}> </Text>
        <Text backgroundColor={avatar}>{"    "}</Text>
        <Text {...textProps(row.text)}> </Text>
        <Text {...textProps(ticksStyle.text)}>{lines.ticks}</Text>
        <Text {...textProps(previewStyle.text)}>{lines.preview}</Text>
        <Text {...textProps(muteStyle.text)}>{lines.mute}</Text>
        <Text {...textProps(badgeStyle.text)}>{lines.badge}</Text>
      </Text>
    </Box>
  );
}

export const ChatContact = defineComponent({
  name: "ChatContact",
  props: ChatContactSchema,
  description:
    "One conversation in the chat list: value, initials, name, last message preview, time, unread count, pinned and muted flags, the receipt of the user's last message and the action that opens it.",
  component: ChatContactRenderer,
});
