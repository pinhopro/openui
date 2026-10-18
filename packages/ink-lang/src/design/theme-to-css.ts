import type { InkThemeOverrides } from "../theme";
import type { BoxStyle, TextStyle } from "../theme-styles";

const FIELDS = "Input, TextArea, Select, Combobox, DatePicker";

function fieldsWith(suffix: string): string {
  const parts: string[] = [];
  for (const field of FIELDS.split(", ")) parts.push(field + suffix);
  return parts.join(", ");
}

/** The declarations of a text style slot. */
export function textStyleDeclarations(style: TextStyle): string[] {
  const declarations: string[] = [];
  if (style.color !== undefined) declarations.push("color: " + style.color);
  if (style.background !== undefined) declarations.push("background-color: " + style.background);
  if (style.bold !== undefined)
    declarations.push("font-weight: " + (style.bold ? "bold" : "normal"));
  if (style.italic !== undefined)
    declarations.push("font-style: " + (style.italic ? "italic" : "normal"));
  if (style.underline !== undefined || style.strikethrough !== undefined) {
    const parts: string[] = [];
    if (style.underline === true) parts.push("underline");
    if (style.strikethrough === true) parts.push("line-through");
    declarations.push("text-decoration: " + (parts.length === 0 ? "none" : parts.join(" ")));
  }
  if (style.dim !== undefined) declarations.push("opacity: " + (style.dim ? "0.5" : "1"));
  if (style.inverse !== undefined)
    declarations.push("filter: " + (style.inverse ? "invert(1)" : "none"));
  return declarations;
}

/** The declarations of a box style slot. */
export function boxStyleDeclarations(style: BoxStyle): string[] {
  const declarations: string[] = [];
  if (style.border !== undefined) declarations.push("border-style: " + style.border);
  if (style.borderColor !== undefined) declarations.push("border-color: " + style.borderColor);
  else if (style.borderDim === true) declarations.push("border-color: dim");
  if (style.background !== undefined) declarations.push("background-color: " + style.background);
  if (style.paddingX !== undefined) declarations.push("padding-x: " + String(style.paddingX));
  if (style.paddingY !== undefined) declarations.push("padding-y: " + String(style.paddingY));
  return declarations;
}

function rule(selector: string, declarations: string[]): string | null {
  if (declarations.length === 0) return null;
  return selector + " { " + declarations.join("; ") + " }";
}

/**
 * The `theme` slots as stylesheet rules, so a host that only knows the slot
 * model still lands in the same cascade as a design system; they come after
 * the host stylesheet and therefore win.
 */
export function themeToCss(theme: InkThemeOverrides | undefined): string {
  if (theme === undefined) return "";
  const rules: Array<string | null> = [];
  if (theme.heading !== undefined)
    rules.push(rule("CardHeader .title", textStyleDeclarations(theme.heading)));
  if (theme.subtext !== undefined) {
    const declarations = textStyleDeclarations(theme.subtext);
    rules.push(
      rule("CardHeader .subtitle, FormControl .helper, InlineHeader .description", declarations),
    );
  }
  if (theme.focusRing !== undefined)
    rules.push(rule(":cursor", textStyleDeclarations(theme.focusRing)));
  const field = theme.field;
  if (field !== undefined) {
    const base = boxStyleDeclarations(field.box ?? {}).concat(
      textStyleDeclarations(field.text ?? {}),
    );
    rules.push(rule(FIELDS, base));
    if (field.placeholder !== undefined) {
      rules.push(rule(fieldsWith("::placeholder"), textStyleDeclarations(field.placeholder)));
    }
    if (field.focused !== undefined) {
      const focused = boxStyleDeclarations(field.focused.box ?? {}).concat(
        textStyleDeclarations(field.focused.text ?? {}),
      );
      rules.push(rule(fieldsWith(":focus"), focused));
    }
  }
  const button = theme.button;
  if (button !== undefined) {
    if (button.primary !== undefined)
      rules.push(rule("Button, IconButton", textStyleDeclarations(button.primary)));
    if (button.secondary !== undefined) {
      rules.push(
        rule("Button.secondary, IconButton.secondary", textStyleDeclarations(button.secondary)),
      );
    }
    if (button.tertiary !== undefined) {
      rules.push(
        rule("Button.tertiary, IconButton.tertiary", textStyleDeclarations(button.tertiary)),
      );
    }
    if (button.destructive !== undefined) {
      rules.push(
        rule(
          "Button.destructive, IconButton.destructive",
          textStyleDeclarations(button.destructive),
        ),
      );
    }
    if (button.focused !== undefined) {
      rules.push(rule("Button:focus, IconButton:focus", textStyleDeclarations(button.focused)));
    }
    if (button.disabled !== undefined) {
      rules.push(
        rule("Button:disabled, IconButton:disabled", textStyleDeclarations(button.disabled)),
      );
    }
  }
  const card = theme.card;
  if (card !== undefined) {
    if (card.card !== undefined) rules.push(rule("Card", boxStyleDeclarations(card.card)));
    if (card.sunk !== undefined) rules.push(rule("Card.sunk", boxStyleDeclarations(card.sunk)));
    if (card.clear !== undefined) rules.push(rule("Card.clear", boxStyleDeclarations(card.clear)));
  }
  const lines: string[] = [];
  for (const line of rules) {
    if (line !== null) lines.push(line);
  }
  return lines.join("\n");
}
