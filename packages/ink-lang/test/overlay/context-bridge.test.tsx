import { Box } from "ink";
import { render } from "ink-testing-library";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { OpenUIContext, useOpenUI } from "../../src/context";
import { inkLibrary } from "../../src/default-library";
import { DesignSystemContext } from "../../src/design/design-system-context";
import { ElementPathContext, useElementPath } from "../../src/element-type-context";
import { FocusCommandsContext } from "../../src/focus/focus-commands";
import { FocusCycleContext } from "../../src/focus/focus-cycle";
import { FocusRegistryContext } from "../../src/focus/focus-registry";
import { FocusScope } from "../../src/focus/focus-scope";
import { LayerIdContext, ModalLayerContext, useLayerIsActive } from "../../src/focus/modal-layer";
import { ProgramRankContext } from "../../src/focus/program-rank";
import { SequencePathContext, useSequencePath } from "../../src/focus/sequence-path";
import { FormNameContext } from "../../src/form-name-context";
import { FormValidationContext, useCreateFormValidation } from "../../src/form-validation-context";
import { InkRenderer } from "../../src/ink-renderer";
import { createLibrary, defineComponent, type Library } from "../../src/library";
import { MouseContext } from "../../src/mouse/mouse-provider";
import {
  BridgedContexts,
  useCapturedContexts,
  type CapturedContexts,
} from "../../src/overlay/context-bridge";
import { ThemeContext, useTheme, type InkTheme, type InkThemeOverrides } from "../../src/theme";
import { UiEventContext } from "../../src/ui-events";
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

  it("re-provides every captured context, each the very value read where it was captured", async () => {
    clearAllReadings();
    const instance = render(<AllApp />);
    await settle();
    expect(all.captured).not.toBeNull();
    instance.rerender(<AllApp />);
    await settle();
    const captured = all.captured as CapturedContexts;
    const direct = all.direct as CapturedContexts;
    const given = all.given as CapturedContexts;
    const bridged = all.bridged as CapturedContexts;
    const outside = all.outside as CapturedContexts;
    expect(given).not.toBeNull();
    expect(bridged).not.toBeNull();
    expect(Object.keys(captured).sort()).toEqual([...CONTEXT_FIELDS].sort());
    for (const field of CONTEXT_FIELDS) {
      // useCapturedContexts reads each context where the component renders...
      expect(Object.is(captured[field], direct[field]), `${field} captured`).toBe(true);
      // ...BridgedContexts hands the captured value to content rendered elsewhere...
      expect(Object.is(bridged[field], given[field]), `${field} bridged`).toBe(true);
      // ...where, without the bridge, the context holds something else.
      expect(Object.is(outside[field], given[field]), `${field} outside`).toBe(false);
    }
    instance.unmount();
  });
});

/** The fifteen fields of CapturedContexts, one per bridged library context. */
const CONTEXT_FIELDS: (keyof CapturedContexts)[] = [
  "openUI",
  "theme",
  "designSystem",
  "uiEvents",
  "focusRegistry",
  "focusCommands",
  "modalLayers",
  "layerId",
  "elementPath",
  "sequencePath",
  "formName",
  "formValidation",
  "mouse",
  "programRanks",
  "focusCycle",
];

/**
 * A test-only reader of all fifteen library contexts, written apart from
 * useCapturedContexts so a context that hook forgot would show here.
 */
function useAllContexts(): CapturedContexts {
  return {
    openUI: useContext(OpenUIContext),
    theme: useContext(ThemeContext),
    designSystem: useContext(DesignSystemContext),
    uiEvents: useContext(UiEventContext),
    focusRegistry: useContext(FocusRegistryContext),
    focusCommands: useContext(FocusCommandsContext),
    modalLayers: useContext(ModalLayerContext),
    layerId: useContext(LayerIdContext),
    elementPath: useContext(ElementPathContext),
    sequencePath: useContext(SequencePathContext),
    formName: useContext(FormNameContext),
    formValidation: useContext(FormValidationContext),
    mouse: useContext(MouseContext),
    programRanks: useContext(ProgramRankContext),
    focusCycle: useContext(FocusCycleContext),
  };
}

/** What the CaptureAll component and the probes read, on their latest render. */
const all: {
  captured: CapturedContexts | null;
  direct: CapturedContexts | null;
  given: CapturedContexts | null;
  bridged: CapturedContexts | null;
  outside: CapturedContexts | null;
} = { captured: null, direct: null, given: null, bridged: null, outside: null };

function clearAllReadings(): void {
  all.captured = null;
  all.direct = null;
  all.given = null;
  all.bridged = null;
  all.outside = null;
}

function CaptureAllInner() {
  all.captured = useCapturedContexts();
  all.direct = useAllContexts();
  return null;
}

/**
 * Captures inside a form and a layer of its own (test-only providers), so the
 * form name, the form's validation and the layer id are not their defaults.
 */
function CaptureAllRenderer() {
  const formValidation = useCreateFormValidation();
  return (
    <FormValidationContext.Provider value={formValidation}>
      <FormNameContext.Provider value="signup">
        <LayerIdContext.Provider value="layer-test">
          <CaptureAllInner />
        </LayerIdContext.Provider>
      </FormNameContext.Provider>
    </FormValidationContext.Provider>
  );
}

const CaptureAll = defineComponent({
  name: "CaptureAll",
  description: "Captures the contexts it renders in, inside a form and a layer",
  props: z.object({}),
  component: CaptureAllRenderer,
});

const allLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([CaptureAll]),
});

function BridgedReader() {
  all.bridged = useAllContexts();
  return null;
}

function OutsideReader() {
  all.outside = useAllContexts();
  return null;
}

/** Outside the FocusScope: reads through the bridge once a capture exists. */
function AllProbe({ captured }: { captured: CapturedContexts | null }) {
  // The capture this render bridges: the renderer may capture anew later in the same render.
  all.given = captured;
  if (captured === null) return null;
  return (
    <BridgedContexts captured={captured}>
      <BridgedReader />
    </BridgedContexts>
  );
}

function AllApp() {
  return (
    <Box flexDirection="column">
      <FocusScope>
        <InkRenderer
          response="root = Stack([CaptureAll()])"
          library={allLibrary}
          theme={THEME}
          mouse={true}
        />
      </FocusScope>
      <AllProbe captured={all.captured} />
      <OutsideReader />
    </Box>
  );
}
