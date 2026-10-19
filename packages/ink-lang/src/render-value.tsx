import { Text } from "ink";
import type { ReactNode } from "react";
import { isElementValue } from "./element-node";
import { createSequencedRenderer } from "./focus/sequenced-render";
import { RenderNode } from "./render-node";

/**
 * Turns an evaluated prop value into Ink nodes. Ink refuses bare strings
 * outside <Text>, so primitives are wrapped; null, undefined and anything
 * unknown render nothing. An element is rendered at `order` in its parent's
 * sequence; the items of an array are numbered from 0 in turn.
 */
export function renderValue(value: unknown, order: number = 0): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return <Text>{value}</Text>;
  if (typeof value === "number" || typeof value === "boolean") return <Text>{String(value)}</Text>;
  if (Array.isArray(value)) return renderArray(value);
  if (isElementValue(value)) return <RenderNode node={value} order={order} />;
  return null;
}

function renderArray(values: unknown[]): ReactNode {
  const renderSequenced = createSequencedRenderer();
  return renderSequenced(values);
}
