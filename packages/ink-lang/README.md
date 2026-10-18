# @openuidev/ink-lang

Terminal (TUI) runtime for OpenUI Lang, built on [Ink](https://github.com/vadimdemedes/ink). It renders the same streamed OpenUI Lang programs as `@openuidev/react-lang`, with the same component names, positional arguments and schemas, so one system prompt serves a web app and a terminal app.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [OpenUI Lang docs](https://openui.com/docs/openui-lang) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/ink-lang ink react zod
# or
pnpm add @openuidev/ink-lang ink react zod
```

**Peer dependencies:** `ink ^8.0.0`, `react >=19.3.0`, `zod ^3.25.0 || ^4.0.0`. Node 22 or newer. The package is ESM only, like Ink.

## Overview

1. **Render streamed output** with `<InkRenderer>` inside your Ink app as the OpenUI Lang arrives.
2. **Use the default terminal library** (`inkLibrary`) whose components mirror the React default library, or **define your own** Ink components with `defineComponent` and `createLibrary`.
3. **Receive actions and state** through `onAction` and `onStateUpdate`; the components never talk to your host directly.

## Quick start

```tsx
import { Box, render, Text } from "ink";
import { useEffect, useState } from "react";
import { InkRenderer, inkLibrary, type ActionEvent } from "@openuidev/ink-lang";

function App() {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastEvent, setLastEvent] = useState<ActionEvent | null>(null);

  useEffect(function stream() {
    // Append each chunk of the model's response, then flip isStreaming off at the end.
    void streamFromYourModel(setResponse).then(function done() {
      setIsStreaming(false);
    });
  }, []);

  return (
    <Box flexDirection="column">
      <InkRenderer
        response={response}
        library={inkLibrary}
        isStreaming={isStreaming}
        onAction={setLastEvent}
      />
      <Text dimColor>
        {lastEvent ? `${lastEvent.type}: ${lastEvent.humanFriendlyMessage}` : ""}
      </Text>
    </Box>
  );
}

