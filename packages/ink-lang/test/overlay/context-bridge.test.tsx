import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { useOpenUI } from "../../src/context";
import { inkLibrary } from "../../src/default-library";
import { useElementPath } from "../../src/element-type-context";
import { FocusScope } from "../../src/focus/focus-scope";
import { useLayerIsActive } from "../../src/focus/modal-layer";
import { useSequencePath } from "../../src/focus/sequence-path";
import { InkRenderer } from "../../src/ink-renderer";
import { createLibrary, defineComponent, type Library } from "../../src/library";
import {
  BridgedContexts,
  useCapturedContexts,
  type CapturedContexts,
} from "../../src/overlay/context-bridge";
import { useTheme, type InkTheme, type InkThemeOverrides } from "../../src/theme";
import { settle } from "../helpers/settle";

/** What the Capture component saw inside the renderer, on its latest render. */
const capture: { contexts: CapturedContexts | null; theme: InkTheme | null } = {
  contexts: null,
  theme: null,
};

function CaptureRenderer() {
  capture.contexts = useCapturedContexts();
  capture.theme = useTheme();
  return null;
}

const Capture = defineComponent({
  name: "Capture",
  description: "Captures the contexts it renders in",
  props: z.object({}),
  component: CaptureRenderer,
});

const bridgeLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Capture]),
});

interface ProbeReading {
  elementPath: string[];
  sequencePath: number[];
  layerIsActive: boolean;
  library: Library;
  theme: InkTheme;
}

/** What the Probe read on its latest render, through the bridge. */
const probe: { reading: ProbeReading | null } = { reading: null };

function ProbeReader() {
  probe.reading = {
    elementPath: useElementPath(),
    sequencePath: useSequencePath(),
    layerIsActive: useLayerIsActive(),
    library: useOpenUI().library,
    theme: useTheme(),
  };
  return null;
}

/** Rendered outside the renderer: reads its contexts through the bridge once a capture exists. */
function Probe({ captured }: { captured: CapturedContexts | null }) {
  if (captured === null) return null;
  return (
    <BridgedContexts captured={captured}>
      <ProbeReader />
    </BridgedContexts>
  );
}

/** A non-default theme, kept stable across renders like a host would. */
const THEME: InkThemeOverrides = { accent: "magenta" };

function App() {
  return (
    <FocusScope>
      <InkRenderer response="root = Stack([Capture()])" library={bridgeLibrary} theme={THEME} />
      <Probe captured={capture.contexts} />
    </FocusScope>
  );
}

/** Forgets what Capture and the Probe read in an earlier test. */
function clearReadings(): void {
  capture.contexts = null;
  capture.theme = null;
  probe.reading = null;
}

describe("context bridge", () => {
  it("hands a component's contexts to content rendered outside its subtree", async () => {
    clearReadings();
    const instance = render(<App />);
    await settle();
    expect(capture.contexts).not.toBeNull();
    expect(probe.reading).toBeNull();
    instance.rerender(<App />);
    await settle();
    const reading = probe.reading;
    expect(reading).not.toBeNull();
    expect(reading?.elementPath).toEqual(["Stack", "Capture"]);
    expect(reading?.sequencePath).toEqual(capture.contexts?.sequencePath);
    expect(reading?.sequencePath.length).toBeGreaterThan(0);
    expect(reading?.layerIsActive).toBe(true);
    expect(reading?.library).toBe(bridgeLibrary);
    expect(reading?.theme).toBe(capture.theme);
    expect(reading?.theme.accent).toBe("magenta");
    instance.unmount();
  });
});
