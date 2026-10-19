import { Fragment, type ReactNode } from "react";
import { isElementValue } from "../element-node";
import { renderValue } from "../render-value";

export interface RenderNodeOptions {
  /** The order to give this element instead of the next one in sequence. */
  order?: number;
}

/** A component's `renderNode`: draws a value and numbers the elements it renders. */
export type SequencedRenderNode = (value: unknown, options?: RenderNodeOptions) => ReactNode;

/**
 * A `renderNode` for one render of one component. Its counter starts at 0:
 * each element it renders takes the next order, the items of an array (nested
 * arrays included) take the next orders in turn, and primitives and null take
 * none. `options.order` gives an element that order without advancing the
 * counter.
 */
export function createSequencedRenderer(): SequencedRenderNode {
  let nextOrder = 0;

  function takeOrder(): number {
    const order = nextOrder;
    nextOrder += 1;
    return order;
  }

  function renderItems(values: unknown[]): ReactNode {
    const items: ReactNode[] = [];
    for (let index = 0; index < values.length; index += 1) {
      items.push(<Fragment key={index}>{renderSequenced(values[index])}</Fragment>);
    }
    return items;
  }

  function renderSequenced(value: unknown, options?: RenderNodeOptions): ReactNode {
    if (Array.isArray(value)) return renderItems(value);
    if (!isElementValue(value)) return renderValue(value);
    const explicitOrder = options === undefined ? undefined : options.order;
    if (explicitOrder !== undefined) return renderValue(value, explicitOrder);
    return renderValue(value, takeOrder());
  }

  return renderSequenced;
}
