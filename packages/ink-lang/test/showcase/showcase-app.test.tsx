import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import type { ShowcasePage } from "../../examples/showcase/pages";
import { ShowcaseApp } from "../../examples/showcase/showcase-app";
import { createShowcaseTools } from "../../examples/showcase/showcase-tools";
import { stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { settle } from "../helpers/settle";

const CTRL_N = "\u000e";
const CTRL_P = "\u0010";
const CTRL_T = "\u0014";

const pages: ShowcasePage[] = [
  {
    id: "alpha",
    title: "Alpha",
    program: 'root = Stack([CardHeader("Alpha"), TextContent("alpha body")])',
  },
  {
    id: "beta",
    title: "Beta",
    program: 'root = Stack([CardHeader("Beta"), Buttons([Button("Ping", @ToAssistant("Ping"))])])',
  },
];

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!/^(\u001b\[\?\d+[hl])+$/.test(frame)) return stripAnsi(frame);
  }
  return "";
}

function mount() {
  return render(
    <ShowcaseApp
      pages={pages}
      tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
      mouse={false}
      stream={{ chunkSize: 1000, intervalMs: 1 }}
    />,
  );
}

describe("ShowcaseApp", () => {
  it("shows the sidebar, streams the first page and explains the keys", async () => {
    const instance = mount();
    await settle(40);
    const frame = lastFrame(instance.frames);
    expect(frame).toContain("OpenUI Ink");
    expect(frame).toContain("▸ Alpha");
    expect(frame).toContain("  Beta");
    expect(frame).toContain("alpha body");
    expect(frame).toContain("Ctrl+N");
    expect(frame).toContain("Ctrl+Q");
    instance.unmount();
  });

  it("switches pages with Ctrl+N and Ctrl+P", async () => {
    const instance = mount();
    await settle(40);
    instance.stdin.write(CTRL_N);
    await settle(40);
    let frame = lastFrame(instance.frames);
    expect(frame).toContain("▸ Beta");
    expect(frame).toContain("[ Ping ]");
    expect(frame).not.toContain("alpha body");
    instance.stdin.write(CTRL_P);
    await settle(40);
    frame = lastFrame(instance.frames);
    expect(frame).toContain("▸ Alpha");
    expect(frame).toContain("alpha body");
    instance.unmount();
  });

  it("reports the actions the host receives in the status bar", async () => {
    const instance = mount();
    await settle(40);
    instance.stdin.write(CTRL_N);
    await settle(40);
    // The sidebar holds focus; Tab moves to the page's button.
    instance.stdin.write(KEYS.TAB);
    await settle();
    instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(lastFrame(instance.frames)).toContain('continue_conversation "Ping"');
    instance.unmount();
  });
});

describe("ShowcaseApp with the mouse", () => {
  it("scrolls the page pane with the wheel", async () => {
    const longPage: ShowcasePage = {
      id: "long",
      title: "Long",
      program: [
        'root = Stack([CardHeader("Long"), ' +
          Array.from({ length: 40 }, (_, index) => `TextContent("line ${index}")`).join(", ") +
          "])",
      ].join("\n"),
    };
    const instance = render(
      <ShowcaseApp
        pages={[longPage]}
        tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
        mouse={true}
        stream={{ chunkSize: 5000, intervalMs: 1 }}
      />,
    );
    await settle(40);
    const before = lastFrame(instance.frames);
    expect(before).toContain("line 0");
    // Well inside the page pane, right of the sidebar.
    instance.stdin.write(MOUSE.wheelDown(50, 10, 3));
    await settle(10);
    const after = lastFrame(instance.frames);
    expect(after).not.toContain("line 0");
    expect(after).toContain("line 6");
    instance.stdin.write(MOUSE.wheelUp(50, 10, 3));
    await settle(10);
    expect(lastFrame(instance.frames)).toContain("line 0");
    instance.unmount();
  });
});

describe("ShowcaseApp event log", () => {
  it("lists the UI events of the page as they happen", async () => {
    const instance = mount();
    await settle(40);
    instance.stdin.write(CTRL_N);
    await settle(40);
    instance.stdin.write(KEYS.TAB);
    await settle();
    const frame = lastFrame(instance.frames);
    expect(frame).toContain("Events (");
    expect(frame).toContain('focus Button "Ping"');
    expect(frame).toContain("keydown");
    instance.unmount();
  });
});

describe("ShowcaseApp themes", () => {
  it("cycles the theme presets with Ctrl+T and shows the active one", async () => {
    const withInput: ShowcasePage[] = [
      {
        id: "fields",
        title: "Fields",
        program: 'root = Stack([CardHeader("Fields"), Input("q", "Search")])',
      },
    ];
    const instance = render(
      <ShowcaseApp
        pages={withInput}
        tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
        mouse={false}
        stream={{ chunkSize: 1000, intervalMs: 1 }}
      />,
    );
    await settle(40);
    let frame = lastFrame(instance.frames);
    expect(frame).toContain("Theme: Default");
    expect(frame).toContain("Ctrl+T");
    expect(frame).not.toContain("╭ ");
    instance.stdin.write(CTRL_T);
    await settle(10);
    frame = lastFrame(instance.frames);
    expect(frame).toContain("Theme: Bordered");
    expect(frame.split("╭").length).toBeGreaterThan(2);
    instance.stdin.write(CTRL_T);
    await settle(10);
    expect(lastFrame(instance.frames)).toContain("Theme: Minimal");
    instance.unmount();
  });
});
