/** @jsxRuntime automatic @jsxImportSource react */
import { Box } from "ink";
import { z } from "zod/v4";
import { useComponentStyle } from "../../src/design/design-system-context";
import { defineComponent, type ComponentRenderProps } from "../../src/library";

const ChatConversationSchema = z.object({
  children: z.array(z.any()).describe("ChatHeader, ChatMessages and ChatComposer, top to bottom"),
});

type ChatConversationProps = z.infer<typeof ChatConversationSchema>;

/** The right column: it grows to fill the room beside the sidebar and stacks its children. */
function ChatConversationRenderer({
  props,
  renderNode,
}: ComponentRenderProps<ChatConversationProps>) {
  const panel = useComponentStyle();
  return (
    <Box flexDirection="column" flexGrow={1} minWidth={0} backgroundColor={panel.box.background}>
      {renderNode(props.children)}
    </Box>
  );
}

export const ChatConversation = defineComponent({
  name: "ChatConversation",
  props: ChatConversationSchema,
  description: "The conversation column beside the chat list: header, messages and composer.",
  component: ChatConversationRenderer,
});
