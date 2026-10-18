/** The Ink Text styles a TextContent size maps to. */
export interface TextContentStyle {
  bold: boolean;
  dimColor: boolean;
  underline: boolean;
}

/** Terminal approximation of the five TextContent sizes. */
export function textContentStyle(size: string | undefined): TextContentStyle {
  switch (size) {
    case "small":
      return { bold: false, dimColor: true, underline: false };
    case "small-heavy":
      return { bold: true, dimColor: true, underline: false };
    case "large":
      return { bold: true, dimColor: false, underline: false };
    case "large-heavy":
      return { bold: true, dimColor: false, underline: true };
    default:
      return { bold: false, dimColor: false, underline: false };
  }
}
