import { tokensToCssVariables } from "./css-variables";
import type { DesignTokens, TypeStyle } from "./tokens";

type Declaration = [string, string];

const FIELDS = ["Input", "TextArea", "Select", "Combobox", "DatePicker"];

function withState(state: string): string {
  const parts: string[] = [];
  for (const field of FIELDS) parts.push(field + state);
  return parts.join(", ");
}

/** `selector { a: b; c: d }`, leaving out declarations whose value is empty; null when none is left. */
function rule(selector: string, declarations: Declaration[]): string | null {
  const kept: string[] = [];
  for (const [property, value] of declarations) {
    if (value === "") continue;
    kept.push(property + ": " + value);
  }
  if (kept.length === 0) return null;
  return selector + " { " + kept.join("; ") + " }";
}

/** The declarations a typography token contributes. */
export function typographyDeclarations(style: TypeStyle): Declaration[] {
  const declarations: Declaration[] = [["font-weight", style.weight]];
  if (style.italic) declarations.push(["font-style", "italic"]);
  if (style.underline) declarations.push(["text-decoration", "underline"]);
  if (style.transform !== "none") declarations.push(["text-transform", style.transform]);
  if (style.color !== "") declarations.push(["color", style.color]);
  return declarations;
}

/**
 * The stylesheet the tokens imply: every component part reads its semantic
 * token through `var(--...)`, and a token left empty contributes nothing, so
 * the terminal's own colors show through. A host stylesheet comes after it.
 */
export function defaultStylesheet(tokens: DesignTokens): string {
  const variables = tokensToCssVariables(tokens);

  /** `var(--name)` when the token has a value, else nothing. */
  function v(name: string): string {
    const value = variables[name];
    return value === undefined || value === "" ? "" : "var(" + name + ")";
  }

  const fieldPadding = tokens.shape.fieldBorder === "none" ? "" : v("--spacing-sm");
  const buttonFocusInverse =
    tokens.color.semantic.button.background.focus === "" ? "invert(1)" : "none";
  const sunkBorder =
    tokens.color.semantic.border.default === "" ? "dim" : v("--color-border-default");
  const typography = tokens.typography;

  const rules: Array<string | null> = [
    rule("*", [
      ["color", v("--color-text-value")],
      ["background-color", v("--color-canvas-content")],
    ]),
    rule(FIELDS.join(", "), [
      ["border-style", v("--shape-field-border")],
      ["border-color", v("--color-border-default")],
      ["background-color", v("--color-canvas-surface")],
      ["color", v("--color-text-value")],
      ["padding-x", fieldPadding],
    ]),
    rule(withState(":focus"), [["border-color", v("--color-border-focus")]]),
    rule(withState(":disabled"), [
      ["color", v("--color-text-disabled")],
      ["border-color", v("--color-border-disabled")],
      ["background-color", v("--color-canvas-disabled")],
    ]),
    rule(withState("::placeholder"), [
      ["color", v("--color-text-placeholder")],
      ["background-color", v("--color-text-background-placeholder")],
    ]),
    rule("FormControl .label", [
      ...typographyDeclarations(typography.label),
      ["color", v("--color-text-label")],
      ["background-color", v("--color-text-background-label")],
    ]),
    rule("FormControl .helper", [
      ...typographyDeclarations(typography.helper),
      ["color", v("--color-text-helper")],
      ["background-color", v("--color-text-background-helper")],
    ]),
    rule("FormControl .error", [
      ["color", v("--color-text-error")],
      ["background-color", v("--color-text-background-error")],
    ]),
    rule("Button, IconButton", [
      ["font-weight", "bold"],
      ["color", v("--color-button-text-default")],
      ["background-color", v("--color-button-background-default")],
    ]),
    rule("Button.secondary, Button.tertiary, IconButton.secondary, IconButton.tertiary", [
      ["font-weight", "normal"],
    ]),
    rule("Button.destructive", [["color", v("--color-text-error")]]),
    rule("Button:hover, IconButton:hover", [
      ["color", v("--color-button-text-hover")],
      ["background-color", v("--color-button-background-hover")],
    ]),
    rule("Button:focus, IconButton:focus", [
      ["color", v("--color-button-text-focus")],
      ["background-color", v("--color-button-background-focus")],
      ["filter", buttonFocusInverse],
    ]),
    rule("Button:pressed, IconButton:pressed", [
      ["color", v("--color-button-text-pressed")],
      ["background-color", v("--color-button-background-pressed")],
    ]),
    rule("Button:disabled, IconButton:disabled", [
      ["color", v("--color-button-text-disabled")],
      ["background-color", v("--color-button-background-disabled")],
      ["filter", "none"],
    ]),
    rule("Icon", [["color", v("--color-icon-default")]]),
    rule("Card", [
      ["border-style", v("--shape-card-border")],
      ["border-color", v("--color-primary-500")],
      ["background-color", v("--color-canvas-surface")],
      ["padding", "0 1"],
    ]),
    rule("Card.sunk", [
      ["border-style", "solid"],
      ["border-color", sunkBorder],
    ]),
    rule("Card.clear", [
      ["border-style", "none"],
      ["padding", "0"],
    ]),
    rule("CardHeader .title", typographyDeclarations(typography.h4)),
    rule("CardHeader .subtitle", [
      ...typographyDeclarations(typography.helper),
      ["color", v("--color-text-helper")],
    ]),
    rule("InlineHeader .heading", typographyDeclarations(typography.h5)),
    rule("InlineHeader .description", [
      ...typographyDeclarations(typography.helper),
      ["color", v("--color-text-helper")],
    ]),
    rule("TextContent.large-heavy, MarkDownRenderer .h1", typographyDeclarations(typography.h1)),
    rule("MarkDownRenderer .h2", typographyDeclarations(typography.h2)),
    rule("MarkDownRenderer .h3", typographyDeclarations(typography.h3)),
    rule("TextContent.small, MarkDownRenderer .small", [["color", v("--color-text-helper")]]),
    rule("Table th, EditableTable th", [["font-weight", "bold"]]),
    rule("Table td.number, Table th.number, EditableTable td.number, EditableTable th.number", [
      ["text-align", "right"],
    ]),
    rule(":cursor", [["filter", "invert(1)"]]),
  ];

  const lines: string[] = [];
  for (const line of rules) {
    if (line !== null) lines.push(line);
  }
  return lines.join("\n");
}
