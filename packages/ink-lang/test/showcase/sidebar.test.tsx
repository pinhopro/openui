import { render } from "ink-testing-library";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar, type SidebarEntry } from "../../examples/showcase/sidebar";
import type { MouseOptions } from "../../src/mouse/mouse-options";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import { stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { settle } from "../helpers/settle";

const pages: SidebarEntry[] = [
  { id: "overview", title: "Overview" },
  { id: "charts", title: "Charts" },
  { id: "forms", title: "Forms" },
];

const MOUSE_OPTIONS: MouseOptions = { motion: true };

interface HarnessProps {
  initialIndex: number;
  onSelect: (index: number) => void;
}

/** Keeps the active page in state, as the app does. */
function Harness({ initialIndex, onSelect }: HarnessProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  function select(index: number): void {
    setActiveIndex(index);
    onSelect(index);
  }
  return <Sidebar pages={pages} activeIndex={activeIndex} onSelect={select} width={20} />;
}

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!/^(\u001b\[\?\d+[hl])+$/.test(frame)) return stripAnsi(frame);
  }
  return "";
}

describe("Sidebar", () => {
  it("lists the pages and marks the active one", async () => {
    const onSelect = vi.fn();
    const instance = render(<Harness initialIndex={1} onSelect={onSelect} />);
    await settle();
    const frame = lastFrame(instance.frames);
    expect(frame).toContain("OpenUI Ink");
    expect(frame).toContain("  Overview");
    expect(frame).toContain("▸ Charts");
    expect(frame).toContain("  Forms");
    instance.unmount();
  });

  it("moves with Up and Down while focused and clamps at the ends", async () => {
    const onSelect = vi.fn();
    const instance = render(<Harness initialIndex={0} onSelect={onSelect} />);
    await settle();
    instance.stdin.write(KEYS.DOWN);
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(1);
    instance.stdin.write(KEYS.UP);
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(0);
    instance.stdin.write(KEYS.UP);
    await settle();
    expect(onSelect).toHaveBeenCalledTimes(2);
    instance.unmount();
  });

  it("selects the page under a click and moves with the wheel", async () => {
    const onSelect = vi.fn();
    const instance = render(
      <MouseProvider options={MOUSE_OPTIONS}>
        <Harness initialIndex={0} onSelect={onSelect} />
      </MouseProvider>,
    );
    await settle();
    // Row 0 is the heading, row 1 is blank, the pages start on row 2.
    instance.stdin.write(MOUSE.click(3, 4));
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(2);
    instance.stdin.write(MOUSE.wheelUp(3, 2));
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(1);
    instance.unmount();
  });
});
