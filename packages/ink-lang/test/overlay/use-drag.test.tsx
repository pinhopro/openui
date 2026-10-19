import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import type { MouseEvent } from "../../src/mouse/mouse-sequence";
import { useDrag, type DragState } from "../../src/overlay/use-drag";
import { UiEventContext, type UiEvent } from "../../src/ui-events";
import { settle } from "../helpers/settle";

/** The drag state of the Harness's latest render. */
const latest: { drag: DragState | null } = { drag: null };

function ignoreDrop(): void {}

interface HarnessProps {
  enabled: boolean;
}

/** A dialog's drag with nothing drawn: the test calls its handlers as the dispatcher would. */
function Harness({ enabled }: HarnessProps) {
  latest.drag = useDrag({ enabled, name: "Note", component: "Dialog", onDrop: ignoreDrop });
  return null;
}

function leftPress(x: number, y: number): MouseEvent {
  return { kind: "down", button: "left", x, y, shift: false, alt: false, ctrl: false };
}

function currentDrag(): DragState {
  if (latest.drag === null) throw new Error("the Harness has not rendered");
  return latest.drag;
}

describe("useDrag", () => {
  it("starts no drag from a press that reaches handlers of a render before it was disabled", async () => {
    const events: UiEvent[] = [];
    function record(event: UiEvent): void {
      events.push(event);
    }
    const instance = render(
      <UiEventContext.Provider value={record}>
        <Harness enabled={true} />
      </UiEventContext.Provider>,
    );
    await settle();
    // The handlers a mouse target registered while it was enabled, before the disabled render's.
    const stale = currentDrag().handlers;
    instance.rerender(
      <UiEventContext.Provider value={record}>
        <Harness enabled={false} />
      </UiEventContext.Provider>,
    );
    await settle();
    stale.onMouseDown?.(leftPress(3, 1));
    await settle();
    expect(events).toEqual([]);
    expect(currentDrag().isDragging).toBe(false);
    instance.unmount();
  });
});
