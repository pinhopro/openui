/**
 * Every kind of dialog: destructive confirm, info, warning, a form and a
 * choice, each blocking the page behind it, and a note that floats under the
 * openers while the page stays interactive.
 */
export const dialogsProgram = [
  "$confirm = false",
  "$info = false",
  "$warn = false",
  "$form = false",
  "$options = false",
  "$note = false",
  '$name = ""',
  '$plan = ""',
  "root = Stack([header, intro, openers, confirmDialog, infoDialog, warnDialog, formDialog, optionsDialog, noteDialog])",
  'header = CardHeader("Dialogs", "Confirm, inform, warn, fill a form, choose or leave a note")',
  'intro = TextContent("While a modal dialog is open, Tab, the arrows and the mouse only reach the dialog; a note leaves the page interactive. Cancel closes it; confirm fires its action and closes it.")',
  'openers = Buttons([openConfirm, openInfo, openWarn, openForm, openOptions, openNote], "column")',
  'openConfirm = Button("Delete a contact", @Set($confirm, true), "secondary", "destructive")',
  'openInfo = Button("Show an info dialog", @Set($info, true), "secondary")',
  'openWarn = Button("Show a warning", @Set($warn, true), "secondary")',
  'openForm = Button("Open a form dialog", @Set($form, true), "secondary")',
  'openOptions = Button("Open a choice dialog", @Set($options, true), "secondary")',
  'openNote = Button("Show a note", @Set($note, true), "secondary")',
  'confirmDialog = ModalDialog("destructive", "Delete Carlos Ruiz?", "Carlos Ruiz will no longer appear in your contacts. The conversation history and shared groups will be kept. You can add him again anytime.", "Cancel", "Delete contact", $confirm, @ToAssistant("Delete Carlos Ruiz"))',
  'infoDialog = ModalDialog("info", "Changes saved", "Your contact list is up to date.", null, "OK", $info)',
  'warnDialog = ModalDialog("warning", "Unsaved changes", "Leaving now discards the message you were writing.", "Keep editing", "Leave", $warn, @ToAssistant("Leave without saving"))',
  'formDialog = Modal("New contact", $form, [contactForm], "md")',
  'contactForm = Form("contact", Buttons([Button("Add contact", @ToAssistant("Add contact " + $name)), Button("Cancel", @Set($form, false), "secondary")]), [FormControl("Name", Input("name", "Full name", "text", {required: true}, $name), "Required"), FormControl("Email", Input("email", "name@company.com", "email", {email: true}), "Work address")])',
  'optionsDialog = Modal("Choose a plan", $options, [planForm], "md")',
  'planForm = Form("planChoice", Buttons([Button("Continue", @ToAssistant("Plan: " + $plan)), Button("Cancel", @Set($options, false), "secondary")]), [FormControl("Plan", RadioGroup("plan", [RadioItem("Free", "Up to 3 members", "free"), RadioItem("Pro", "Unlimited members and SSO", "pro"), RadioItem("Enterprise", "Dedicated support", "enterprise")], "free", null, $plan), "Up and Down move, Space picks")])',
  'noteDialog = Dialog("info", "Draft saved", "Keep editing or close this note.", "Close", null, $note)',
].join("\n");
