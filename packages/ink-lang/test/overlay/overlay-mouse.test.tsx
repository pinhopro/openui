import type { ActionEvent } from "@openuidev/lang-core";
import { Box, Text, type DOMElement } from "ink";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import { useMouse } from "../../src/mouse/use-mouse";
import { useOverlay } from "../../src/overlay/use-overlay";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const overlayClicks: string[] = [];

/** The overlay's content: a clickable bordered box that records its clicks. */
function ClickableOverlay() {
  const ref = useRef<DOMElement | null>(null);
  useMouse(ref, {
    onClick: function onClick() {
      overlayClicks.push("overlay");
    },
  });
  return (
    <Box ref={ref} borderStyle="single">
      <Text>OVERLAY CLICKABLE</Text>
    </Box>
  );
}

interface FloaterProps {
  label: string;
  hide?: boolean;
}

/** An anchor box with a clickable overlay below it while not hidden. */
function FloaterRenderer({ props }: ComponentRenderProps<FloaterProps>) {
  const anchorRef = useRef<DOMElement | null>(null);
  useOverlay({
    kind: "tooltip",
    anchorRef,
    placement: "bottom",
    gap: 0,
    isOpen: props.hide !== true,
    render: function renderOverlay() {
      return <ClickableOverlay />;
    },
  });
  return (
    <Box ref={anchorRef}>
      <Text>{props.label}</Text>
    </Box>
  );
}

const Floater = defineComponent({
  name: "Floater",
  description: "A label with a clickable floating overlay under it",
  props: z.object({ label: z.string(), hide: z.boolean().optional() }),
  component: FloaterRenderer,
});

const overlayLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Floater]),
});

/** A Floater on row 0 whose overlay (3 rows) covers the Button on row 1. */
function program(hide: boolean): string {
  const floater = hide ? 'Floater("anchor", true)' : 'Floater("anchor")';
  return `root = Stack([${floater}, Button("Under", @ToAssistant("Under")), TextContent("filler")], "column", "none")`;
}

describe("overlay mouse stacking", () => {
  it("gives the click to the overlay over the button it covers, and back to the button once closed", async () => {
    overlayClicks.length = 0;
    const actions: ActionEvent[] = [];
    function onAction(event: ActionEvent): void {
      actions.push(event);
    }
    const rendered = await renderProgram(overlayLibrary, program(true), { mouse: true, onAction });
    const button = findCell(stripAnsi(rendered.frame()), "Under");

    await rendered.update({ response: program(false) });
    expect(stripAnsi(rendered.frame())).toContain("OVERLAY CLICKABLE");
    rendered.instance.stdin.write(MOUSE.click(button.x, button.y));
    await settle();
    expect(overlayClicks).toEqual(["overlay"]);
    expect(actions).toHaveLength(0);

    await rendered.update({ response: program(true) });
    expect(stripAnsi(rendered.frame())).not.toContain("OVERLAY CLICKABLE");
    rendered.instance.stdin.write(MOUSE.click(button.x, button.y));
    await settle();
    expect(overlayClicks).toEqual(["overlay"]);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.humanFriendlyMessage).toBe("Under");
    rendered.unmount();
  });
});
