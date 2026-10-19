import { Box, Text, type DOMElement } from "ink";
import type { ReactNode, RefObject } from "react";
import { useOverlayWidthLimit } from "../overlay/overlay-content-context";
import type { InkBoxProps, InkTextProps } from "../theme-styles";
import { wrapWords } from "./wrap-words";

export interface DialogSurfaceProps {
  /**
   * The width the dialog takes (Modal's size), narrower when its bounds are;
   * undefined to fit its content.
   */
  width: number | undefined;
  /** The widest a dialog that fits its content grows (its text wraps there); undefined for no limit. */
  maxWidth: number | undefined;
  /** The border drawn around the dialog. */
  borderStyle: InkBoxProps["borderStyle"];
  borderColor: string | undefined;
  /** The dialog's own background; undefined keeps the one it is painted with. */
  background: string | undefined;
  paddingX: number | undefined;
  paddingY: number | undefined;
  /** The variant mark before the title (`ⓘ`, `⚠`...); null for none. */
  mark: string | null;
  markColor: string | undefined;
  title: string;
  titleText: InkTextProps;
  /** Put on the title row: the box the dialog is dragged by; undefined for none. */
  titleRef: RefObject<DOMElement | null> | undefined;
  /** The dialog is being dragged: its title is drawn bold and inverse. */
  dragging: boolean;
  /** A control at the right end of the title line (Modal's `[ x ]`); null for none. */
  titleAction: ReactNode;
  /** A text under the title (ModalDialog's body); null for none. */
  body: string | null;
  bodyText: InkTextProps;
  /** Content under the body (Modal's children). */
  children?: ReactNode;
  /** The row of buttons at the bottom, one cell apart; null for none. */
  buttons: ReactNode;
}

/** No limit on a body line: a dialog with neither a width nor a limit, outside any overlay. */
const UNLIMITED = Number.MAX_SAFE_INTEGER;

/**
 * The widest a body line may be: the dialog's width (`width`, else
 * `maxWidth`), narrower when the overlay form is (`limit`, the bounds'
 * width), minus the borders and the padding on both sides; at least 1.
 */
function bodyWidth(props: DialogSurfaceProps, limit: number | null): number {
  const preferred = props.width ?? props.maxWidth ?? UNLIMITED;
  const outer = limit === null ? preferred : Math.min(preferred, limit);
  const border = props.borderStyle === undefined ? 0 : 1;
  const padding = props.paddingX ?? 0;
  return Math.max(1, outer - 2 * border - 2 * padding);
}

interface DialogBodyProps {
  lines: string[];
  text: InkTextProps;
}

/** The body, one `Text` per wrapped line (an empty line keeps its row). */
function DialogBody({ lines, text }: DialogBodyProps) {
  const rows: ReactNode[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    rows.push(
      <Text key={index} {...text} wrap="truncate">
        {line === "" ? " " : line}
      </Text>,
    );
  }
  return <Box flexDirection="column">{rows}</Box>;
}

/**
 * What a dialog draws: a bordered box with the variant mark and the title
 * (and a control at the end of the title line, the row it is dragged by,
 * drawn bold and inverse while dragged), the body text, the content
 * and the row of buttons, at a preferred width or fitting its content up to
 * a limit. The body is wrapped between words (`wrapWords`) to the width it
 * has inside the borders and the padding, so no line starts with the space
 * it broke at. Every style comes in through the props and it reads no
 * dialog state (only the overlay's width limit), so the dialog's overlay
 * `render` can draw it without hooks of its own.
 */
export function DialogSurface(props: DialogSurfaceProps) {
  const limit = useOverlayWidthLimit();
  const titleText = props.dragging
    ? { ...props.titleText, bold: true, inverse: true }
    : props.titleText;
  // A row around it, so a preferred width (the flex basis) shrinks to fit narrower bounds.
  return (
    <Box flexDirection="row">
      <Box
        flexDirection="column"
        width={props.width}
        flexShrink={1}
        maxWidth={props.maxWidth}
        borderStyle={props.borderStyle}
        borderColor={props.borderColor}
        backgroundColor={props.background}
        paddingX={props.paddingX}
        paddingY={props.paddingY}
      >
        <Box ref={props.titleRef} flexDirection="row" justifyContent="space-between" gap={2}>
          <Text>
            {props.mark === null ? null : (
              <Text color={props.markColor} bold>
                {props.mark + " "}
              </Text>
            )}
            <Text {...titleText}>{props.title}</Text>
          </Text>
          {props.titleAction}
        </Box>
        {props.body === null ? null : (
          <DialogBody
            lines={wrapWords(props.body, bodyWidth(props, limit))}
            text={props.bodyText}
          />
        )}
        {props.children === undefined ? null : <Box flexDirection="column">{props.children}</Box>}
        {props.buttons === null ? null : (
          <Box flexDirection="row" gap={1} marginTop={1}>
            {props.buttons}
          </Box>
        )}
      </Box>
    </Box>
  );
}
