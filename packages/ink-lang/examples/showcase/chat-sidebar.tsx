/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { z } from "zod/v4";
import { displayText } from "../../src/components/pad";
import { useComponentStyle } from "../../src/design/design-system-context";
import { isElementValue } from "../../src/element-node";
import { defineComponent, type ComponentRenderProps } from "../../src/library";
import { reactive } from "../../src/reactive";
import { textProps } from "../../src/theme-styles";
import { useStateField } from "../../src/use-state-field";
import { ChatContact } from "./chat-contact";
import { ChatGlyphButton } from "./chat-glyph-button";
import { ChatSelectionContext, type ChatSelection } from "./chat-selection";

/** The width of the chat list column, border-less, with a cell of padding on each side. */
export const SIDEBAR_WIDTH = 36;

const ChatSidebarSchema = z.object({
  contacts: z.array(ChatContact.ref),
  value: reactive(
    z.string().optional().describe("A $binding that holds the selected contact's value"),
  ),
  newChatAction: z.any().optional(),
  menuAction: z.any().optional(),
});

type ChatSidebarProps = z.infer<typeof ChatSidebarSchema>;

/** The search field, as the Input component draws it. */
const SEARCH_FIELD: unknown = {
  type: "element",
  typeName: "Input",
  props: { name: "search", placeholder: "Search or start a new chat" },
  partial: false,
};

/** The All / Unread / Groups filter, as the Chips component draws it. */
const FILTER_CHIPS: unknown = {
  type: "element",
  typeName: "Chips",
  props: {
    name: "filter",
    type: "single",
    items: [
      {
        type: "element",
        typeName: "ChipItem",
        props: { value: "all", label: "All" },
        partial: false,
      },
      {
        type: "element",
        typeName: "ChipItem",
        props: { value: "unread", label: "Unread" },
        partial: false,
      },
      {
        type: "element",
        typeName: "ChipItem",
        props: { value: "groups", label: "Groups" },
        partial: false,
      },
    ],
    defaultValue: "all",
  },
  partial: false,
};

/**
 * The left column of the chat: the Chats title with new-chat and menu
 * buttons, the search field, the filter chips and the contact rows. The
 * selected contact lives in the `value` binding; a row click or Enter
 * selects it.
 */
function ChatSidebarRenderer({ props, renderNode }: ComponentRenderProps<ChatSidebarProps>) {
  const field = useStateField<unknown>("chat", props.value);
  const panel = useComponentStyle();
  const title = useComponentStyle(["title"]);
  const contacts = Array.isArray(props.contacts) ? props.contacts : [];
  const selection: ChatSelection = {
    selected: displayText(field.value),
    select: function select(value) {
      field.setValue(value);
    },
  };
  const rows: ReactNode[] = [];
  for (let index = 0; index < contacts.length; index += 1) {
    const contact = contacts[index];
    if (!isElementValue(contact)) continue;
    rows.push(<Box key={index}>{renderNode(contact)}</Box>);
  }
  return (
    <ChatSelectionContext.Provider value={selection}>
      <Box
        flexDirection="column"
        width={SIDEBAR_WIDTH}
        flexShrink={0}
        paddingX={1}
        backgroundColor={panel.box.background}
      >
        <Box flexDirection="row" justifyContent="space-between">
          <Text {...textProps(title.text)} bold={title.text.bold ?? true}>
            {" Chats"}
          </Text>
          <Box flexDirection="row">
            <ChatGlyphButton glyph="⊕" name="New chat" action={props.newChatAction} />
            <ChatGlyphButton glyph="⋮" name="Menu" action={props.menuAction} />
          </Box>
        </Box>
        {renderNode(SEARCH_FIELD)}
        <Box marginTop={0}>{renderNode(FILTER_CHIPS)}</Box>
        <Box flexDirection="column" marginTop={1}>
          {rows}
        </Box>
      </Box>
    </ChatSelectionContext.Provider>
  );
}

export const ChatSidebar = defineComponent({
  name: "ChatSidebar",
  props: ChatSidebarSchema,
  description:
    "The chat list column: title with new-chat and menu buttons, a search field, filter chips and the ChatContact rows; value is a $binding with the selected contact.",
  component: ChatSidebarRenderer,
});
