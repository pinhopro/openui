import { describe, expect, it, vi } from "vitest";
import { chatLibrary } from "../../examples/showcase/chat-library";
import { chatProgram } from "../../examples/showcase/programs/chat";
import type { UiEvent } from "../../src/ui-events";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

// Ink downsamples hex colors to the 16 ANSI colors at the default color level;
// the chat's selection and read-tick colors only tell apart in truecolor.
vi.hoisted(function forceTruecolor() {
  process.env["FORCE_COLOR"] = "3";
});

/** The background Ink writes for the selected and focused contact row (#2a3942). */
const SELECTED_BG = "\u001b[48;2;42;57;66m";
/** The color of read ticks (#53bdeb). */
const READ_BLUE = "\u001b[38;2;83;189;235m";

function lineWith(frame: string, text: string): string {
  return frame.split("\n").find((line) => stripAnsi(line).includes(text)) ?? "";
}

describe("the chat page", () => {
  it("lays the chat list and the conversation out like a chat app", async () => {
    const reports: unknown[][] = [];
    const rendered = await renderProgram(chatLibrary, chatProgram, {
      onError: function record(errors) {
        reports.push(errors);
      },
    });
    expect(reports[reports.length - 1] ?? []).toEqual([]);
    const frame = rendered.frame();
    const plain = stripAnsi(frame);
    expect(plain).toContain(" Chats");
    expect(plain).toContain("Search or start a new chat");
    expect(plain).toContain("[✓ All]");
    for (const name of ["Carlos Ruiz", "Legal team", "Laura Gómez", "Acme Project", "Support"]) {
      expect(plain).toContain(name);
    }
    // The chat list: pin and time on the first line, ticks, mute mark and badge on the second.
    expect(lineWith(plain, "Legal team")).toMatch(/Legal team +⚲ 10:38/);
    expect(lineWith(plain, "Lucía:")).toMatch(/ 3 /);
    expect(lineWith(plain, "Diego:")).toMatch(/⊘  12 /);
    expect(lineWith(plain, "Sent the documents.")).toContain("✓✓ Sent the documents.");
    expect(lineWith(frame, "Sent the documents.")).toContain(READ_BLUE);
    // The selected contact carries the highlight; the others do not.
    expect(lineWith(frame, "⚲ 10:42")).toContain(SELECTED_BG);
    expect(lineWith(frame, "Laura Gómez")).not.toContain(SELECTED_BG);
    // The conversation: header, date pill, bubbles with time and ticks, typing, composer.
    expect(plain).toContain("online");
    expect(plain).toContain(" TODAY ");
    expect(lineWith(plain, "contract?")).toMatch(/contract\? +10:30/);
    expect(lineWith(plain, "Legal's changes.")).toMatch(/10:32 ✓✓/);
    expect(lineWith(frame, "Legal's changes.")).toContain(READ_BLUE);
    expect(lineWith(plain, "to you today.")).toMatch(/10:44 ✓✓/);
    expect(lineWith(frame, "to you today.")).not.toContain(READ_BLUE);
    expect(plain).toContain("▌ Carlos Ruiz");
    expect(plain).toContain("▣ Service agreement.pdf");
    expect(plain).toContain("[ Open ]");
    expect(plain).toContain("● ● ●");
    expect(plain).toContain("Type a message");
    expect(plain).toContain("◉");
    // The newest messages show; the list starts scrolled past yesterday's.
    expect(plain).not.toContain("YESTERDAY");
    // Sent bubbles sit against the right edge, received ones against the left.
    expect(findCell(plain, "Perfect, I'll review it now.").x).toBeLessThan(
      findCell(plain, "Sure, I'll check with").x,
    );
    expect(lineWith(plain, "to you today.").trimEnd().length).toBeGreaterThan(95);
    // The date pill sits in the middle of the message area.
    expect(findCell(plain, " TODAY ").x).toBeGreaterThan(55);
    rendered.unmount();
  });

  it("keeps every line of the screen within 100 cells", async () => {
    const rendered = await renderProgram(chatLibrary, chatProgram);
    for (const line of stripAnsi(rendered.frame()).split("\n")) {
      expect(Array.from(line).length, line).toBeLessThanOrEqual(100);
    }
    rendered.unmount();
  });

  it("walks the sidebar, the header, the attachment and the composer with Tab", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(chatLibrary, chatProgram, {
      onUiEvent: function record(event) {
        events.push(event);
      },
    });
    for (let step = 0; step < 17; step += 1) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    const focused: string[] = [];
    for (const event of events) {
      if (event.type === "focus") focused.push(event.name);
    }
    expect(focused).toEqual([
      "New chat",
      "Menu",
      "search",
      "filter",
      "Carlos Ruiz",
      "Legal team",
      "Laura Gómez",
      "Miguel Torres",
      "Acme Project",
      "Sofía Herrera",
      "Support",
      "Call",
      "Search in chat",
      "Chat menu",
      "Service agreement.pdf",
      "Emoji",
      "Attach",
    ]);
    rendered.unmount();
  });

  it("selects a contact on a click and scrolls the messages with the wheel", async () => {
    const onStateUpdate = vi.fn();
    const rendered = await renderProgram(chatLibrary, chatProgram, {
      mouse: true,
      onStateUpdate,
    });
    let plain = stripAnsi(rendered.frame());
    const laura = findCell(plain, "Laura Gómez");
    rendered.instance.stdin.write(MOUSE.click(laura.x, laura.y));
    await settle();
    expect(onStateUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ $chat: "laura" }));
    let frame = rendered.frame();
    expect(lineWith(frame, "Laura Gómez")).toContain(SELECTED_BG);
    expect(lineWith(frame, "⚲ 10:42")).not.toContain(SELECTED_BG);
    // Wheel up over the message area reveals yesterday's messages.
    plain = stripAnsi(frame);
    const bubble = findCell(plain, "Perfect, I'll review it now.");
    rendered.instance.stdin.write(MOUSE.wheelUp(bubble.x, bubble.y, 6));
    await settle();
    plain = stripAnsi(rendered.frame());
    expect(plain).toContain("YESTERDAY");
    rendered.instance.stdin.write(MOUSE.wheelDown(bubble.x, bubble.y, 10));
    await settle();
    frame = rendered.frame();
    expect(stripAnsi(frame)).not.toContain("YESTERDAY");
    rendered.unmount();
  });

  it("swaps the microphone for Send once a draft is typed and sends it with the draft", async () => {
    const onAction = vi.fn();
    const rendered = await renderProgram(chatLibrary, chatProgram, { onAction });
    const plain = stripAnsi(rendered.frame());
    const field = findCell(plain, "Type a message");
    expect(plain).toContain("◉");
    // Tab to the draft field (after the attach button), type, then Tab to Send and press it.
    for (let step = 0; step < 18; step += 1) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    rendered.instance.stdin.write("hello");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("➤");
    expect(stripAnsi(rendered.frame())).not.toContain("◉");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ humanFriendlyMessage: "Send to Carlos Ruiz: hello" }),
    );
    void field;
    rendered.unmount();
  });
});
