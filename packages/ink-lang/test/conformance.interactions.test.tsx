// The interactions.json part of the spec/fixtures/1.0 conformance cases (README, "Action and form
// cases"), replayed through <InkRenderer> with test renderers for Form, Input and Button. It is the
// terminal counterpart of packages/react-lang/src/__tests__/conformance.interactions.test.tsx.
import {
  defineAction,
  markReactive,
  type ActionEvent,
  type ActionPlan,
  type DefinedAction,
  type Store,
} from "@openuidev/lang-core";
import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { ReactNode } from "react";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { useOpenUI } from "../src/context";
import { FormNameContext, useFormName } from "../src/form-name-context";
import { InkRenderer } from "../src/ink-renderer";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderer,
  type ComponentRenderProps,
  type DefinedComponent,
  type Library,
} from "../src/library";
import { useStateField } from "../src/use-state-field";
import { settle } from "./helpers/settle";

type Dict = Record<string, unknown>;

interface Params {
  properties?: Dict;
}

interface ComponentSpec {
  signature: string;
  description: string;
}

interface SpecFile {
  root: string;
  schema: { $defs: Record<string, Params>; actions?: Record<string, { params: Params }> };
  components: Record<string, ComponentSpec>;
}

interface Interaction {
  click?: string;
  type?: [string, string];
  tool?: string;
  result?: unknown;
}

interface InteractionCase {
  interactions: Interaction[];
  expected: { events?: Dict[]; state?: Dict; toolCalls?: Dict[] };
}

const FIXTURES = path.resolve(
  process.env["OPENUI_FIXTURES"] ?? path.join(__dirname, "../../../spec/fixtures/1.0"),
);

function read(...parts: string[]): string {
  return fs.readFileSync(path.join(FIXTURES, ...parts), "utf8");
}

function dirs(...parts: string[]): string[] {
  const entries = fs.readdirSync(path.join(FIXTURES, ...parts), { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) names.push(entry.name);
  }
  names.sort();
  return names;
}

const spec = JSON.parse(read("library.json")) as SpecFile;

// ─── Test renderers; each registers its handler by statement id ───

let clicks = new Map<string, () => Promise<void>>();
let inputs = new Map<string, (text: string) => void>();
const live: { store: Store | null } = { store: null };

function GenericRenderer({ props, renderNode }: ComponentRenderProps<Dict>) {
  const context = useOpenUI();
  live.store = context.store;
  const values = Object.values(props);
  const children: ReactNode[] = [];
  for (let index = 0; index < values.length; index += 1) {
    children.push(<Box key={index}>{renderNode(values[index])}</Box>);
  }
  return <Box flexDirection="column">{children}</Box>;
}

function FormRenderer({ props, renderNode }: ComponentRenderProps<Dict>) {
  return (
    <FormNameContext.Provider value={props["name"] as string}>
      <Box flexDirection="column">{renderNode(props["children"])}</Box>
    </FormNameContext.Provider>
  );
}

function InputRenderer({ props, statementId }: ComponentRenderProps<Dict>) {
  const context = useOpenUI();
  live.store = context.store;
  const formName = useFormName();
  const name = props["name"] as string;
  const field = useStateField<unknown>(name, props["value"]);
  // A form field records its componentType; a bound $variable takes the plain value.
  inputs.set(statementId ?? name, function type(text: string) {
    if (field.isReactive) {
      field.setValue(text);
      return;
    }
    context.setFieldValue(formName, "input", name, text);
  });
  return <Text>{String(field.value ?? "")}</Text>;
}

function ButtonRenderer({ props, statementId }: ComponentRenderProps<Dict>) {
  const context = useOpenUI();
  live.store = context.store;
  const formName = useFormName();
  const label = props["label"] as string;
  clicks.set(statementId ?? label, function click() {
    return context.triggerAction(label, formName, props["action"] as ActionPlan | undefined);
  });
  return <Text>[{label}]</Text>;
}

const RENDERERS: Record<string, ComponentRenderer<Dict>> = {
  Form: FormRenderer,
  Input: InputRenderer,
  Button: ButtonRenderer,
};

// ─── The test library from library.json ───

/** Only the prop keys matter here, with the reactive mark on bindable props. */
function propsSchema(params: Params, bindable: Set<string>) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const key of Object.keys(params.properties ?? {})) {
    const schema = z.any();
    if (bindable.has(key)) markReactive(schema);
    shape[key] = schema;
  }
  return z.object(shape);
}

function bindableProps(signature: string): Set<string> {
  const names = new Set<string>();
  const pattern = /(\w+)\??: \$binding</g;
  let match = pattern.exec(signature);
  while (match !== null) {
    if (match[1] !== undefined) names.add(match[1]);
    match = pattern.exec(signature);
  }
  return names;
}

