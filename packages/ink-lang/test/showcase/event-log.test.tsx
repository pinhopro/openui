import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { EventLog } from "../../examples/showcase/event-log";
import type { MouseOptions } from "../../src/mouse/mouse-options";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import { stripAnsi } from "../helpers/ansi";
import { MOUSE } from "../helpers/mouse";
import { settle } from "../helpers/settle";

const MOUSE_OPTIONS: MouseOptions = { motion: true };

function entries(count: number): string[] {
  const lines: string[] = [];
  for (let index = 0; index < count; index += 1) lines.push(`event ${index}`);
  return lines;
}

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!/^(\u001b\[\?\d+[hl])+$/.test(frame)) return stripAnsi(frame);
  }
  return "";
}

function mount(lines: string[]) {
  return render(
    <MouseProvider options={MOUSE_OPTIONS}>
      <EventLog entries={lines} height={5} columns={60} />
    </MouseProvider>,
  );
}

describe("EventLog", () => {
  it("shows the newest entries and a title with the count", async () => {
    const instance = mount(entries(20));
    await settle();
    const frame = lastFrame(instance.frames);
    expect(frame).toContain("Events (20)");
    expect(frame).toContain("event 19");
    expect(frame).toContain("event 15");
    expect(frame).not.toContain("event 14");
    instance.unmount();
  });

  it("scrolls back with the wheel, stays there while new entries arrive, and follows again at the bottom", async () => {
    const instance = mount(entries(20));
    await settle();
    instance.stdin.write(MOUSE.wheelUp(10, 2, 2));
    await settle();
    let frame = lastFrame(instance.frames);
    expect(frame).toContain("event 15");
    expect(frame).not.toContain("event 19");
    instance.rerender(
      <MouseProvider options={MOUSE_OPTIONS}>
        <EventLog entries={entries(25)} height={5} columns={60} />
      </MouseProvider>,
    );
    await settle();
    frame = lastFrame(instance.frames);
    expect(frame).toContain("event 15");
    expect(frame).not.toContain("event 24");
    instance.stdin.write(MOUSE.wheelDown(10, 2, 10));
    await settle();
    frame = lastFrame(instance.frames);
    expect(frame).toContain("event 24");
    instance.rerender(
      <MouseProvider options={MOUSE_OPTIONS}>
        <EventLog entries={entries(30)} height={5} columns={60} />
      </MouseProvider>,
    );
    await settle();
    expect(lastFrame(instance.frames)).toContain("event 29");
    instance.unmount();
  });
});
