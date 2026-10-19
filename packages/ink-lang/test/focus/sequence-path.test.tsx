import type { ElementNode } from "@openuidev/lang-core";
import { Box } from "ink";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import { useSequencePath } from "../../src/focus/sequence-path";
import { createSequencedRenderer } from "../../src/focus/sequenced-render";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import type { RenderNodeProps } from "../../src/render-node";
import { renderProgram } from "../helpers/render-program";

/** The latest sequence path each Probe rendered with, by its name. */
const seen: Record<string, number[]> = {};

function ProbeRenderer({ props }: ComponentRenderProps<{ name: string }>) {
  seen[props.name] = useSequencePath();
  return null;
}

const Probe = defineComponent({
  name: "Probe",
  description: "Records its sequence path",
  props: z.object({ name: z.string() }),
  component: ProbeRenderer,
});

interface SectionProps {
  header: unknown;
  body: unknown;
  showHeader: boolean;
}

function SectionRenderer({ props, renderNode }: ComponentRenderProps<SectionProps>) {
  return (
    <Box flexDirection="column">
      {props.showHeader ? renderNode(props.header) : null}
      {renderNode(props.body)}
    </Box>
  );
}

const Section = defineComponent({
  name: "Section",
  description: "A header shown on demand above a body",
  props: z.object({ header: z.any(), body: z.any(), showHeader: z.boolean() }),
  component: SectionRenderer,
});

const sequenceLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Probe, Section]),
});

function clearSeen(): void {
  for (const name of Object.keys(seen)) delete seen[name];
}

describe("sequence paths", () => {
  it("numbers each element by the order its parent renders it", async () => {
    clearSeen();
    const program = 'root = Stack([Probe("a"), Stack([Probe("b"), Probe("c")]), Probe("d")])';
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen).toEqual({ a: [0, 0], b: [0, 1, 0], c: [0, 1, 1], d: [0, 2] });
    rendered.unmount();
  });

  it("hands the items of a nested array the next orders in turn", async () => {
    clearSeen();
    const program = 'root = Stack([Probe("a"), [Probe("b"), Probe("c")], Probe("d")])';
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen).toEqual({ a: [0, 0], b: [0, 1], c: [0, 2], d: [0, 3] });
    rendered.unmount();
  });

  it("gives primitives no order", async () => {
    clearSeen();
    const program = 'root = Stack(["note", 7, Probe("a"), "more", Probe("b")])';
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen).toEqual({ a: [0, 0], b: [0, 1] });
    rendered.unmount();
  });

  it("keeps a shown header before the body and renumbers the body when it is hidden", async () => {
    clearSeen();
    const rendered = await renderProgram(
      sequenceLibrary,
      'root = Section(Probe("header"), Probe("body"), true)',
    );
    expect(seen["header"]).toEqual([0, 0]);
    expect(seen["body"]).toEqual([0, 1]);

    clearSeen();
    await rendered.update({ response: 'root = Section(Probe("header"), Probe("body"), false)' });
    expect(seen["header"]).toBeUndefined();
    expect(seen["body"]).toEqual([0, 0]);
    rendered.unmount();
  });
});

function elementNode(typeName: string): ElementNode {
  return { type: "element", typeName, props: {}, partial: false } as ElementNode;
}

function orderOf(node: unknown): number {
  const element = node as ReactElement<RenderNodeProps>;
  return element.props.order;
}

describe("createSequencedRenderer", () => {
  it("gives an explicit order to one element without advancing the sequence", () => {
    const renderNode = createSequencedRenderer();
    expect(orderOf(renderNode(elementNode("A")))).toBe(0);
    expect(orderOf(renderNode(elementNode("B"), { order: 9 }))).toBe(9);
    expect(orderOf(renderNode(elementNode("C")))).toBe(1);
    expect(orderOf(renderNode(elementNode("D"), {}))).toBe(2);
  });

  it("starts every renderer at 0", () => {
    const first = createSequencedRenderer();
    first(elementNode("A"));
    const second = createSequencedRenderer();
    expect(orderOf(second(elementNode("B")))).toBe(0);
  });
});