function buildLibrary(): Library {
  const components: DefinedComponent[] = [];
  for (const [name, component] of Object.entries(spec.components)) {
    components.push(
      defineComponent({
        name,
        description: component.description,
        props: propsSchema(spec.schema.$defs[name] ?? {}, bindableProps(component.signature)),
        component: RENDERERS[name] ?? GenericRenderer,
      }),
    );
  }
  const actions: DefinedAction<any, string>[] = [];
  for (const [name, action] of Object.entries(spec.schema.actions ?? {})) {
    actions.push(
      defineAction({ name, description: "", params: propsSchema(action.params, new Set()) }),
    );
  }
  const base = createLibrary({ components, actions, root: spec.root });
  // The fixture schema carries the enums and refs the z.any() props lack.
  return { ...base, toJSONSchema: () => spec.schema } as unknown as Library;
}

const library = buildLibrary();

// ─── Running a case ───

function json(value: unknown): unknown {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function same(a: unknown, b: unknown): boolean {
  return isDeepStrictEqual(json(a), json(b));
}

const str = JSON.stringify;

async function runInteractions(program: string, testCase: InteractionCase): Promise<string[]> {
  clicks = new Map();
  inputs = new Map();
  live.store = null;
  const events: Dict[] = [];
  const toolCalls: Dict[] = [];
  const tools: Record<string, (args: Dict) => Promise<unknown>> = {};
  function setTool(name: string, result: unknown): void {
    tools[name] = async function tool(args: Dict) {
      toolCalls.push({ tool: name, args: json(args) });
      return json(result);
    };
  }
  const steps = testCase.interactions;
  // Tool steps before the first user step apply before the program mounts.
  let index = 0;
  for (; index < steps.length && steps[index]?.tool !== undefined; index += 1) {
    const step = steps[index];
    if (step?.tool !== undefined) setTool(step.tool, step.result);
  }

  const diffs: string[] = [];
  const instance = render(
    <InkRenderer
      response={program}
      library={library}
      isStreaming={false}
      onAction={function onAction(event: ActionEvent) {
        events.push(event as unknown as Dict);
      }}
      toolProvider={tools}
    />,
  );
  try {
    await settle();
    for (; index < steps.length; index += 1) {
      const step = steps[index];
      if (step === undefined) continue;
      if (step.tool !== undefined) {
        setTool(step.tool, step.result);
        continue;
      }
      if (step.type !== undefined) {
        const handler = inputs.get(step.type[0]);
        if (handler === undefined) {
          diffs.push(`step ${index}: nothing rendered for ${step.type[0]}`);
          break;
        }
        handler(step.type[1]);
      } else if (step.click !== undefined) {
        const handler = clicks.get(step.click);
        if (handler === undefined) {
          diffs.push(`step ${index}: nothing rendered for ${step.click}`);
          break;
        }
        await handler();
      }
      await settle();
    }

    // Each expected event is compared on the keys it lists; null means absent or null.
    const want = testCase.expected.events ?? [];
    let eventsOk = want.length === events.length;
    for (let position = 0; eventsOk && position < want.length; position += 1) {
      const expected = want[position] ?? {};
      const actual = events[position] ?? {};
      for (const [key, value] of Object.entries(expected)) {
        if (!same(value, actual[key])) eventsOk = false;
      }
    }
    if (!eventsOk) diffs.push(`events: expected ${str(want)}, got ${str(json(events))}`);

    for (const [key, value] of Object.entries(testCase.expected.state ?? {})) {
      const store = live.store as Store | null; // set while rendering
      const got = store?.get(key);
      if (!same(value, got)) diffs.push(`state ${key}: expected ${str(value)}, got ${str(got)}`);
    }

    // Consecutive identical calls count once.
    const calls: Dict[] = [];
    for (let position = 0; position < toolCalls.length; position += 1) {
      const call = toolCalls[position];
      if (call === undefined) continue;
      if (position === 0 || !same(call, toolCalls[position - 1])) calls.push(call);
    }
    if (testCase.expected.toolCalls !== undefined && !same(testCase.expected.toolCalls, calls)) {
      diffs.push(`toolCalls: expected ${str(testCase.expected.toolCalls)}, got ${str(calls)}`);
    }
  } finally {
    instance.unmount();
  }
  return diffs;
}

// ─── Registration ───

const results: Record<string, { status: string; diffs?: string[] }> = {};

describe("OpenUI conformance fixtures (interactions)", () => {
  for (const area of dirs()) {
    for (const name of dirs(area)) {
      if (!fs.existsSync(path.join(FIXTURES, area, name, "interactions.json"))) continue;
      const id = `${area}/${name}#interactions`;
      it(id, async () => {
        const diffs = await runInteractions(
          read(area, name, "input.oui"),
          JSON.parse(read(area, name, "interactions.json")) as InteractionCase,
        );
        results[id] = diffs.length > 0 ? { status: "fail", diffs } : { status: "pass" };
        if (diffs.length > 0) expect.fail(`${id}\n  ${diffs.join("\n  ")}`);
      });
    }
  }

  // OPENUI_CONFORMANCE_REPORT=<file> writes `<file>.interactions.json`: `{ "<id>": { status, diffs? } }`.
  afterAll(() => {
    const report = process.env["OPENUI_CONFORMANCE_REPORT"];
    if (report !== undefined && report !== "") {
      fs.writeFileSync(
        report.replace(/(\.json)?$/, ".interactions.json"),
        JSON.stringify(results, null, 2) + "\n",
      );
    }
  });
});
