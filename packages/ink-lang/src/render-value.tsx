import { Text } from "ink";
import { Fragment, type ReactNode } from "react";
import { isElementValue } from "./element-node";
import { RenderNode } from "./render-node";

/**
 * Turns an evaluated prop value into Ink nodes. Ink refuses bare strings
 * outside <Text>, so primitives are wrapped; null, undefined and anything
 * unknown render nothing.
 */
export function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return <Text>{value}</Text>;
  if (typeof value === "number" || typeof value === "boolean") return <Text>{String(value)}</Text>;
  if (Array.isArray(value)) return renderArray(value);
  if (isElementValue(value)) return <RenderNode node={value} />;
  return null;
}

function renderArray(values: unknown[]): ReactNode {
  const items: ReactNode[] = [];
  for (let index = 0; index < values.length; index += 1) {
    items.push(<Fragment key={index}>{renderValue(values[index])}</Fragment>);
  }
  return items;
}
