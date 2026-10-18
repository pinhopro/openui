import { describe, expect, it } from "vitest";
import { contactLines } from "../../examples/showcase/chat-contact-lines";

describe("contactLines", () => {
  it("right-aligns the time after the padded name and the badge after the preview", () => {
    const lines = contactLines(
      {
        marker: "▎",
        initials: "CR",
        name: "Carlos Ruiz",
        preview: "Perfect, I'll review it now. Thanks!",
        time: "10:42",
        unread: 3,
      },
      34,
    );
    const first = lines.marker + lines.initials + " " + lines.name + lines.time;
    const second = " ".repeat(4) + lines.preview + lines.badge;
    expect(first.length).toBe(34);
    expect(second.length).toBe(34);
    expect(first.startsWith("▎CR Carlos Ruiz")).toBe(true);
    expect(first.endsWith("10:42")).toBe(true);
    expect(second.endsWith(" 3 ")).toBe(true);
    expect(lines.preview.endsWith("… ")).toBe(true);
  });

  it("leaves the badge out without unread messages and cuts a long name", () => {
    const lines = contactLines(
      {
        marker: " ",
        initials: "A",
        name: "A very long conversation name that does not fit",
        preview: "ok",
        time: "Yesterday",
        unread: 0,
      },
      30,
    );
    expect(lines.badge).toBe("");
    expect(lines.initials).toBe("A ");
    expect((lines.marker + lines.initials + " " + lines.name + lines.time).length).toBe(30);
    expect(lines.name.includes("…")).toBe(true);
  });
});
