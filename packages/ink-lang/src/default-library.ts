import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { Card } from "./components/card";
import { CardHeader } from "./components/card-header";
import { Col } from "./components/col";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { Label } from "./components/label";
import { Stack } from "./components/stack";
import { Table } from "./components/table";
import { TextContent } from "./components/text-content";
import { Input } from "./components/text-input";
import { createLibrary, type ComponentGroup, type Library } from "./library";

/** Prompt sections for the terminal library; the notes mirror the React default library. */
export const inkComponentGroups: ComponentGroup[] = [
  {
    name: "Layout",
    components: ["Stack"],
    notes: [
      '- For grid-like layouts, use Stack with direction "row" and wrap set to true.',
      "- Use nested Stacks when you need explicit rows/sections.",
    ],
  },
  {
    name: "Content",
    components: ["Card", "CardHeader", "TextContent"],
    notes: [
      '- Use Cards to group related sections. Stack with direction "row" for side-by-side layouts.',
      "- Give a Card a title with a CardHeader as its first child.",
    ],
  },
  {
    name: "Data",
    components: ["Table", "Col"],
    notes: [
      "- Table is column-oriented: one Col per column, each with its own data array (one value per row).",
      '- Mark numeric columns with type "number" so they are right-aligned.',
    ],
  },
  {
    name: "Forms",
    components: ["Form", "FormControl", "Label", "Input"],
    notes: [
      "- Define EACH FormControl as its own reference - do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument: Form(name, buttons, fields).",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
];

/**
 * The terminal counterpart of react-ui's `openuiLibrary`: the same component
 * names, positional arguments and schemas for every component it ships, so a
 * program written for the React renderer renders here unchanged.
 */
export const inkLibrary: Library = createLibrary({
  root: "Stack",
  componentGroups: inkComponentGroups,
  components: [
    Stack,
    Card,
    CardHeader,
    TextContent,
    Table,
    Col,
    Form,
    FormControl,
    Label,
    Input,
    Button,
    Buttons,
  ],
});
