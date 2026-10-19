const identities = new WeakMap<object, number>();
let nextIdentity = 0;

/**
 * A number that stays the same for one renderer (a function, or a memo or
 * forwardRef object) and differs between renderers, so a host that swaps
 * `library` and maps a type name to another renderer remounts the component
 * instead of running the new renderer on the old one's hook state.
 */
export function rendererIdentity(renderer: object): number {
  const known = identities.get(renderer);
  if (known !== undefined) return known;
  const identity = nextIdentity;
  nextIdentity += 1;
  identities.set(renderer, identity);
  return identity;
}
