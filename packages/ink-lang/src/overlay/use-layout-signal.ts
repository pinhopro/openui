import type { DOMElement } from "ink";
import { useEffect, useRef, type RefObject } from "react";
import { inkRoot } from "./root-rect";

function stayUnsubscribed(): void {}

/**
 * Adds `listener` to the ink root's per-commit layout notification, the one
 * Ink's own `useBoxMetrics` follows: Ink calls every listener in
 * `internal_layoutListeners` after each `calculateLayout`, on every commit of
 * any component and on every terminal resize. Like Ink's `addLayoutListener`,
 * the set is created on first use. Returns the removal. When the element is
 * not under an ink root, or the field holds something other than a set (an
 * Ink version without the mechanism), nothing is subscribed.
 */
function addLayoutListener(element: DOMElement, listener: () => void): () => void {
  const root = inkRoot(element);
  if (root.nodeName !== "ink-root") return stayUnsubscribed;
  const existing: unknown = root.internal_layoutListeners;
  if (existing !== undefined && !(existing instanceof Set)) return stayUnsubscribed;
  root.internal_layoutListeners ??= new Set();
  const listeners = root.internal_layoutListeners;
  listeners.add(listener);
  return function removeLayoutListener() {
    listeners.delete(listener);
  };
}

/**
 * Calls `onLayout` after every layout of the ink root `elementRef` sits in,
 * whoever re-rendered (a scrolled pane, a sibling, a resize), in a microtask,
 * since Ink notifies before React has attached the new refs of that commit.
 * `onLayout` must set state only when something changed, or every commit
 * would cause another. Without Ink's notification it is never called, and
 * the caller re-measures on its own renders only.
 */
export function useLayoutSignal(
  elementRef: RefObject<DOMElement | null>,
  onLayout: () => void,
): void {
  const latest = useRef(onLayout);
  latest.current = onLayout;

  useEffect(
    function followLayouts() {
      const element = elementRef.current;
      if (element === null) return undefined;
      let subscribed = true;
      function runLatest(): void {
        if (subscribed) latest.current();
      }
      function handleLayout(): void {
        queueMicrotask(runLatest);
      }
      const remove = addLayoutListener(element, handleLayout);
      return function stopFollowing() {
        subscribed = false;
        remove();
      };
    },
    [elementRef],
  );
}
