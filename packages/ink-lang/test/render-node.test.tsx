import type { OpenUIError } from "@openuidev/lang-core";
import { Text } from "ink";
import { useMemo, useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderer,
  type ComponentRenderProps,
  type Library,
} from "../src/library";
import {
  makeInkTestLibrary,
  probe,
  resetInkTestLibrary,
  StackBox,
} from "./helpers/ink-test-library";
import { renderProgram } from "./helpers/render-program";

afterEach(resetInkTestLibrary);

function countRenderErrors(errors: OpenUIError[]): number {
  let count = 0;
  for (const error of errors) {
    if (error.code === "render-error") count += 1;
  }
  return count;
}

describe("RenderNode", () => {
  it("renders a known component", async () => {
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack([Title("hello")])');
    expect(rendered.frame()).toContain("hello");
    rendered.unmount();
  });

  it("wraps primitive children in Text", async () => {
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack(["plain", 42, true])');
    expect(rendered.frame().split("\n")).toEqual(["plain", "42", "true"]);
    rendered.unmount();
  });

  it("skips children the parser left out", async () => {
    const rendered = await renderProgram(
      makeInkTestLibrary(),
      'root = Stack([missing, Title("kept")])',
    );
    const frame = rendered.frame();
    expect(frame).toContain("kept");
    expect(frame).not.toContain("null");
    expect(frame).not.toContain("undefined");
    rendered.unmount();
  });

  it("renders a diagnostic for an unknown component", async () => {
    probe.target = { type: "element", typeName: "Ghost", props: {}, partial: false };
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack([Probe("p")])');
    expect(rendered.frame()).toContain("Unknown component: Ghost");
    rendered.unmount();
  });

  it("keeps the last good frame when a renderer throws and reports render-error", async () => {
    const reports: OpenUIError[][] = [];
    const rendered = await renderProgram(
      makeInkTestLibrary(),
      'root = Stack([f])\nf = Flaky("ok")',
      {
        onError: function onError(errors) {
          reports.push(errors);
        },
      },
    );
    expect(rendered.frame()).toContain("ok");
    await rendered.update({ response: 'root = Stack([f])\nf = Flaky("ok", true)' });
    expect(rendered.frame()).toContain("ok");
    const last = reports[reports.length - 1] ?? [];
    expect(last).toContainEqual(
      expect.objectContaining({ code: "render-error", component: "Flaky", source: "runtime" }),
    );
    expect(countRenderErrors(last)).toBe(1);
    await rendered.update({ response: 'root = Stack([f])\nf = Flaky("still", true)' });
    expect(rendered.frame()).toContain("ok");
    expect(countRenderErrors(reports[reports.length - 1] ?? [])).toBe(1);
    rendered.unmount();
  });

  it("starts a fresh component when a new library maps the same type to another renderer", async () => {
    function OldButtonRenderer({ props }: ComponentRenderProps<ButtonLabel>) {
      const [label] = useState("old " + props.label);
      return <Text>{label}</Text>;
    }
    function NewButtonRenderer({ props }: ComponentRenderProps<ButtonLabel>) {
      const mounted = useRef(true);
      const [prefix] = useState("new");
      const label = useMemo(
        function joinLabel() {
          return prefix + " " + props.label;
        },
        [prefix, props.label],
      );
      return <Text>{mounted.current ? label : ""}</Text>;
    }
    const errors = vi.spyOn(console, "error").mockImplementation(function silence() {});
    const reports: OpenUIError[][] = [];
    const program = 'root = Stack([Button("go")])';
    const rendered = await renderProgram(buttonLibrary(OldButtonRenderer), program, {
      onError: function onError(list) {
        reports.push(list);
      },
    });
    expect(rendered.frame()).toContain("old go");
    await rendered.update({ library: buttonLibrary(NewButtonRenderer) });
    expect(rendered.frame()).toContain("new go");
    expect(errors).not.toHaveBeenCalled();
    expect(countRenderErrors(reports[reports.length - 1] ?? [])).toBe(0);
    errors.mockRestore();
    rendered.unmount();
  });
});

interface ButtonLabel {
  label: string;
}

/** The test library with its `Button` drawn by `renderer`. */
function buttonLibrary(renderer: ComponentRenderer<ButtonLabel>): Library {
  const button = defineComponent({
    name: "Button",
    description: "A label",
    props: z.object({ label: z.string() }),
    component: renderer,
  });
  return createLibrary({ root: "Stack", components: [StackBox, button] });
}
