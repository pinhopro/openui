import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { InkBoxProps, InkTextProps } from "../theme-styles";

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

/**
 * What a dialog draws: a bordered box with the variant mark and the title
 * (and a control at the end of the title line), the body text, the content
 * and the row of buttons, at a preferred width or fitting its content up to
 * a limit. Every style comes in through the props and it reads
 * no dialog state, so the dialog's overlay `render` can draw it without
 * hooks of its own.
 */
export function DialogSurface(props: DialogSurfaceProps) {
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
        <Box flexDirection="row" justifyContent="space-between" gap={2}>
          <Text>
            {props.mark === null ? null : (
              <Text color={props.markColor} bold>
                {props.mark + " "}
              </Text>
            )}
            <Text {...props.titleText}>{props.title}</Text>
          </Text>
          {props.titleAction}
        </Box>
        {props.body === null ? null : <Text {...props.bodyText}>{props.body}</Text>}
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
