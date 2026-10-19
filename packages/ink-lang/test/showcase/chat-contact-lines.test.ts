import { describe, expect, it } from "vitest";
import { contactLines, type ContactLines } from "../../examples/showcase/chat-contact-lines";

function firstLine(lines: ContactLines): string {
  return lines.name + lines.pin + lines.time;
}

function secondLine(lines: ContactLines): string {
  return lines.ticks + lines.preview + lines.mute + lines.badge;
}

describe("contactLines", () => {
  it("right-aligns the pin and time after the padded name, the mute mark and badge after the preview", () => {
    const lines = contactLines(
      {
        name: "Carlos Ruiz",
        preview: "Perfect, I'll review it now. Thanks!",
        time: "10:42",
        unread: 3,
        pinned: true,
        muted: true,
        receipt: "read",
      },
      28,
    );
    expect(firstLine(lines).length).toBe(28);
    expect(secondLine(lines).length).toBe(28);
    expect(firstLine(lines).startsWith("Carlos Ruiz")).toBe(true);
    expect(firstLine(lines).endsWith("⚲ 10:42")).toBe(true);
    expect(lines.ticks).toBe("✓✓ ");
    expect(secondLine(lines).endsWith("⊘  3 ")).toBe(true);
    expect(lines.preview.endsWith("… ")).toBe(true);
  });

  it("shows one tick for a sent message, two for delivered, none for a received one", () => {
    const base = { name: "A", preview: "ok", time: "9:00", unread: 0, pinned: false, muted: false };
    expect(contactLines({ ...base, receipt: "sent" }, 20).ticks).toBe("✓ ");
    expect(contactLines({ ...base, receipt: "delivered" }, 20).ticks).toBe("✓✓ ");
    expect(contactLines({ ...base, receipt: undefined }, 20).ticks).toBe("");
  });

  it("leaves the marks and badge out when they do not apply and cuts a long name", () => {
    const lines = contactLines(
      {
        name: "A very long conversation name that does not fit",
        preview: "ok",
        time: "Yesterday",
        unread: 0,
        pinned: false,
        muted: false,
        receipt: undefined,
      },
      24,
    );
    expect(lines.badge).toBe("");
    expect(lines.mute).toBe("");
    expect(lines.pin).toBe("");
    expect(firstLine(lines).length).toBe(24);
    expect(secondLine(lines).length).toBe(24);
    expect(lines.name.includes("…")).toBe(true);
  });

  it("caps the badge at 99+", () => {
    const lines = contactLines(
      { name: "A", preview: "ok", time: "9:00", unread: 120, pinned: false, muted: false },
      24,
    );
    expect(lines.badge).toBe(" 99+ ");
  });
});
