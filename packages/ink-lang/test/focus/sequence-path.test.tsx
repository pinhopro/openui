import type { ElementNode } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import { memo, useState, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import { useSequencePath } from "../../src/focus/sequence-path";
import { createSequencedRenderer } from "../../src/focus/sequenced-render";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderer,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import type { RenderNodeProps } from "../../src/render-node";
import { KEYS } from "../helpers/keys";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

/** The latest sequence path each Probe rendered with, by its name. */
const seen: Record<string, number[]> = {};

/** Every sequence path each Probe rendered with, by its name, oldest first. */
const history: Record<string, number[][]> = {};

function ProbeRenderer({ props }: ComponentRenderProps<{ name: string }>) {
  const path = useSequencePath();
  seen[props.name] = path;
  const paths = history[props.name] ?? [];
  paths.push(path);
  history[props.name] = paths;
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

/** Re-renders the mounted SelfBump from its own state, set while it renders. */
const selfBump: { bump: (() => void) | null } = { bump: null };

function SelfBumpRenderer({ props, renderNode }: ComponentRenderProps<{ child: unknown }>) {
  const [bumps, setBumps] = useState(0);
  selfBump.bump = function bump() {
    setBumps(bumps + 1);
  };
  return (
    <Box flexDirection="column">
      <Text>{`bumps ${bumps}`}</Text>
      {renderNode(props.child)}
    </Box>
  );
}

const SelfBump = defineComponent({
  name: "SelfBump",
  description: "Re-renders itself once from its own state",
  props: z.object({ child: z.any() }),
  component: SelfBumpRenderer,
});

function PinnedRenderer({ props, renderNode }: ComponentRenderProps<{ child: unknown }>) {
  return <Box>{renderNode(props.child, { order: 2 })}</Box>;
}

const Pinned = defineComponent({
  name: "Pinned",
  description: "Renders its child at the explicit order 2",
  props: z.object({ child: z.any() }),
  component: PinnedRenderer,
});

function MemoWrapRenderer({ props, renderNode }: ComponentRenderProps<{ child: unknown }>) {
  return <Box>{renderNode(props.child)}</Box>;
}

// A memo object is not a plain function: the host renders it as an element.
const MemoWrap = defineComponent({
  name: "MemoWrap",
  description: "A renderer wrapped in React.memo",
  props: z.object({ child: z.any() }),
  component: memo(MemoWrapRenderer) as unknown as ComponentRenderer<{ child: unknown }>,
});

const sequenceLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([
    Probe,
    Section,
    SelfBump,
    Pinned,
    MemoWrap,
  ]),
});

function clearSeen(): void {
  for (const name of Object.keys(seen)) delete seen[name];
  for (const name of Object.keys(history)) delete history[name];
}

async function press(rendered: Awaited<ReturnType<typeof renderProgram>>, key: string) {
  rendered.instance.stdin.write(key);
  await settle();
}

// Every path starts with the program's rank: 0 for a standalone renderer.
describe("sequence paths", () => {
  it("numbers each element by the order its parent renders it", async () => {
    clearSeen();
    const program = 'root = Stack([Probe("a"), Stack([Probe("b"), Probe("c")]), Probe("d")])';
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen).toEqual({ a: [0, 0, 0], b: [0, 0, 1, 0], c: [0, 0, 1, 1], d: [0, 0, 2] });
    rendered.unmount();
  });

  it("hands the items of a nested array the next orders in turn", async () => {
    clearSeen();
    const program = 'root = Stack([Probe("a"), [Probe("b"), Probe("c")], Probe("d")])';
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen).toEqual({ a: [0, 0, 0], b: [0, 0, 1], c: [0, 0, 2], d: [0, 0, 3] });
    rendered.unmount();
  });

  it("gives primitives no order", async () => {
    clearSeen();
    const program = 'root = Stack(["note", 7, Probe("a"), "more", Probe("b")])';
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen).toEqual({ a: [0, 0, 0], b: [0, 0, 1] });
    rendered.unmount();
  });

  it("gives a child the explicit order its parent passes", async () => {
    clearSeen();
    const rendered = await renderProgram(sequenceLibrary, 'root = Pinned(Probe("pinned"))');
    expect(seen["pinned"]).toEqual([0, 0, 2]);
    rendered.unmount();
  });

  it("renders a renderer that is not a plain function as an element", async () => {
    clearSeen();
    const rendered = await renderProgram(sequenceLibrary, 'root = MemoWrap(Probe("wrapped"))');
    expect(seen["wrapped"]).toEqual([0, 0, 0]);
    rendered.unmount();
  });

  it("restarts the numbering when a component re-renders from its own state", async () => {
    clearSeen();
    const rendered = await renderProgram(sequenceLibrary, 'root = SelfBump(Probe("child"))');
    selfBump.bump?.();
    await settle();
    selfBump.bump?.();
    await settle();
    expect(rendered.frame()).toContain("bumps 2");
    const paths = history["child"] ?? [];
    expect(paths.length).toBeGreaterThan(1);
    for (const path of paths) expect(path).toEqual([0, 0, 0]);
    rendered.unmount();
  });

  it("keeps the cells' paths when a Table turns its pages", async () => {
    clearSeen();
    const probes: string[] = [];
    const sizes: string[] = [];
    for (let index = 1; index <= 11; index += 1) {
      probes.push(`Probe("row${index}")`);
      sizes.push(String(index));
    }
    const program = `root = Stack([Table([Col("Probe", [${probes.join(", ")}]), Col("Size", [${sizes.join(", ")}], "number")])])`;
    const rendered = await renderProgram(sequenceLibrary, program);
    expect(seen["row1"]).toEqual([0, 0, 0, 0]);
    expect(seen["row10"]).toEqual([0, 0, 0, 9]);

    clearSeen();
    await press(rendered, KEYS.TAB);
    await press(rendered, KEYS.TAB);
    await press(rendered, KEYS.ENTER);
    expect(rendered.frame()).toContain("rows 11-11 of 11");
    expect(seen["row11"]).toEqual([0, 0, 0, 0]);

    clearSeen();
    await press(rendered, KEYS.SHIFT_TAB);
    await press(rendered, KEYS.ENTER);
    expect(rendered.frame()).toContain("rows 1-10 of 11");
    expect(seen["row1"]).toEqual([0, 0, 0, 0]);
    expect(seen["row10"]).toEqual([0, 0, 0, 9]);
    rendered.unmount();
  });

  it("keeps a shown header before the body and renumbers the body when it is hidden", async () => {
    clearSeen();
    const rendered = await renderProgram(
      sequenceLibrary,
      'root = Section(Probe("header"), Probe("body"), true)',
    );
    expect(seen["header"]).toEqual([0, 0, 0]);
    expect(seen["body"]).toEqual([0, 0, 1]);

    clearSeen();
    await rendered.update({ response: 'root = Section(Probe("header"), Probe("body"), false)' });
    expect(seen["header"]).toBeUndefined();
    expect(seen["body"]).toEqual([0, 0, 0]);
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