render(<App />);
```

The system prompt comes from the library, exactly as with `react-lang`:

```ts
const systemPrompt = inkLibrary.prompt({ preamble: "You are a deployment assistant." });
```

A host that targets both renderers generates the prompt from the full React library and lets `ink-lang` render the subset it ships. The parser drops components this library does not know and reports them through `onError` as `unknown-component` (or in the dim red error footer when no `onError` is passed), so the rest of the program still renders.

## Try it

```bash
pnpm --filter @openuidev/ink-lang demo
```

`examples/demo.tsx` streams a mock response chunk by chunk, logs every `onAction` event and the `onStateUpdate` snapshots under the rendered program. Tab and Shift+Tab move focus, Enter or Space presses a button, typing edits the field, Up and Down move through a Select, Esc quits.

## `InkRenderer` props

| Prop            | Type                                                          | Description                                                                                                                  |
| :-------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `response`      | `string \| null`                                              | The accumulated OpenUI Lang text, or a stored message with `]]>openui:` markers                                              |
| `library`       | `Library`                                                     | A library from `createLibrary()`; `inkLibrary` is the default                                                                |
| `isStreaming`   | `boolean`                                                     | True while the model is still producing the program: buttons and inputs are inactive, queries wait, errors are held back     |
| `onAction`      | `(event: ActionEvent) => void`                                | Button presses and custom actions, after `@Set`, `@Reset` and `@Run` steps have run                                          |
| `onStateUpdate` | `(state: Record<string, unknown>) => void`                    | The store snapshot after each user edit (never for declared defaults)                                                        |
| `initialState`  | `Record<string, unknown>`                                     | State to restore: `$`-prefixed keys are bindings, other keys are form state                                                  |
| `onParseResult` | `(result: ParseResult \| null) => void`                       | The raw parse result whenever it changes                                                                                     |
| `toolProvider`  | `Record<string, (args) => Promise<unknown>> \| McpClientLike` | Serves `Query()` and `Mutation()` calls once streaming ends                                                                  |
| `onError`       | `(errors: OpenUIError[]) => void`                             | Structured errors once streaming ends, `[]` when a new stream starts. Without it, errors are drawn as a red footer in the UI |
| `theme`         | `Partial<InkTheme>`                                           | Colors for borders, headings, destructive buttons and error lines: `accent`, `danger`, `muted` (defaults: cyan, red, gray)   |

While `isStreaming` is true and the root has not appeared yet, a dim `…` placeholder is drawn; a dim `streaming…` line sits under the tree until the stream ends, and `loading…` while a query is in flight.

## Components

Every component keeps the name, positional argument order, Zod schema and description of its `@openuidev/react-ui` counterpart; a test compares them with the generated spec of the React default library.

| Component                                          | Signature                                                                   | Terminal rendering                                                                                                                      |
| :------------------------------------------------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `Stack`                                            | `Stack(children, direction?, gap?, align?, justify?, wrap?)`                | Ink `Box`; gap tokens become 0 to 3 cells                                                                                               |
| `Card`                                             | `Card(children, variant?, direction?, gap?, align?, justify?, wrap?)`       | Round border (`card`), single dim border (`sunk`), no border (`clear`)                                                                  |
| `CardHeader`                                       | `CardHeader(title?, subtitle?)`                                             | Bold title line and dim subtitle line                                                                                                   |
| `TextContent`                                      | `TextContent(text, size?)`                                                  | Markdown (headings, lists, bold, italic, code, links); `small` dim, `small-heavy` bold dim, `large` bold, `large-heavy` bold underlined |
| `Button`                                           | `Button(label, action?, variant?, type?, size?)`                            | `[ label ]`, inverse when focused, red when `destructive`, dim while streaming                                                          |
| `Buttons`                                          | `Buttons(buttons, direction?)`                                              | Row (default) or column of buttons                                                                                                      |
| `Input`                                            | `Input(name, placeholder?, type?, rules?, value?)`                          | Single-line editor with a block cursor; `password` masks; `value` takes a `$binding`                                                    |
| `Select`                                           | `Select(name, items, placeholder?, rules?, value?, size?)`                  | Picked label or dim placeholder; focused it opens the option list, Up and Down move, Enter or Space picks; `value` takes a `$binding`   |
| `SelectItem`                                       | `SelectItem(value, label)`                                                  | One option of a Select (not drawn on its own)                                                                                           |
| `Form`                                             | `Form(name, buttons, fields?)`                                              | Scopes its fields under the form name and owns their validation; draws the fields, then the buttons                                     |
| `FormControl`                                      | `FormControl(label, input, hint?)`                                          | Bold label (`*` when required), the input, the dim hint or the red validation error                                                     |
| `Label`                                            | `Label(text)`                                                               | Plain text                                                                                                                              |
| `Table`                                            | `Table(columns)`                                                            | Bold header, dim rule, one line per row; widths from the widest cell, `number` columns right aligned, wide rows clipped                 |
| `Col`                                              | `Col(label, data, type?)`                                                   | One column of a Table: `data` is one value or component per row (not drawn on its own)                                                  |
| `Tabs`                                             | `Tabs(items)`                                                               | Focusable tab strip (active tab bold and underlined, inverse when focused); Left and Right switch; only the active content is mounted   |
| `TabItem`                                          | `TabItem(value, trigger, content)`                                          | One tab of a Tabs strip (not drawn on its own)                                                                                          |
| `BarChart`, `HorizontalBarChart`, `RadarChart`     | `BarChart(labels, series, variant?, xLabel?, yLabel?, height?)` and friends | One text bar per label and series with the value; `Series(category, values)` carries the numbers                                        |
| `LineChart`, `AreaChart`                           | `LineChart(labels, series, variant?, xLabel?, yLabel?, height?)`            | One sparkline per series with its range and the first and last label                                                                    |
| `PieChart`, `RadialChart`, `SingleStackedBarChart` | `PieChart(labels, values, variant?, appearance?)` and friends               | A colored proportion bar and a legend with percentages                                                                                  |
| `ScatterChart`                                     | `ScatterChart(datasets, xLabel?, yLabel?)`                                  | One summary line per `ScatterSeries(name, points)`: point count and x/y ranges                                                          |

`Card.children`, `TabItem.content` and `FormControl.input` accept the components of this library only; everything else about the schemas is identical to react-ui.

Keyboard: Tab and Shift+Tab move focus between buttons, inputs, selects and tab strips (Ink's focus manager). Enter or Space presses the focused button. In a focused input, printable keys insert, Backspace and Delete remove, Left, Right, Home and End move the cursor; Enter inside an input does nothing in this version. While a query is loading a spinner line shows under the program, and a failed query leaves a focusable `[ retry ]` that re-runs it. In a focused Select, Up and Down move the cursor and Enter or Space picks. In a focused Tabs strip, Left and Right switch tabs.

## Defining your own components

```tsx
import { Text } from "ink";
import { z } from "zod/v4";
import {
  createLibrary,
  defineComponent,
  Stack,
  type ComponentRenderProps,
} from "@openuidev/ink-lang";

