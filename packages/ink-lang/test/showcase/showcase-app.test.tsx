import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { showcasePages, type ShowcasePage } from "../../examples/showcase/pages";
import { ShowcaseApp } from "../../examples/showcase/showcase-app";
import { createShowcaseTools } from "../../examples/showcase/showcase-tools";
import { DIM_ON, inverseSegments, stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
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

// One page whose program has two stops, for the ends of the Tab cycle.
const twoStopPages: ShowcasePage[] = [
  {
    id: "gamma",
    title: "Gamma",
    program:
      'root = Stack([CardHeader("Gamma"), Buttons([Button("Ping", @ToAssistant("Ping")), Button("Pong", @ToAssistant("Pong"))])])',
  },
];

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!/^(\u001b\[\?\d+[hl])+$/.test(frame)) return stripAnsi(frame);
  }
  return "";
}

function mount(list: ShowcasePage[] = pages) {
  return render(
    <ShowcaseApp
      pages={list}
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

  it("moves focus from the page back into the sidebar with Left and on with Down", async () => {
    const instance = mount();
    await settle(40);
    instance.stdin.write(CTRL_N);
    await settle(40);
    // The sidebar owns focus at start; Tab walks the document order: theme select, then the page.
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["▸ Beta"]);
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toContain("[ Ping ]");
    // The button uses no arrow: Left crosses into the sidebar beside it.
    instance.stdin.write(KEYS.LEFT);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["▸ Beta"]);
    // Down on the last page has nowhere to go inside the list: it reaches the theme select.
    instance.stdin.write(KEYS.DOWN);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")[0]).toContain("Default ▾");
    instance.unmount();
  });

  it("moves on from the theme select to the page's first stop with Tab", async () => {
    const instance = mount(twoStopPages);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["▸ Gamma"]);
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")[0]).toContain("Default ▾");
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["[ Ping ]"]);
    instance.unmount();
  });

  it("wraps Shift+Tab from the sidebar to the page's last stop", async () => {
    const instance = mount(twoStopPages);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["▸ Gamma"]);
    instance.stdin.write(KEYS.SHIFT_TAB);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["[ Pong ]"]);
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
    // The sidebar holds focus; Tab moves to the theme select, then to the page's button.
    instance.stdin.write(KEYS.TAB);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(lastFrame(instance.frames)).toContain('continue_conversation "Ping"');
    instance.unmount();
  });
});

describe("ShowcaseApp keeps the focused stop in view", () => {
  it("scrolls the page pane so a focused button below the fold shows", async () => {
    const longPage: ShowcasePage = {
      id: "long",
      title: "Long",
      program:
        'root = Stack([CardHeader("Long"), ' +
        Array.from({ length: 40 }, (_, index) => `TextContent("line ${index}")`).join(", ") +
        ', Button("Bottom", @ToAssistant("Bottom"))])',
    };
    const instance = render(
      <ShowcaseApp
        pages={[longPage]}
        tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
        mouse={false}
        stream={{ chunkSize: 5000, intervalMs: 1 }}
      />,
    );
    await settle(40);
    expect(lastFrame(instance.frames)).not.toContain("[ Bottom ]");
    // The sidebar starts focused: Tab reaches the theme select, then the page's only stop.
    instance.stdin.write(KEYS.TAB);
    await settle(10);
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["[ Bottom ]"]);
    expect(lastFrame(instance.frames)).not.toContain("line 0");
    // Back to the sidebar: the page stays where it is.
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    expect(lastFrame(instance.frames)).toContain("[ Bottom ]");
    instance.unmount();
  });
});

/** Forty lines of text, as program arguments. */
function textLines(prefix: string): string {
  return Array.from({ length: 40 }, (_, index) => `TextContent("${prefix} ${index}")`).join(", ");
}

/** Renders one page in the showcase with the keyboard only. */
function mountPage(page: ShowcasePage) {
  return render(
    <ShowcaseApp
      pages={[page]}
      tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
      mouse={false}
      stream={{ chunkSize: 5000, intervalMs: 1 }}
    />,
  );
}

