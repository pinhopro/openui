import { render } from "ink-testing-library";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { showcaseThemes } from "../../examples/showcase/showcase-themes";
import { ThemeSelect } from "../../examples/showcase/theme-select";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { settle } from "../helpers/settle";

interface HarnessProps {
  onSelect: (index: number) => void;
}

function Harness({ onSelect }: HarnessProps) {
  const [index, setIndex] = useState(0);
  function select(next: number): void {
    setIndex(next);
    onSelect(next);
  }
  return <ThemeSelect themes={showcaseThemes} activeIndex={index} onSelect={select} width={40} />;
}

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!/^(\u001b\[\?\d+[hl])+$/.test(frame)) return stripAnsi(frame);
  }
  return "";
}

describe("ThemeSelect", () => {
  it("opens with Enter, moves with the arrows and picks with Enter", async () => {
    const onSelect = vi.fn();
    const instance = render(<Harness onSelect={onSelect} />);
    await settle();
    expect(lastFrame(instance.frames)).toContain("Default ▾");
    instance.stdin.write(KEYS.TAB);
    await settle();
    instance.stdin.write(KEYS.ENTER);
    await settle();
    let frame = lastFrame(instance.frames);
    expect(frame).toContain("Default ▴");
    expect(frame).toContain("Midnight");
    instance.stdin.write(KEYS.DOWN);
    await settle();
    instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(1);
    frame = lastFrame(instance.frames);
    expect(frame).toContain("Bordered ▾");
    expect(frame).not.toContain("Midnight");
    instance.unmount();
  });

  it("opens on a click, picks the clicked theme and cycles with the wheel while closed", async () => {
    const onSelect = vi.fn();
    const instance = render(
      <MouseProvider options={{ motion: true }}>
        <Harness onSelect={onSelect} />
      </MouseProvider>,
    );
    await settle();
    let plain = lastFrame(instance.frames);
    const label = findCell(plain, "Default ▾");
    instance.stdin.write(MOUSE.click(label.x + 2, label.y));
    await settle();
    plain = lastFrame(instance.frames);
    const midnight = findCell(plain, "Midnight");
    instance.stdin.write(MOUSE.click(midnight.x, midnight.y));
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(3);
    expect(lastFrame(instance.frames)).toContain("Midnight ▾");
    instance.stdin.write(MOUSE.wheelDown(label.x + 2, label.y));
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(4);
    instance.unmount();
  });

  it("shows a window of the list and scrolls it with the cursor", async () => {
    const onSelect = vi.fn();
    const instance = render(<Harness onSelect={onSelect} />);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    instance.stdin.write(KEYS.ENTER);
    await settle();
    let frame = lastFrame(instance.frames);
    const last = showcaseThemes[showcaseThemes.length - 1];
    expect(frame).toContain("Default");
    expect(frame).not.toContain(last?.name ?? "");
    expect(frame).toContain("more");
    for (let step = 0; step < showcaseThemes.length - 1; step += 1) {
      instance.stdin.write(KEYS.DOWN);
      await settle(5);
    }
    frame = lastFrame(instance.frames);
    expect(frame).toContain(last?.name ?? "");
    expect(frame).not.toContain("Bordered");
    instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(onSelect).toHaveBeenLastCalledWith(showcaseThemes.length - 1);
    instance.unmount();
  });
});
