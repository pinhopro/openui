import { Box, type DOMElement } from "ink";
import type { ReactNode, RefObject } from "react";
import { MouseLayerContext } from "../mouse/mouse-layer";
import { BridgedContexts, type CapturedContexts } from "./context-bridge";
import { OverlayIdContext, OverlayVisibleContext } from "./overlay-content-context";
import { OverlayFill } from "./overlay-fill";
import type { FormSpot } from "./overlay-measure";
import { OverlayMouseShield } from "./overlay-mouse-shield";

export interface OverlayBoxProps {
  /**
   * Where the form is drawn, relative to the host box, the widest it may be
   * (an absolute box in the host's empty box is otherwise as wide as its
   * longest line, past the terminal's edge) and whether it shows.
   */
  spot: FormSpot;
  /** The overlay's id, provided to its content (`useOverlayId`). */
  overlayId: string;
  /** The box the host measures. */
  boxRef: RefObject<DOMElement | null>;
  /** The owner's contexts, re-provided around the content. */
  captured: CapturedContexts;
  /** The mouse layer the content paints in (stacking index plus one). */
  layer: number;
  /** Blank cells under the content once it shows. */
  opaque: boolean;
  /**
   * The background of the cells under the anchor: an opaque box is painted
   * with it and its content inherits it, as it would in the anchor's place;
   * content that sets its own background keeps it. Null for none.
   */
  background: string | null;
  /** The form's content. */
  render: () => ReactNode;
}

interface OverlayContentProps {
  render: () => ReactNode;
}

/**
 * One overlay's content, in a component of its own: hooks called by a
 * `render` that breaks the no-hooks rule stay out of the host's hook order.
 */
function OverlayContent({ render }: OverlayContentProps) {
  return render();
}

/**
 * One form of an overlay in an absolutely positioned box: the content with
 * its owner's contexts in the overlay's mouse layer. While it shows, an
 * opaque one is filled first (with the anchor's background) and the box
 * takes the presses and clicks on its cells; while it is only measured
 * (below the root) it does neither and its content is inert: told so through
 * `OverlayVisibleContext`, its focus stops leave the Tab cycle and its mouse
 * targets take nothing. The content knows its overlay through
 * `OverlayIdContext`; both are provided below the bridged contexts. The fill
 * and the shield keep their slots, so the content never remounts when the
 * form starts to show. A cover form's box spans the bounds (`spot.width` by
 * `spot.height`) and its content column grows to fill it, so a backdrop can.
 */
export function OverlayBox(props: OverlayBoxProps) {
  const spot = props.spot;
  return (
    <Box
      ref={props.boxRef}
      position="absolute"
      left={spot.x}
      top={spot.y}
      maxWidth={spot.maxWidth}
      width={spot.cover ? spot.width : undefined}
      height={spot.cover ? spot.height : undefined}
      // A row, so Yoga fits the width to the limit first and then sizes the
      // height from the wrapped content; a column box would keep the height
      // of the unwrapped content and cut the wrapped rows.
      flexDirection="row"
      backgroundColor={props.opaque && props.background !== null ? props.background : undefined}
    >
      {props.opaque && spot.visible ? (
        <OverlayFill width={spot.width} height={spot.height} />
      ) : null}
      <BridgedContexts captured={props.captured}>
        <MouseLayerContext.Provider value={props.layer}>
          <OverlayIdContext.Provider value={props.overlayId}>
            <OverlayVisibleContext.Provider value={spot.visible}>
              {spot.visible ? <OverlayMouseShield boxRef={props.boxRef} /> : null}
              <Box flexDirection="column" flexGrow={spot.cover ? 1 : 0}>
                <OverlayContent render={props.render} />
              </Box>
            </OverlayVisibleContext.Provider>
          </OverlayIdContext.Provider>
        </MouseLayerContext.Provider>
      </BridgedContexts>
    </Box>
  );
}
