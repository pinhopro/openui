import { countGraphemes } from "../../src/components/text-editing";

export interface ContactLineInput {
  initials: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  marker: string;
}

/** The two lines of a contact row, each split into the segments the stylesheet addresses. */
export interface ContactLines {
  marker: string;
  initials: string;
  name: string;
  time: string;
  preview: string;
  /** ` 3 ` or an empty string. */
  badge: string;
}

function cut(text: string, width: number): string {
  const characters = Array.from(text);
  if (characters.length <= width) return text;
  const kept = characters.slice(0, Math.max(0, width - 1));
  return kept.join("") + "…";
}

function padEnd(text: string, width: number): string {
  const missing = width - countGraphemes(text);
  return missing > 0 ? text + " ".repeat(missing) : text;
}

/**
 * Lays a contact row out in `width` cells: marker, two initials, a space,
 * the name padded up to the right-aligned time; under it the preview padded
 * up to the unread badge. Everything is cut so the row never wraps.
 */
export function contactLines(input: ContactLineInput, width: number): ContactLines {
  const initials = padEnd(Array.from(input.initials).slice(0, 2).join(""), 2);
  const lead = countGraphemes(input.marker) + 2 + 1;
  const time = input.time;
  const nameWidth = Math.max(1, width - lead - countGraphemes(time) - 1);
  const name = padEnd(cut(input.name, nameWidth), nameWidth) + " ";
  const badge = input.unread > 0 ? ` ${input.unread} ` : "";
  const previewWidth = Math.max(1, width - lead - countGraphemes(badge) - (badge === "" ? 0 : 1));
  const preview =
    padEnd(cut(input.preview, previewWidth), previewWidth) + (badge === "" ? "" : " ");
  return { marker: input.marker, initials, name, time, preview, badge };
}
