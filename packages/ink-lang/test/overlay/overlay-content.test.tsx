import type { ActionEvent } from "@openuidev/lang-core";
import { Box, Text, type DOMElement } from "ink";
import { useContext, useRef, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import { elementRect } from "../../src/focus/element-rect";
import { focusOrder } from "../../src/focus/focus-order";
import { FocusRegistryContext, type FocusRegistry } from "../../src/focus/focus-registry";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import { useOverlay } from "../../src/overlay/use-overlay";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

/** The id `useOverlay` gave the latest Floater's overlay. */
const floater: { overlayId: string | null } = { overlayId: null };

/** The focus registry the latest Probe rendered with. */
const probe: { registry: FocusRegistry | null } = { registry: null };

interface FloaterProps {
  label: string;
  child: unknown;
  compact?: boolean;
}

/**
 * An anchor box with its label and an overlay below it: a bordered box (3
 * rows) holding the program's `child`, drawn through the component's own
 * `renderNode`, so a Button there is a real focus stop. `compact` gives the
 * overlay a one-row compact form, so its whole form stays hidden below the
 * root while it does not fit (without one, the whole form is shown anyway).
 */
function FloaterRenderer({ props, renderNode }: ComponentRenderProps<FloaterProps>) {
  const anchorRef = useRef<DOMElement | null>(null);
  const child = props.child;
  function renderOverlay(): ReactNode {
    return <Box borderStyle="single">{renderNode(child)}</Box>;
  }
  function renderCompact(): ReactNode {
    return <Text>compact</Text>;
  }
  const overlay = useOverlay({
    kind: "tooltip",
    anchorRef,
    placement: "bottom",
    gap: 0,
    isOpen: true,
    render: renderOverlay,
    renderCompact: props.compact === true ? renderCompact : undefined,
  });
  floater.overlayId = overlay.id;
  return (
    <Box ref={anchorRef}>
      <Text>{props.label}</Text>
    </Box>
  );
}

const Floater = defineComponent({
  name: "Floater",
  description: "A label with a floating overlay holding a child under it",
  props: z.object({ label: z.string(), child: z.any(), compact: z.boolean().optional() }),
  component: FloaterRenderer,
});

function ProbeRenderer() {
  probe.registry = useContext(FocusRegistryContext);
  return null;
}

const Probe = defineComponent({
  name: "Probe",
  description: "Records the focus registry it renders with",
  props: z.object({}),
  component: ProbeRenderer,
});

const contentLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Floater, Probe]),
});

const INSIDE = 'Button("Inside", @ToAssistant("Inside"))';
const BASE = 'Button("Base", @ToAssistant("Base"))';

async function press(
  rendered: Awaited<ReturnType<typeof renderProgram>>,
  key: string,
): Promise<string[]> {
  rendered.instance.stdin.write(key);
  await settle();
  return inverseSegments(rendered.frame());
}

/** The registry the Probe saw; fails the test when there is none. */
function probedRegistry(): FocusRegistry {
  const registry = probe.registry;
  if (registry === null) throw new Error("the Probe saw no focus registry");
  return registry;
}

/** The box of the registered stop named `name`; fails the test when it is not mounted. */
function stopBox(name: string): DOMElement {
  for (const entry of probedRegistry().entries()) {
    const element = entry.ref.current;
    if (entry.name === name && element !== null) return element;
  }
  throw new Error(`no mounted stop named ${name}`);
}

describe("overlay content", () => {
  it("is inert while its whole form is hidden: Tab skips it and a click on it reaches nothing", async () => {
    // One row high: the 3-row content never fits, so the whole form stays hidden below the root
    // while the compact form shows on the anchor's right, past the Base button.
    const program = `root = Stack([${BASE}, Floater("anchor", ${INSIDE}, true), Probe()], "row", "none")`;
    const actions: ActionEvent[] = [];
    function onAction(event: ActionEvent): void {
      actions.push(event);
    }
    const rendered = await renderProgram(contentLibrary, program, { mouse: true, onAction });
    const frame = stripAnsi(rendered.frame());
    expect(frame).toContain("compact");
    expect(frame).not.toContain("Inside");

    expect(await press(rendered, KEYS.TAB)).toEqual(["[ Base ]"]);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ Base ]"]);
    expect(await press(rendered, KEYS.SHIFT_TAB)).toEqual(["[ Base ]"]);

    // The hidden form is drawn from the row right below the root; its Inside button sits there.
    const inside = elementRect(stopBox("Inside"));
    expect(inside.y).toBeGreaterThanOrEqual(1);
    rendered.instance.stdin.write(MOUSE.click(inside.x + 2, inside.y));
    await settle();
    rendered.instance.stdin.write(MOUSE.click(inside.x + 2, 1));
    await settle();
    expect(actions).toHaveLength(0);
    rendered.unmount();
  });

  it("is a stop of its overlay once shown: Tab reaches it and its stop names the overlay", async () => {
    const rows =
      'TextContent("one"), TextContent("two"), TextContent("three"), TextContent("four")';
    const program = `root = Stack([${rows}, Floater("anchor", ${INSIDE}), ${BASE}, Probe()], "column", "none")`;
    const rendered = await renderProgram(contentLibrary, program);
    expect(stripAnsi(rendered.frame())).toContain("[ Inside ]");

    expect(await press(rendered, KEYS.TAB)).toEqual(["[ Inside ]"]);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ Base ]"]);

    const stops = focusOrder(probedRegistry());
    expect(stops.map((stop) => stop.name)).toEqual(["Inside", "Base"]);
    expect(floater.overlayId).not.toBeNull();
    expect(stops[0]?.overlay).toBe(floater.overlayId);
    expect(stops[1]?.overlay).toBeNull();
    rendered.unmount();
  });
});
