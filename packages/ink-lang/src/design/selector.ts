/**
 * One compound of a selector: a component type (or `*`), the classes it
 * must carry (variants like `.secondary`, parts like `.label` or
 * `::placeholder`) and the states it must be in (`:focus`, `:disabled`...).
 */
export interface Compound {
  component: string;
  classes: string[];
  states: string[];
}

/**
 * A selector of the CSS subset: the compound that must match the element
 * itself and, before it, the compounds its ancestors must match in order
 * (`Table tbody tr td Input:focus`). Ancestors match by component name only.
 */
export interface Selector extends Compound {
  ancestors: Compound[];
}

/** What a component asks the cascade for: its type, classes, states and the ancestors above it. */
export interface StyleQuery {
  component: string;
  classes: string[];
  states: string[];
  /** Type names from the outermost element down to the parent. */
  ancestors: string[];
}

const PIECE = /^(\*|[A-Za-z_][\w-]*)?((?:(?:::|:|\.)[A-Za-z_][\w-]*)*)$/;
const QUALIFIER = /(::|:|\.)([A-Za-z_][\w-]*)/g;

function parseCompound(piece: string): Compound {
  const match = PIECE.exec(piece);
  if (match === null) throw new Error(`Cannot read selector "${piece}"`);
  const compound: Compound = { component: match[1] ?? "*", classes: [], states: [] };
  const qualifiers = match[2] ?? "";
  QUALIFIER.lastIndex = 0;
  let found = QUALIFIER.exec(qualifiers);
  while (found !== null) {
    if (found[1] === ":") compound.states.push(found[2] as string);
    else compound.classes.push(found[2] as string);
    found = QUALIFIER.exec(qualifiers);
  }
  return compound;
}

/**
 * Parses `Button.secondary:focus`, `FormControl .label`, `Input::placeholder`,
 * `Table tbody tr:odd td`, `:cursor` or `*`. A piece that starts with `.` or
 * `:` qualifies the compound before it (so `FormControl .label` is a part),
 * a piece that starts with a name opens a new compound (a descendant).
 */
export function parseSelector(text: string): Selector {
  const pieces = text.trim().split(/\s+/);
  const compounds: Compound[] = [];
  for (const piece of pieces) {
    if (piece === "") continue;
    const parsed = parseCompound(piece);
    const qualifiesPrevious = /^[.:]/.test(piece) && compounds.length > 0;
    if (qualifiesPrevious) {
      const previous = compounds[compounds.length - 1] as Compound;
      for (const name of parsed.classes) previous.classes.push(name);
      for (const state of parsed.states) previous.states.push(state);
      continue;
    }
    compounds.push(parsed);
  }
  if (compounds.length === 0) throw new Error(`Cannot read selector "${text}"`);
  const last = compounds[compounds.length - 1] as Compound;
  return { ...last, ancestors: compounds.slice(0, -1) };
}

function compoundMatches(compound: Compound, query: StyleQuery): boolean {
  if (compound.component !== "*" && compound.component !== query.component) return false;
  for (const name of compound.classes) {
    if (!query.classes.includes(name)) return false;
  }
  for (const state of compound.states) {
    if (!query.states.includes(state)) return false;
  }
  return true;
}

/** True when the element matches the last compound and its ancestors, in order, the others. */
export function matches(selector: Selector, query: StyleQuery): boolean {
  if (!compoundMatches(selector, query)) return false;
  let position = 0;
  for (const ancestor of selector.ancestors) {
    let found = false;
    while (position < query.ancestors.length) {
      const name = query.ancestors[position] as string;
      position += 1;
      if (ancestor.component === "*" || ancestor.component === name) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function compoundSpecificity(compound: Compound): number {
  const component = compound.component === "*" ? 0 : 1;
  return component + compound.classes.length + compound.states.length;
}

/** One point per named component, class and state over every compound, like CSS without ids. */
export function specificity(selector: Selector): number {
  let total = compoundSpecificity(selector);
  for (const ancestor of selector.ancestors) total += compoundSpecificity(ancestor);
  return total;
}
