import { createSequencedRenderer } from "./focus/sequenced-render";
import type { ComponentRenderProps, ComponentRenderer } from "./library";

export interface ComponentHostProps {
  renderer: ComponentRenderer<any>;
  props: Record<string, unknown>;
  statementId?: string;
}

/**
 * Runs a component renderer as part of its own render, so the renderer's
 * hooks belong to the host. Any state update in the renderer re-renders the
 * host, which makes a fresh `renderNode` whose numbering starts at 0 again;
 * handing the renderer a closure from an earlier render would let the orders
 * drift upward on every re-render. A renderer that is not a plain function
 * (a memo or forwardRef object, a class) is rendered as an element instead.
 */
export function ComponentHost({ renderer, props, statementId }: ComponentHostProps) {
  const renderProps: ComponentRenderProps = {
    props,
    renderNode: createSequencedRenderer(),
    statementId,
  };
  if (!isPlainFunction(renderer)) {
    const Renderer = renderer;
    return <Renderer {...renderProps} />;
  }
  return renderer(renderProps);
}

function isPlainFunction(renderer: unknown): boolean {
  if (typeof renderer !== "function") return false;
  const prototype = (renderer as { prototype?: { isReactComponent?: unknown } }).prototype;
  return prototype === undefined || prototype.isReactComponent === undefined;
}
