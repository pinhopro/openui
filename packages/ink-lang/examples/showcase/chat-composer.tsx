/** @jsxRuntime automatic @jsxImportSource react */
import { Box } from "ink";
import { z } from "zod/v4";
import { displayText } from "../../src/components/pad";
import { useComponentStyle } from "../../src/design/design-system-context";
import { defineComponent, type ComponentRenderProps } from "../../src/library";
import { reactive } from "../../src/reactive";
import { useStateField } from "../../src/use-state-field";
import { ChatGlyphButton } from "./chat-glyph-button";

const ChatComposerSchema = z.object({
  draft: reactive(
    z.string().optional().describe("A $binding that holds the message being written"),
  ),
  sendAction: z.any().optional(),
  attachAction: z.any().optional(),
  emojiAction: z.any().optional(),
});

type ChatComposerProps = z.infer<typeof ChatComposerSchema>;

/**
 * The composer at the bottom: emoji and attach buttons, the message field
 * bound to `draft`, and a send button while there is a draft (a microphone
 * button otherwise), like a chat app's.
 */
function ChatComposerRenderer({ props, renderNode }: ComponentRenderProps<ChatComposerProps>) {
  const field = useStateField<unknown>("draft", props.draft);
  const bar = useComponentStyle();
  const draft = displayText(field.value);
  const input: unknown = {
    type: "element",
    typeName: "Input",
    props: { name: "draft", placeholder: "Type a message", value: props.draft },
    partial: false,
  };
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingX={1}
      gap={1}
      backgroundColor={bar.box.background}
    >
      <ChatGlyphButton glyph="☺" name="Emoji" action={props.emojiAction} order={0} />
      <ChatGlyphButton glyph="⊕" name="Attach" action={props.attachAction} order={1} />
      <Box flexGrow={1} flexDirection="column">
        {renderNode(input, { order: 2 })}
      </Box>
      {draft === "" ? (
        <ChatGlyphButton glyph="◉" name="Voice message" classes={["mic"]} order={3} />
      ) : (
        <ChatGlyphButton
          glyph="➤"
          name="Send"
          action={props.sendAction}
          classes={["send"]}
          order={3}
        />
      )}
    </Box>
  );
}

export const ChatComposer = defineComponent({
  name: "ChatComposer",
  props: ChatComposerSchema,
  description:
    "The message composer: emoji and attach buttons, the message field bound to draft, and Send (or a microphone while the draft is empty).",
  component: ChatComposerRenderer,
});
