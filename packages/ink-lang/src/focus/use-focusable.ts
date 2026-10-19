import { useFocus, useFocusManager, type DOMElement } from "ink";
import { useCallback, useContext, useEffect, useId, useRef, useState, type RefObject } from "react";
import { useElementType } from "../element-type-context";
import type { MouseEvent } from "../mouse/mouse-sequence";
import type { MouseHandlers, MouseWheelEvent } from "../mouse/mouse-target";
import { useMouse } from "../mouse/use-mouse";
import { useUiEvents, type UiEvent, type UiEventType } from "../ui-events";
import type { ArrowClaims, ArrowClaimsInput } from "./focus-navigation";
import { FocusRegistryContext, type FocusEntry } from "./focus-registry";
import { useLayerIsActive } from "./modal-layer";
import { useSequencePath } from "./sequence-path";

export interface FocusableOptions {
  /** False takes the component out of the Tab cycle (for example while streaming). */
  isActive: boolean;
  /** What identifies this instance in UI events: a field name, a label, a trigger. */
  name?: string;
  /** The component type reported in UI events; defaults to the element being rendered. */
  component?: string;
  /**
   * The arrows the component uses itself: fixed axes, or a function asked at
   * key time that returns false once the component has nowhere further to go
   * in that direction, so the arrow moves focus to a neighbour instead.
   */
  arrows?: ArrowClaimsInput;
  /** Handlers on the focusable box besides focusing it: press on click, drag... */
  mouse?: MouseHandlers;
  /** Focus as soon as the pointer enters, the way a button highlights on hover. */
  hoverFocus?: boolean;
  /** Take focus when mounted (one stop per app at most). */
  autoFocus?: boolean;
  /**
   * Where this stop sits among the stops and children of its element (default
   * 0). A stop shares its order with the child its component renders at the
   * same order and comes before everything inside that child.
   */
  order?: number;
}

export interface Focusable {
  /** Put this on the component's outer `Box`: it is what the mouse hits and the arrows measure. */
  ref: RefObject<DOMElement | null>;
  isFocused: boolean;
  /** The pointer is over the box (with `mouse` on and motion reporting). */
  isHovered: boolean;
  /** The left button is held down on the box. */
  isPressed: boolean;
  /** Moves Ink's focus to this component (a no-op while it is inactive). */
  focus: () => void;
}

const NO_CLAIMS: ArrowClaims = {};
const NO_HANDLERS: MouseHandlers = {};

/** The stop's sequence path: its element's path plus its order; null outside the renderer. */
function stopPath(elementPath: number[], order: number): number[] | null {
  if (elementPath.length === 0) return null;
  return elementPath.concat(order);
}

/**
 * One focus stop. It registers with Ink's focus manager under an id that is
 * unique per mounted instance, with the renderer's focus registry (so the
 * arrow keys can find it on screen and the Tab order can sort it by its
 * sequence path) and as a mouse target: a press on its box focuses it, and
 * every mouse, focus and blur event is reported to the host.
 */
export function useFocusable(options: FocusableOptions): Focusable {
  const id = useId();
  // A modal open above this component takes it out of the Tab cycle and off the mouse.
  const layerActive = useLayerIsActive();
  const isActive = options.isActive && layerActive;
  const focus = useFocus({ id, isActive, autoFocus: options.autoFocus === true });
  const [isHovered, setHovered] = useState(false);
  const [isPressed, setPressed] = useState(false);
  const manager = useFocusManager();
  const ref = useRef<DOMElement | null>(null);
  const elementType = useElementType();
  const elementPath = useSequencePath();
  const component = options.component ?? elementType;
  const name = options.name ?? "";
  const emit = useUiEvents();
  const registry = useContext(FocusRegistryContext);
  const mouse = options.mouse ?? NO_HANDLERS;
  const hoverFocus = options.hoverFocus === true;
  const path = stopPath(elementPath, options.order ?? 0);

  const focusSelf = useCallback(
    function focusSelf() {
      manager.focus(id);
    },
    [id, manager],
  );

  const entryRef = useRef<FocusEntry>({
    id,
    ref,
    isActive,
    arrows: options.arrows ?? NO_CLAIMS,
    component,
    name,
    path,
  });
  entryRef.current.isActive = isActive;
  entryRef.current.arrows = options.arrows ?? NO_CLAIMS;
  entryRef.current.component = component;
  entryRef.current.name = name;
  entryRef.current.path = path;

  useEffect(
    function registerStop() {
      if (registry === null) return undefined;
      return registry.register(entryRef.current);
    },
    [registry],
  );

  const wasFocusedRef = useRef(false);
  useEffect(
    function reportFocusChange() {
      if (focus.isFocused === wasFocusedRef.current) return;
      wasFocusedRef.current = focus.isFocused;
      emit({ type: focus.isFocused ? "focus" : "blur", component, name });
    },
    [component, emit, focus.isFocused, name],
  );

  function report(type: UiEventType, event: MouseEvent): void {
    const uiEvent: UiEvent = {
      type,
      component,
      name,
      x: event.x,
      y: event.y,
      button: event.button,
      shift: event.shift,
      alt: event.alt,
      ctrl: event.ctrl,
    };
    emit(uiEvent);
  }

  const handlers: MouseHandlers = {
    onMouseDown: function handleMouseDown(event) {
      report("mousedown", event);
      if (event.button === "left") setPressed(true);
      if (isActive && event.button === "left") focusSelf();
      mouse.onMouseDown?.(event);
    },
    onMouseUp: function handleMouseUp(event) {
      report("mouseup", event);
      setPressed(false);
      mouse.onMouseUp?.(event);
    },
    onClick: function handleClick(event) {
      report("click", event);
      mouse.onClick?.(event);
    },
    onDoubleClick: function handleDoubleClick(event) {
      report("dblclick", event);
      mouse.onDoubleClick?.(event);
    },
    onContextMenu: function handleContextMenu(event) {
      report("contextmenu", event);
      mouse.onContextMenu?.(event);
    },
    onMouseEnter: function handleMouseEnter(event) {
      report("mouseenter", event);
      setHovered(true);
      if (hoverFocus && isActive) focusSelf();
      mouse.onMouseEnter?.(event);
    },
    onMouseLeave: function handleMouseLeave(event) {
      report("mouseleave", event);
      setHovered(false);
      setPressed(false);
      mouse.onMouseLeave?.(event);
    },
    onMouseMove: function handleMouseMove(event) {
      report("mousemove", event);
      mouse.onMouseMove?.(event);
    },
  };
  // Only a component that scrolls or steps on the wheel takes wheel events;
  // otherwise they keep bubbling to a scrolling container.
  if (mouse.onWheel !== undefined) {
    const onWheel = mouse.onWheel;
    handlers.onWheel = function handleWheel(event: MouseWheelEvent) {
      emit({
        type: "wheel",
        component,
        name,
        x: event.x,
        y: event.y,
        direction: event.direction,
        ticks: event.ticks,
        shift: event.shift,
        alt: event.alt,
        ctrl: event.ctrl,
      });
      onWheel(event);
    };
  }
  useMouse(ref, handlers);

  return { ref, isFocused: focus.isFocused, isHovered, isPressed, focus: focusSelf };
}
