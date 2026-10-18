/**
 * A chat application screen, as a product team would write it for OpenUI:
 * contact list, conversation, composer and a destructive dialog, all inside
 * a Theme with the product's teal design system.
 */
export const chatProgram = [
  "$confirmDelete = false",
  "root = Theme(tokens, css, [chatOpenPage])",
  'tokens = {"color.primary": "#0f766e", "color.error": "#ea580c", "color.success": "#14b8a6", "color.neutral": "#64748b", "color.canvas.surface": "#ecfdf5", "color.text.value": "#0f172a", "color.text.helper": "#64748b", "color.text.placeholder": "#94a3b8", "color.border.default": "#99f6e4", "color.border.focus": "#0f766e", "shape.fieldBorder": "round", "shape.cardBorder": "round", "spacing.sm": 1}',
  'css = "ChatMessage.sent .bubble { background-color: #ccfbf1; color: #134e4a } ChatMessage.received .bubble { color: #0f172a } ChatMessage .time { color: #64748b } ChatMessage .receipt { color: #0f766e } ChatContact:focus { background-color: #ccfbf1 } ChatContact.selected .name { color: #0f766e; font-weight: bold } ChatContact .unread { color: #ffffff; background-color: #0f766e } ChatHeader .status { color: #14b8a6 } ChatContextBar { border: solid #99f6e4 } ChatAttachmentCard { border: solid #99f6e4 } ChatComposer Input { border: round #99f6e4 } Button:focus { background-color: #0f766e; color: #ffffff; filter: none }"',
  'chatOpenPage = Stack([chatSpace, deleteDialog], "column", "none")',
  'chatSpace = Stack([contactList, conversation], "row", "s", "stretch")',
  "contactList = ChatContactList([rowCarlosSelected, rowLegal, rowLaura, rowMiguel, rowAcme, rowSofia, rowSupport], 4)",
  'rowCarlosSelected = ChatContact("CR", "Carlos Ruiz", "Perfect, I\'ll review it now. Thanks!", "10:42", 0, true, @ToAssistant("Open the chat with Carlos Ruiz"))',
  'rowLegal = ChatContact("EL", "Legal team", "Lucía: The final version is ready.", "10:38", 3, false, @ToAssistant("Open the chat with the Legal team"))',
  'rowLaura = ChatContact("LG", "Laura Gómez", "Can you share the signed contract?", "10:25", 1, false, @ToAssistant("Open the chat with Laura Gómez"))',
  'rowMiguel = ChatContact("MT", "Miguel Torres", "You: Sent the documents.", "9:54 AM", 0, false, @ToAssistant("Open the chat with Miguel Torres"))',
  'rowAcme = ChatContact("PA", "Acme Project", "Diego: See you at 4:00 PM.", "Yesterday", 0, false, @ToAssistant("Open the Acme Project chat"))',
  'rowSofia = ChatContact("SH", "Sofía Herrera", "Thanks, Ana. All good.", "Yesterday", 0, false, @ToAssistant("Open the chat with Sofía Herrera"))',
  'rowSupport = ChatContact("SP", "Support", "Ticket #4821 was closed.", "Monday", 0, false, @ToAssistant("Open the Support chat"))',
  'conversation = Stack([header, contextBar, history, composer], "column", "s")',
  'header = ChatHeader("Carlos Ruiz", "Sales team", "Online", IconButton("Delete contact", Icon("trash"), @Set($confirmDelete, true), "secondary"))',
  'contextBar = ChatContextBar("Service agreement · Acme", "PDF · 8 pages · 1.2 MB", @ToAssistant("View the service agreement in Files"))',
  'history = Stack([dateDivider, msg1, msg2, msg3Text, msg3File, msg4, msg5], "column", "s")',
  'dateDivider = TextContent("Today, October 8", "small")',
  'msg1 = ChatMessage("Received", "Text", "Hi, Ana. Can you send me the Acme contract?", "10:30")',
  'msg2 = ChatMessage("Sent", "Text", "Hi, Carlos! I\'ve already incorporated Legal\'s changes.", "10:32", "Read")',
  'msg3Text = ChatMessage("Sent", "Text", "I\'m sharing the final version for you to review before it goes out for signature.", "10:33", "Read")',
  'msg3File = ChatAttachmentCard("Service agreement.pdf", "8 pages · 1.2 MB", @ToAssistant("Open Service agreement.pdf"))',
  'msg4 = ChatMessage("Received", "Text", "Perfect, I\'ll review it now. Thanks!", "10:42")',
  'msg5 = ChatMessage("Sent", "Text", "I\'ll follow up on your feedback.", "10:43", "Delivered")',
  'composer = ChatComposer("Empty")',
  'deleteDialog = ModalDialog("destructive", "Delete Carlos Ruiz?", "Carlos Ruiz will no longer appear in your contacts. The conversation history and shared groups will be kept. You can add him again anytime.", "Cancel", "Delete contact", $confirmDelete, @ToAssistant("Delete Carlos Ruiz"))',
].join("\n");
