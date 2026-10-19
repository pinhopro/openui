import { useContext, type ReactNode } from "react";
import { OpenUIContext, type OpenUIContextValue } from "../context";
import type { DesignSystem } from "../design/design-system";
import { DesignSystemContext } from "../design/design-system-context";
import { ElementPathContext } from "../element-type-context";
import { FocusCommandsContext, type FocusCommands } from "../focus/focus-commands";
import { FocusCycleContext, type FocusCycleOrder } from "../focus/focus-cycle";
import { FocusRegistryContext, type FocusRegistry } from "../focus/focus-registry";
import { LayerIdContext, ModalLayerContext, type ModalLayers } from "../focus/modal-layer";
import { ProgramRankContext, type ProgramRanks } from "../focus/program-rank";
import { SequencePathContext } from "../focus/sequence-path";
import { FormNameContext } from "../form-name-context";
import { FormValidationContext, type FormValidationContextValue } from "../form-validation-context";
import { MouseContext, type MouseRegistry } from "../mouse/mouse-provider";
import { ThemeContext, type InkTheme } from "../theme";
import { UiEventContext, type UiEventListener } from "../ui-events";

/**
 * The value of every library context at one point of the tree. Content rendered
 * elsewhere (an overlay placed last in the tree) re-provides them with
 * BridgedContexts, so it behaves as if it were rendered where they were captured.
 */
export interface CapturedContexts {
  openUI: OpenUIContextValue | null;
  theme: InkTheme;
  designSystem: DesignSystem;
  uiEvents: UiEventListener | null;
  focusRegistry: FocusRegistry | null;
  focusCommands: FocusCommands;
  modalLayers: ModalLayers;
  layerId: string | null;
  elementPath: string[];
  sequencePath: number[];
  formName: string | undefined;
  formValidation: FormValidationContextValue | null;
  mouse: MouseRegistry | null;
  programRanks: ProgramRanks | null;
  focusCycle: FocusCycleOrder;
}

/** Reads every library context where the calling component renders. */
export function useCapturedContexts(): CapturedContexts {
  const openUI = useContext(OpenUIContext);
  const theme = useContext(ThemeContext);
  const designSystem = useContext(DesignSystemContext);
  const uiEvents = useContext(UiEventContext);
  const focusRegistry = useContext(FocusRegistryContext);
  const focusCommands = useContext(FocusCommandsContext);
  const modalLayers = useContext(ModalLayerContext);
  const layerId = useContext(LayerIdContext);
  const elementPath = useContext(ElementPathContext);
  const sequencePath = useContext(SequencePathContext);
  const formName = useContext(FormNameContext);
  const formValidation = useContext(FormValidationContext);
  const mouse = useContext(MouseContext);
  const programRanks = useContext(ProgramRankContext);
  const focusCycle = useContext(FocusCycleContext);
  return {
    openUI,
    theme,
    designSystem,
    uiEvents,
    focusRegistry,
    focusCommands,
    modalLayers,
    layerId,
    elementPath,
    sequencePath,
    formName,
    formValidation,
    mouse,
    programRanks,
    focusCycle,
  };
}

export interface BridgedContextsProps {
  /** The contexts read with useCapturedContexts where the content belongs. */
  captured: CapturedContexts;
  children?: ReactNode;
}

/** Re-provides captured contexts to children rendered outside the capturing subtree. */
export function BridgedContexts({ captured, children }: BridgedContextsProps) {
  return (
    <OpenUIContext.Provider value={captured.openUI}>
      <ThemeContext.Provider value={captured.theme}>
        <DesignSystemContext.Provider value={captured.designSystem}>
          <UiEventContext.Provider value={captured.uiEvents}>
            <FocusRegistryContext.Provider value={captured.focusRegistry}>
              <FocusCommandsContext.Provider value={captured.focusCommands}>
                <ModalLayerContext.Provider value={captured.modalLayers}>
                  <LayerIdContext.Provider value={captured.layerId}>
                    <ElementPathContext.Provider value={captured.elementPath}>
                      <SequencePathContext.Provider value={captured.sequencePath}>
                        <FormNameContext.Provider value={captured.formName}>
                          <FormValidationContext.Provider value={captured.formValidation}>
                            <MouseContext.Provider value={captured.mouse}>
                              <ProgramRankContext.Provider value={captured.programRanks}>
                                <FocusCycleContext.Provider value={captured.focusCycle}>
                                  {children}
                                </FocusCycleContext.Provider>
                              </ProgramRankContext.Provider>
                            </MouseContext.Provider>
                          </FormValidationContext.Provider>
                        </FormNameContext.Provider>
                      </SequencePathContext.Provider>
                    </ElementPathContext.Provider>
                  </LayerIdContext.Provider>
                </ModalLayerContext.Provider>
              </FocusCommandsContext.Provider>
            </FocusRegistryContext.Provider>
          </UiEventContext.Provider>
        </DesignSystemContext.Provider>
      </ThemeContext.Provider>
    </OpenUIContext.Provider>
  );
}
