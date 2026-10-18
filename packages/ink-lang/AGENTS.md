# ink-lang - Agent Guide

Terminal (Ink) runtime for OpenUI Lang. Sibling of `react-lang`; built on `lang-core` only.

## Build / Test / Lint

```bash
# From the monorepo root:
pnpm --filter @openuidev/ink-lang run build        # tsdown -> dist/ (ESM only)
pnpm --filter @openuidev/ink-lang run test         # vitest, node environment
pnpm --filter @openuidev/ink-lang run typecheck    # tsc over src/
pnpm --filter @openuidev/ink-lang run ci           # lint + format + test + tsc over tests
pnpm --filter @openuidev/ink-lang run demo         # streams examples/demo.tsx in the terminal

# Or from this directory:
pnpm build && pnpm test
```

Build order: `lang-core` -> `ink-lang`. Nothing else in the workspace is a dependency. Requires Node 22+ (Ink 8).

## File Map

| Path                                   | Purpose                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                         | Public API. Every export consumers see; check here when adding or removing exports.                                                            |
| `src/ink-renderer.tsx`                 | `<InkRenderer>`: props -> runtime hook -> context -> `<RenderNode>`, placeholder, status and error lines.                                      |
| `src/use-openui-runtime.ts`            | The one hook that wires `runtime/` to React state (parser, store, query manager, actions, errors).                                             |
| `src/runtime/parse-response.ts`        | `StreamParser.set` plus message-marker stripping; never throws.                                                                                |
| `src/runtime/evaluation-context.ts`    | `EvaluationContext` (getState, resolveRef) and library function merging.                                                                       |
| `src/runtime/evaluate-result.ts`       | `evaluateRoot` with runtime error collection.                                                                                                  |
| `src/runtime/query-nodes.ts`           | `ParseResult` -> `QueryNode[]` / `MutationNode[]`.                                                                                             |
| `src/runtime/field-state.ts`           | Form field wrapper format (`{ value, componentType }`) and the `formState` payload.                                                            |
| `src/runtime/run-action-plan.ts`       | Executes `@Run`, `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset` and custom action steps.                                                         |
| `src/runtime/trigger-action.ts`        | Dispatch: action plan, legacy object, or label-only `continue_conversation`.                                                                   |
| `src/runtime/tool-provider.ts`         | Function map or MCP client -> stable `ToolProvider`.                                                                                           |
| `src/runtime/collect-errors.ts`        | Parser, runtime, render and query errors -> the `onError` list.                                                                                |
| `src/context.ts`                       | `OpenUIContext` and the hooks components use (`useTriggerAction`, `useIsStreaming`, ...).                                                      |
| `src/form-name-context.ts`             | `FormNameContext` / `useFormName`.                                                                                                             |
| `src/use-state-field.ts`               | `useStateField`: `$binding` two-way field or form field.                                                                                       |
| `src/use-openui-store.ts`              | `useSyncExternalStore` bridges for the store and the query manager.                                                                            |
| `src/render-value.tsx`                 | `renderValue(value)` (the context's `renderNode`): primitives -> `<Text>`, arrays, elements, null -> nothing.                                  |
| `src/render-node.tsx`                  | Library lookup + error boundary. The red `UnknownComponent` branch is defensive: the parser already drops unknown components and reports them. |
| `src/unknown-component.tsx`            | `<UnknownComponent>`: the red `Unknown component: X` line for a type the library lacks.                                                        |
| `src/error-footer.tsx`                 | `<ErrorFooter>`: one red dim line per error, drawn under the program when no `onError` is passed.                                              |
| `src/element-node.ts`                  | `isElementValue` guard for parsed component nodes (lang-core keeps its own internal). Public export.                                           |
| `src/element-error-boundary.tsx`       | Keeps the last good children when a renderer throws; reports `render-error`.                                                                   |
| `src/library.ts`                       | `defineComponent` / `createLibrary` typed for Ink renderers (thin wrappers over lang-core).                                                    |
| `src/reactive.ts`                      | `reactive(schema)`: marks a prop as bindable (`markReactive`).                                                                                 |
| `src/default-library.ts`               | `inkLibrary` (root `Stack`) and its prompt groups.                                                                                             |
| `src/schemas/*.ts`                     | Verbatim copies of `packages/react-ui/src/genui-lib/<X>/schema.ts`. Do not edit by hand (see below).                                           |
| `src/components/*.tsx`                 | One Ink renderer per component; `text-input.tsx` is the model-facing `Input`.                                                                  |
| `src/components/flex-box-props.ts`     | Pure mapping of Stack/Card flex props to Ink Box props.                                                                                        |
| `src/components/text-editing.ts`       | Pure grapheme-aware editor logic (`applyKeyToEditor`, `splitForCursor`, `maskValue`).                                                          |
| `src/components/text-content-style.ts` | Pure mapping of the TextContent size to bold / dim / underline.                                                                                |
| `src/components/button-keys.ts`        | `isPressKey`: Enter or Space presses a button; kitty release events never do.                                                                  |
| `src/focus/use-focusable.ts`           | `useFocus` with a per-instance id; `isActive: false` while streaming.                                                                          |
| `src/focus/focus-style.ts`             | Pure focus ring styles for buttons.                                                                                                            |
| `examples/demo.tsx`                    | Streams `examples/demo-program.ts` into `InkRenderer` and logs host callbacks.                                                                 |
| `test/`                                | Vitest suites (see Testing). `test/helpers/` holds the Ink test library, the renderer-less runtime fixture and the render helpers.             |

## Key Patterns

### Schema parity rule

Every component that exists in `packages/react-ui/src/genui-lib/` keeps its name, positional argument order, Zod schema, enum values, defaults and description. `test/schema-parity.test.ts` compares `inkLibrary` with `docs/generated/playground-library.spec.json` (override the path with `OPENUI_LIBRARY_SPEC`). The only allowed differences are the member lists of `Card.children` and `FormControl.input`, which list the terminal components. If a parity test fails after an upstream change, update the copy in `src/schemas/` to match react-ui, never the other way round.

### Adding a component

1. Copy its schema from react-ui into `src/schemas/<name>-schema.ts` (verbatim; unions reduced to terminal components if needed).
2. Write the Ink renderer in `src/components/<name>.tsx` as a named function and `defineComponent({ name, props, description, component })` with the react-ui description.
3. Add it to `inkLibrary` in `src/default-library.ts`, to a prompt group, and to `src/index.ts`.
4. Add the name to `SHARED` in `test/schema-parity.test.ts` and write a rendering test in `test/components.test.tsx` (TDD: test first).

### Interactive components

Use `useFocusable({ isActive: !isStreaming })` for the focus ring and `useInput(handler, { isActive })` for keys. Fire actions only through `useTriggerAction()`; write values only through `useStateField(name, value).setValue` or `useSetFieldValue()`. Components never call the host and never write to the console (`no-console` is an error in `src/`).

### Code style (strict)

- One file per responsibility; plain functions; named function expressions where a stack trace would otherwise show `anonymous`.
- No method chaining (`a.b().c()`): use intermediate variables and loops. The Zod builders in `src/schemas/` are the one exception because they must stay byte-identical to react-ui.
- No conditional or mapped types, no deep generics. Interfaces and explicit types; the only generics are the shallow single-parameter ones that mirror react-lang: the schema-typed family in `library.ts` (`ComponentRenderProps<P>`, `ComponentRenderer<P>`, `DefinedComponent<T>`, `DefineComponentConfig<T>`, `defineComponent<T>`), `reactive<T>` and `useStateField<T>`.
- Everything in English. Prettier (`format:fix`) and ESLint (`lint:fix`) are the source of truth for layout and imports.

## Testing

- Vitest, node environment, `FORCE_COLOR=1` (set in `vitest.config.ts`) so frames carry ANSI styles that tests can assert on; strip them with `test/helpers/ansi.ts` when asserting on text.
- `ink-testing-library` renders `<InkRenderer>` with fake streams. `test/helpers/render-program.tsx` mounts a program, `instance.stdin.write(KEYS.TAB)` presses keys (`test/helpers/keys.ts`), and `settle()` waits a few macrotasks.
- `test/helpers/ink-test-library.tsx` is a small library with hooks into the tests (`setters`, `clicks`, `probe`) for runtime behaviour; `test/helpers/test-library.ts` is a renderer-less library for the pure `runtime/` tests.
- `test/conformance.interactions.test.tsx` replays `spec/fixtures/1.0/**/interactions.json` with generic Ink renderers, like react-lang's runner (`OPENUI_FIXTURES` overrides the path, `OPENUI_CONFORMANCE_REPORT` writes a report).
- Pure modules (`runtime/*`, `flex-box-props`, `text-editing`, `focus-style`) have direct unit tests; write those first when changing behaviour.

## Do NOT Change

- **Schemas** in `src/schemas/` by hand: they are copies of react-ui and the parity test guards them.
- **`Input` naming**: the file is `text-input.tsx` but the model-facing name is `Input`, as in react-ui.
- **ESM-only output** (`type: module`, tsdown `format: ["esm"]`): Ink 8 and yoga-layout use top-level await and cannot be required from CommonJS.
- **Peer dependencies** `ink` and `react`: they must be peers so the host shares one Ink and one React instance; a second copy breaks context and focus.
- **Engines** `node >= 22` (Ink 8). The monorepo root still admits Node 20; this package does not.
