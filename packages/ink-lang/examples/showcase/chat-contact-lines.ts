import { countGraphemes } from "../../src/components/text-editing";

export type ContactReceipt = "sent" | "delivered" | "read";

export interface ContactLineInput {
  name: string;
  preview: string;
  time: string;
  unread: number;
  pinned: boolean;
  muted: boolean;
  /** The receipt of the last message when it was sent by the user; nothing for a received one. */
  receipt?: ContactReceipt | undefined;
}

/**
 * The two text lines of a contact row (after the avatar block), each split
 * into the segments the stylesheet addresses. Every segment is padded or cut
 * so the line is exactly the width asked for.
 */
export interface ContactLines {
  /** The name padded (or cut) up to the pin and time. */
  name: string;
  /** `⚲ ` when pinned, else an empty string. */
  pin: string;
  time: string;
  /** `✓ `, `✓✓ ` or an empty string, before the preview. */
  ticks: string;
  /** The preview padded (or cut) up to the mute mark and badge. */
  preview: string;
  /** `⊘ ` when muted, else an empty string. */
  mute: string;
  /** ` 3 ` or an empty string. */
  badge: string;
}

const PIN = "⚲ ";
const MUTE = "⊘ ";
const MAX_BADGE = 99;

/** `text` cut to `width` user-perceived characters, ending with an ellipsis when something was dropped. */
export function cutText(text: string, width: number): string {
  const characters = Array.from(text);
  if (characters.length <= width) return text;
  const kept = characters.slice(0, Math.max(0, width - 1));
  return kept.join("") + "…";
}

function padEnd(text: string, width: number): string {
  const missing = width - countGraphemes(text);
  return missing > 0 ? text + " ".repeat(missing) : text;
}

/** The ticks before a preview the user sent: one when sent, two when delivered or read. */
export function receiptTicks(receipt: ContactReceipt | undefined): string {
  if (receipt === "sent") return "✓ ";
  if (receipt === "delivered" || receipt === "read") return "✓✓ ";
  return "";
}

/** ` 3 `, ` 99+ ` or an empty string when nothing is unread. */
export function unreadBadge(unread: number): string {
  if (unread <= 0) return "";
  return unread > MAX_BADGE ? ` ${MAX_BADGE}+ ` : ` ${unread} `;
}

export function contactLines(input: ContactLineInput, width: number): ContactLines {
  const pin = input.pinned ? PIN : "";
  const time = input.time;
  const nameWidth = Math.max(1, width - countGraphemes(pin) - countGraphemes(time) - 1);
  const name = padEnd(cut(input.name, nameWidth), nameWidth) + " ";
  const ticks = receiptTicks(input.receipt);
  const badge = unreadBadge(input.unread);
  const mute = input.muted ? MUTE : "";
  const tail = countGraphemes(mute) + countGraphemes(badge);
  const previewWidth = Math.max(1, width - countGraphemes(ticks) - tail - (tail === 0 ? 0 : 1));
  const preview = padEnd(cut(input.preview, previewWidth), previewWidth) + (tail === 0 ? "" : " ");
  return { name, pin, time, ticks, preview, mute, badge };
}

function cut(text: string, width: number): string {
  return cutText(text, width);
}
