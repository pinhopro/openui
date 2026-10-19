import { Box, type DOMElement } from "ink";
import type { ReactNode, RefObject } from "react";
import { MouseLayerContext } from "../mouse/mouse-layer";
import { BridgedContexts, type CapturedContexts } from "./context-bridge";
import { OverlayFill } from "./overlay-fill";
import type { FormSpot } from "./overlay-measure";
import { OverlayMouseShield } from "./overlay-mouse-shield";

export interface OverlayBoxProps {
  /** Where the form is drawn, relative to the host box, and whether it shows. */
  spot: FormSpot;
  /** The box the host measures. */
  boxRef: RefObject<DOMElement | null>;
  /** The owner's contexts, re-provided around the content. */
  captured: CapturedContexts;
  /** The mouse layer the content paints in (stacking index plus one). */
  layer: number;
  /** Blank cells under the content once it shows. */
  opaque: boolean;
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
 * opaque one is filled first and the box takes the presses and clicks on its
 * cells; while it is only measured (below the root) it does neither. The
 * fill and the shield keep their slots, so the content never remounts when
 * the form starts to show.
 */
export function OverlayBox(props: OverlayBoxProps) {
  const spot = props.spot;
  return (
    <Box ref={props.boxRef} position="absolute" left={spot.x} top={spot.y} flexDirection="column">
      {props.opaque && spot.visible ? (
        <OverlayFill width={spot.width} height={spot.height} />
      ) : null}
      <BridgedContexts captured={props.captured}>
        <MouseLayerContext.Provider value={props.layer}>
          {spot.visible ? <OverlayMouseShield boxRef={props.boxRef} /> : null}
          <OverlayContent render={props.render} />
        </MouseLayerContext.Provider>
      </BridgedContexts>
    </Box>
  );
}
