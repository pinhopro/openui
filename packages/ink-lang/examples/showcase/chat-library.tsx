import { inkLibrary } from "../../src/default-library";
import { createLibrary, type Library } from "../../src/library";
import { ChatComposer } from "./chat-composer";
import { ChatContact } from "./chat-contact";
import { ChatConversation } from "./chat-conversation";
import { ChatHeader } from "./chat-header";
import { ChatAttachment, ChatMessage } from "./chat-message";
import { ChatDateDivider, ChatMessages, ChatTyping } from "./chat-messages";
import { ChatSidebar } from "./chat-sidebar";

/*
 * The chat product's own components, defined the way a team extends the
 * library: a Zod schema per component, a renderer that reads its style parts
 * from the design-system cascade (`ChatMessage.sent .bubble`...) and the same
 * focus and mouse hooks the built-in components use.
 */

/** The default library plus the chat components. */
export const chatLibrary: Library = createLibrary({
  root: "Stack",
  componentGroups: inkLibrary.componentGroups,
  components: Object.values(inkLibrary.components).concat([
    ChatSidebar,
    ChatContact,
    ChatConversation,
    ChatHeader,
    ChatMessages,
    ChatDateDivider,
    ChatMessage,
    ChatAttachment,
    ChatTyping,
    ChatComposer,
  ]),
});
