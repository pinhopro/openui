/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text } from "ink";
import { z } from "zod/v4";
import { displayText } from "../../src/components/pad";
import { useComponentStyle } from "../../src/design/design-system-context";
import { defineComponent, type ComponentRenderProps } from "../../src/library";
import { textProps } from "../../src/theme-styles";
import { AVATAR_TEXT, avatarBlock, avatarColor } from "./chat-avatar";
import { ChatGlyphButton } from "./chat-glyph-button";

const ChatHeaderSchema = z.object({
  initials: z.string(),
  name: z.string(),
  status: z.string().describe('"online", "typing...", "last seen today at 10:42"'),
  callAction: z.any().optional(),
  searchAction: z.any().optional(),
  menuAction: z.any().optional(),
});

type ChatHeaderProps = z.infer<typeof ChatHeaderSchema>;

/** The conversation header: avatar, name and presence on the left; call, search and menu buttons on the right. */
function ChatHeaderRenderer({ props }: ComponentRenderProps<ChatHeaderProps>) {
  const bar = useComponentStyle();
  const name = useComponentStyle(["name"]);
  const status = useComponentStyle(["status"]);
  const initials = displayText(props.initials);
  const avatar = avatarColor(initials);
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      backgroundColor={bar.box.background}
    >
      <Box flexDirection="row">
        <Box flexDirection="column">
          <Text backgroundColor={avatar} color={AVATAR_TEXT} bold>
            {avatarBlock(initials)}
          </Text>
          <Text backgroundColor={avatar}>{"    "}</Text>
        </Box>
        <Box flexDirection="column" marginLeft={1}>
          <Text {...textProps(name.text)} bold={name.text.bold ?? true}>
            {displayText(props.name)}
          </Text>
          <Text {...textProps(status.text)}>{displayText(props.status)}</Text>
        </Box>
      </Box>
      <Box flexDirection="row" gap={1}>
        <ChatGlyphButton glyph="✆" name="Call" action={props.callAction} order={0} />
        <ChatGlyphButton glyph="⌕" name="Search in chat" action={props.searchAction} order={1} />
        <ChatGlyphButton glyph="⋮" name="Chat menu" action={props.menuAction} order={2} />
      </Box>
    </Box>
  );
}

export const ChatHeader = defineComponent({
  name: "ChatHeader",
  props: ChatHeaderSchema,
  description:
    "The conversation header: initials, name, presence status and the call, search and menu buttons with their actions.",
  component: ChatHeaderRenderer,
});
