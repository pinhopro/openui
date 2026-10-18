import { parseSelector, type Selector } from "./selector";

export interface Declaration {
  property: string;
  value: string;
}

export interface StyleRule {
  selectors: Selector[];
  declarations: Declaration[];
  /** Position in the stylesheet; later rules win ties. */
  order: number;
}

export interface ParsedStylesheet {
  rules: StyleRule[];
  /** One line per rule block that could not be read. */
  errors: string[];
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, " ");
}

function parseDeclarations(body: string): Declaration[] {
  const declarations: Declaration[] = [];
  for (const piece of body.split(";")) {
    const text = piece.trim();
    if (text === "") continue;
    const colon = text.indexOf(":");
    if (colon === -1) throw new Error(`Cannot read declaration "${text}"`);
    const property = text.slice(0, colon).trim().toLowerCase();
    const value = text.slice(colon + 1).trim();
    if (property === "") throw new Error(`Cannot read declaration "${text}"`);
    declarations.push({ property, value });
  }
  return declarations;
}

/**
 * Parses the CSS subset: `selector, selector { property: value; ... }`
 * blocks with `/* comments *\/`. A block that cannot be read is reported and
 * skipped; the others still apply.
 */
export function parseStylesheet(css: string): ParsedStylesheet {
  const rules: StyleRule[] = [];
  const errors: string[] = [];
  const source = stripComments(css);
  let position = 0;
  let order = 0;
  while (position < source.length) {
    const open = source.indexOf("{", position);
    if (open === -1) {
      if (source.slice(position).trim() !== "")
        errors.push(`Text outside a rule: "${source.slice(position).trim()}"`);
      break;
    }
    const close = source.indexOf("}", open);
    if (close === -1) {
      errors.push(`Unclosed rule: "${source.slice(open).trim()}"`);
      break;
    }
    const head = source.slice(position, open).trim();
    const body = source.slice(open + 1, close);
    position = close + 1;
    if (body.includes("{")) {
      errors.push(`Nested rule: "${head}"`);
      continue;
    }
    try {
      const selectors: Selector[] = [];
      for (const piece of head.split(",")) selectors.push(parseSelector(piece));
      rules.push({ selectors, declarations: parseDeclarations(body), order });
      order += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { rules, errors };
}
