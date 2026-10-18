import type { ComputedStyle } from "./declarations";

/** The Ink `Box` size and margin props a computed style asks for. */
export interface LayoutBoxProps {
  marginX: number | undefined;
  marginY: number | undefined;
  width: number | undefined;
  minWidth: number | undefined;
  maxWidth: number | undefined;
  height: number | undefined;
  minHeight: number | undefined;
}

export function layoutBoxProps(style: ComputedStyle): LayoutBoxProps {
  return {
    marginX: style.marginX,
    marginY: style.marginY,
    width: style.width,
    minWidth: style.minWidth,
    maxWidth: style.maxWidth,
    height: style.height,
    minHeight: style.minHeight,
  };
}

/** `text` with the style's `text-transform` applied. */
export function transformText(text: string, transform: ComputedStyle["transform"]): string {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  return text;
}
