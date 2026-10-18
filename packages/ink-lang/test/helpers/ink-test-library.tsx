import { action, type ActionPlan } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import { z } from "zod/v4";
import { useOpenUI, useTriggerAction, type OpenUIContextValue } from "../../src/context";
import { useFormName } from "../../src/form-name-context";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import { reactive } from "../../src/reactive";
import { useStateField } from "../../src/use-state-field";

/** Field setters registered by name while rendering, so tests can type without a terminal. */
export const setters = new Map<string, (text: string) => void>();

/** Button handlers registered by statement id (or label) while rendering. */
export const clicks = new Map<string, () => Promise<void>>();

/** The latest context seen by a Probe component. */
export const probe: { context: OpenUIContextValue | null; target: unknown } = {
  context: null,
  target: null,
};

export function resetInkTestLibrary(): void {
  setters.clear();
  clicks.clear();
  probe.context = null;
  probe.target = null;
}

function StackRenderer({ props, renderNode }: ComponentRenderProps<{ children: unknown[] }>) {
  return <Box flexDirection="column">{renderNode(props.children)}</Box>;
}

export const StackBox = defineComponent({
  name: "Stack",
  description: "Column of children",
  props: z.object({ children: z.array(z.any()) }),
  component: StackRenderer,
});

function TitleRenderer({ props }: ComponentRenderProps<{ text: string }>) {
  return <Text>{props.text}</Text>;
}

export const TitleText = defineComponent({
  name: "Title",
  description: "One line of text",
  props: z.object({ text: z.string() }),
  component: TitleRenderer,
});

function FieldRenderer({ props }: ComponentRenderProps<{ name: string; value?: string }>) {
  const field = useStateField<string | undefined>(props.name, props.value);
  setters.set(props.name, field.setValue);
  const shown = field.value ?? "";
  return (
    <Text>
      {props.name}={shown}
    </Text>
  );
}

export const Field = defineComponent({
  name: "Field",
  description: "A text field without a terminal editor",
  props: z.object({ name: z.string(), value: reactive(z.string().optional()) }),
  component: FieldRenderer,
});

function FlakyRenderer({ props }: ComponentRenderProps<{ text: string; fail?: boolean }>) {
  if (props.fail === true) throw new Error("flaky renderer failed");
  return <Text>{props.text}</Text>;
}

export const Flaky = defineComponent({
  name: "Flaky",
  description: "Throws when asked to",
  props: z.object({ text: z.string(), fail: z.boolean().optional() }),
  component: FlakyRenderer,
});

function ProbeRenderer({ props, renderNode }: ComponentRenderProps<{ label: string }>) {
  probe.context = useOpenUI();
  return (
    <Box flexDirection="column">
      <Text>{props.label}</Text>
      {renderNode(probe.target)}
    </Box>
  );
}

export const Probe = defineComponent({
  name: "Probe",
  description: "Captures the context and renders an arbitrary value",
  props: z.object({ label: z.string() }),
  component: ProbeRenderer,
});

function ClickButtonRenderer({
  props,
  statementId,
}: ComponentRenderProps<{ label: string; action?: unknown }>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const key = statementId ?? props.label;
  clicks.set(key, function click() {
    return triggerAction(props.label, formName, props.action as ActionPlan | undefined);
  });
  return <Text>[{props.label}]</Text>;
}

export const ClickButton = defineComponent({
  name: "Button",
  description: "A button without a terminal focus ring",
  props: z.object({ label: z.string(), action: action().optional() }),
  component: ClickButtonRenderer,
});

export function makeInkTestLibrary(): Library {
  return createLibrary({
    root: "Stack",
    components: [StackBox, TitleText, Field, Flaky, Probe, ClickButton],
  });
}