/** The row of the page pane's bottom border: the first row with a "╰" corner. */
function paneBottomRow(frame: string): number {
  const lines = frame.split("\n");
  for (let y = 0; y < lines.length; y += 1) {
    if ((lines[y] ?? "").includes("╰")) return y;
  }
  throw new Error(`no bottom border in the frame:\n${frame}`);
}

describe("ShowcaseApp floats tooltips over the page pane", () => {
  it("shows the bubble of a trigger on the pane's last visible row over the pane's bottom border", async () => {
    const page: ShowcasePage = {
      id: "deep",
      title: "Deep",
      program:
        'root = Stack([CardHeader("Deep"), ' +
        textLines("above") +
        ', Tooltip(Button("Deploy", @ToAssistant("Deploy")), "Ships the build", "bottom"), ' +
        textLines("below") +
        "])",
    };
    const instance = mountPage(page);
    await settle(40);
    expect(lastFrame(instance.frames)).not.toContain("Deploy");
    // The sidebar starts focused: Tab reaches the theme select, then the page's only stop.
    instance.stdin.write(KEYS.TAB);
    await settle(10);
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    const frame = lastFrame(instance.frames);
    const trigger = findCell(frame, "[ Deploy ]");
    const border = paneBottomRow(frame);
    // Scrolled into view on the pane's last visible row, right above its bottom border.
    expect(trigger.y).toBe(border - 1);
    // The bubble's top edge covers the border row; its text sits on the row under it.
    expect(findCell(frame, "Ships the build").y).toBe(border + 1);
    instance.unmount();
  });

  it("hides the bubble while its trigger is scrolled out of the pane and shows it when it comes back", async () => {
    const page: ShowcasePage = {
      id: "top",
      title: "Top",
      program:
        'root = Stack([CardHeader("Top"), ' +
        'Tooltip(Button("Deploy", @ToAssistant("Deploy")), "Ships the build", "bottom"), ' +
        textLines("line") +
        "])",
    };
    const instance = mountPage(page);
    await settle(40);
    instance.stdin.write(KEYS.TAB);
    await settle(10);
    instance.stdin.write(KEYS.TAB);
    await settle(40);
    expect(lastFrame(instance.frames)).toContain("Ships the build");
    instance.stdin.write(KEYS.PAGE_DOWN);
    await settle(40);
    const scrolled = lastFrame(instance.frames);
    expect(scrolled).not.toContain("[ Deploy ]");
    expect(scrolled).not.toContain("Ships the build");
    instance.stdin.write(KEYS.PAGE_UP);
    await settle(40);
    const back = lastFrame(instance.frames);
    expect(back).toContain("[ Deploy ]");
    expect(back).toContain("Ships the build");
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

describe("ShowcaseApp dialog drag", () => {
  const NOTE_TITLE = "Draft saved";
  const NOTE_BODY = "Keep editing or close this note.";

  function dialogsPage(): ShowcasePage {
    const page = showcasePages.find(function isDialogs(candidate) {
      return candidate.id === "dialogs";
    });
    if (page === undefined) throw new Error("the showcase has no dialogs page");
    return page;
  }

  it("drags the note dialog by its title while the page stays where it is", async () => {
    const instance = render(
      <ShowcaseApp
        pages={[dialogsPage()]}
        tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
        mouse={true}
        stream={{ chunkSize: 5000, intervalMs: 1 }}
      />,
    );
    await settle(40);
    // Shift+Tab from the sidebar wraps to the page's last stop, the note's opener, and scrolls it into view.
    instance.stdin.write(KEYS.SHIFT_TAB);
    await settle(40);
    const opener = findCell(lastFrame(instance.frames), "[ Show a note ]");
    instance.stdin.write(KEYS.ENTER);
    await settle(40);
    const before = lastFrame(instance.frames);
    // The note floats on the row after the openers, under the pane's last visible row. Its
    // title row is the one over its body ("Draft saved" is in the event log too).
    const body = findCell(before, NOTE_BODY);
    const grab = { x: body.x + 4, y: body.y - 1 };
    expect(before.split("\n")[grab.y]).toContain(NOTE_TITLE);
    const firstOpener = findCell(before, "[ Delete a contact ]");
    const warning = findCell(before, "[ Show a warning ]");

    instance.stdin.write(MOUSE.press(grab.x, grab.y));
    await settle(10);
    instance.stdin.write(MOUSE.drag(grab.x - 2, grab.y - 1));
    await settle(10);
    instance.stdin.write(MOUSE.drag(grab.x - 6, grab.y - 3));
    await settle(10);
    instance.stdin.write(MOUSE.release(grab.x - 6, grab.y - 3));
    await settle(40);

    const after = lastFrame(instance.frames);
    expect(findCell(after, NOTE_BODY)).toEqual({ x: body.x - 6, y: body.y - 3 });
    expect(after.split("\n")[grab.y - 3]).toContain(NOTE_TITLE);
    expect(findCell(after, "[ Delete a contact ]")).toEqual(firstOpener);
    expect(findCell(after, "[ Show a warning ]")).toEqual(warning);
    expect(findCell(after, "[ Show a note ]")).toEqual(opener);
    expect(after).toContain(`dragend Dialog "${NOTE_TITLE}"`);
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
    instance.stdin.write(KEYS.TAB);
    await settle();
    const frame = lastFrame(instance.frames);
    expect(frame).toContain("Events (");
    expect(frame).toContain('focus Button "Ping"');
    expect(frame).toContain('blur ThemeSelect "theme"');
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
    expect(frame).toContain("Default ▾");
    expect(frame).toContain("Ctrl+T");
    expect(frame).not.toContain("╭ ");
    instance.stdin.write(CTRL_T);
    await settle(10);
    frame = lastFrame(instance.frames);
    expect(frame).toContain("Bordered ▾");
    expect(frame.split("╭").length).toBeGreaterThan(2);
    instance.stdin.write(CTRL_T);
    await settle(10);
    expect(lastFrame(instance.frames)).toContain("Minimal ▾");
    instance.unmount();
  });
});

describe("ShowcaseApp dim behind a modal", () => {
  const modalPages: ShowcasePage[] = [
    {
      id: "notice",
      title: "Notice",
      program: [
        "$open = true",
        'root = Stack([CardHeader("Notice"), Button("Reopen", @Set($open, true)), dialog])',
        'dialog = ModalDialog("info", "Saved notice", "Your changes are safe.", null, "OK", $open)',
      ].join("\n"),
    },
    { id: "beta", title: "Beta", program: 'root = Stack([CardHeader("Beta")])' },
  ];

  /** The last full frame with its escape codes. */
  function lastRawFrame(frames: string[]): string {
    for (let index = frames.length - 1; index >= 0; index -= 1) {
      const frame = frames[index] ?? "";
      if (!/^(\u001b\[\?\d+[hl])+$/.test(frame)) return frame;
    }
    return "";
  }

  /** The raw codes between `text` and the border just before it, on the line holding `text`. */
  function codesBefore(frame: string, text: string): string {
    const line =
      frame.split("\n").find(function has(candidate) {
        return stripAnsi(candidate).includes(text);
      }) ?? "";
    const at = line.indexOf(text);
    return line.slice(line.lastIndexOf("│", at) + 1, at);
  }

  it("dims the sidebar and the event log while a dialog of the page is open", async () => {
    const instance = render(
      <ShowcaseApp
        pages={modalPages}
        tools={createShowcaseTools({ latencyMs: 0, healthFailsFirst: false })}
        mouse={false}
        stream={{ chunkSize: 1000, intervalMs: 1 }}
      />,
    );
    await settle(40);
    const open = lastRawFrame(instance.frames);
    expect(stripAnsi(open)).toContain("Your changes are safe.");
    expect(codesBefore(open, "Beta")).toContain(DIM_ON);
    expect(codesBefore(open, "Events (")).toContain(DIM_ON);
    // OK closes it: nothing is dimmed any more.
    expect(inverseSegments(open)).toEqual(["[ OK ]"]);
    instance.stdin.write(KEYS.ENTER);
    await settle(40);
    const closed = lastRawFrame(instance.frames);
    // The event log names the dialog; its body is gone.
    expect(stripAnsi(closed)).not.toContain("Your changes are safe.");
    expect(codesBefore(closed, "Beta")).not.toContain(DIM_ON);
    expect(codesBefore(closed, "Events (")).not.toContain(DIM_ON);
    instance.unmount();
  });
});