const GreetingSchema = z.object({
  name: z.string(),
  mood: z.enum(["happy", "excited"]).optional(),
});

function GreetingRenderer({ props }: ComponentRenderProps<z.infer<typeof GreetingSchema>>) {
  return <Text bold={props.mood === "excited"}>Hello, {props.name}!</Text>;
}

export const Greeting = defineComponent({
  name: "Greeting",
  description: "Greets the user",
  props: GreetingSchema,
  component: GreetingRenderer,
});

export const library = createLibrary({ root: "Stack", components: [Stack, Greeting] });
```

Inside a renderer, `useTriggerAction()`, `useStateField(name, value)`, `useFormName()`, `useIsStreaming()`, `useIsQueryLoading()` and `useRenderNode()` give access to the runtime. `useFocusable({ isActive })` registers the component with Ink's focus manager; `reactive(schema)` marks a prop as bindable with `$variables`. Primitive children are wrapped in `Text` automatically because Ink refuses bare strings outside `Text`.

## How a chunk becomes a frame

```mermaid
sequenceDiagram
    participant Host as Host runtime (TUI app)
    participant R as InkRenderer
    participant SP as StreamParser (lang-core)
    participant ST as Store + QueryManager (lang-core)
    participant EV as evaluateRoot (lang-core)
    participant RN as RenderNode
    participant LIB as Ink component library
    participant INK as Ink reconciler (Yoga)
    participant TTY as Terminal

    Host->>R: re-render with response += chunk, isStreaming
    R->>SP: streamParser.set(response, complete = !isStreaming)
    SP-->>R: ParseResult { root, stateDeclarations, queryStatements }
    R->>ST: store.initialize(stateDeclarations, initialState)
    R->>EV: evaluateRoot(parseResult, { ctx, library, store, errors })
    EV->>ST: getState($var), resolveRef(query)
    EV-->>R: ElementNode tree with concrete props
    R->>RN: <RenderNode node={root} /> (or dim placeholder when root is null)
    RN->>LIB: library.components[typeName].component
    LIB-->>RN: <Box> / <Text> elements, renderNode(children) for nested nodes
    RN->>INK: React element tree
    INK->>TTY: ANSI frame

    TTY->>INK: keypress (Tab, Enter, characters)
    INK->>LIB: useFocus / useInput callbacks
    LIB->>ST: field.setValue(text) → store.set(...)
    ST-->>R: subscribe → useSyncExternalStore → re-evaluate → new frame
    LIB->>R: triggerAction(label, formName, actionPlan)
    R->>ST: @Set / @Reset / @Run (mutation, query invalidate)
    R-->>Host: onAction(ActionEvent), onStateUpdate(snapshot), onError(errors)
```

## Errors and streaming

- Nothing a model writes can crash the renderer: a parser crash becomes a `parse-exception` error, a component that throws is caught by an error boundary that keeps its last good frame and reports `render-error`, and a program that produced no statements reports `parse-failed`.
- Errors are collected only once `isStreaming` is false, so half-written programs never report `unknown-component` or `missing-required` by mistake.
- `onStateUpdate` fires once per user edit; `@Set` and `@Reset` steps count as edits.
- `ink-lang` never writes to the console. If you pass no `onError`, the errors are drawn under the program instead. (`lang-core` itself logs a failed query with `console.error`; Ink's `patchConsole` keeps that above the frame.)

## Telemetry

`ink-lang` sends nothing. It uses `createStreamingParser` and `library.prompt()` from `@openuidev/lang-core`, which are not instrumented. See the `lang-core` README for the flags that disable the rest of that package's telemetry.

## Validation

`Input` rules (`{ required, email, url, numeric, min, max, minLength, maxLength, pattern }`) are checked when focus leaves the field and before a primary `Button` fires a step that leaves the form (`@ToAssistant`, a mutation, a custom action). `FormControl` shows the error in place of the hint and marks required fields with `*`. Secondary buttons and purely local steps (`@Set`, `@Reset`) skip validation, as in the React default library.

## Not in this version

| Item         | Planned approach                                                                                                               |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `Combobox`   | Reuse the schema; a `Select` with a filter line on top                                                                         |
| Table paging | `contentOffsetY` paging for tables taller than the terminal; today every row is drawn                                          |
| Chart shapes | The terminal charts are textual (bars, sparklines, proportion bars); braille plotting for line and scatter charts could follow |

## License

MIT. See the repository [LICENSE](https://github.com/thesysdev/openui/blob/main/LICENSE).
