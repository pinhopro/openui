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

| Path                                      | Purpose                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                            | Public API. Every export consumers see; check here when adding or removing exports.                                                                                                                                       |
| `src/ink-renderer.tsx`                    | `<InkRenderer>`: props -> runtime hook -> context -> `<RenderNode>`, placeholder, status and error lines.                                                                                                                 |
| `src/use-openui-runtime.ts`               | The one hook that wires `runtime/` to React state (parser, store, query manager, actions, errors).                                                                                                                        |
| `src/runtime/parse-response.ts`           | `StreamParser.set` plus message-marker stripping; never throws.                                                                                                                                                           |
| `src/runtime/evaluation-context.ts`       | `EvaluationContext` (getState, resolveRef) and library function merging.                                                                                                                                                  |
| `src/runtime/evaluate-result.ts`          | `evaluateRoot` with runtime error collection.                                                                                                                                                                             |
| `src/runtime/query-nodes.ts`              | `ParseResult` -> `QueryNode[]` / `MutationNode[]`.                                                                                                                                                                        |
| `src/runtime/field-state.ts`              | Form field wrapper format (`{ value, componentType }`) and the `formState` payload.                                                                                                                                       |
| `src/runtime/run-action-plan.ts`          | Executes `@Run`, `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset` and custom action steps.                                                                                                                                    |
| `src/runtime/trigger-action.ts`           | Dispatch: action plan, legacy object, or label-only `continue_conversation`.                                                                                                                                              |
| `src/runtime/tool-provider.ts`            | Function map or MCP client -> stable `ToolProvider`.                                                                                                                                                                      |
| `src/runtime/collect-errors.ts`           | Parser, runtime, render and query errors -> the `onError` list.                                                                                                                                                           |
| `src/context.ts`                          | `OpenUIContext` and the hooks components use (`useTriggerAction`, `useIsStreaming`, ...).                                                                                                                                 |
| `src/form-name-context.ts`                | `FormNameContext` / `useFormName`.                                                                                                                                                                                        |
| `src/use-state-field.ts`                  | `useStateField`: `$binding` two-way field or form field.                                                                                                                                                                  |
| `src/use-field-rules.ts`                  | `useFieldRules`: a field's `rules` prop wired to the form (register, validate on blur, clear on focus); shared by `Input` and `Combobox`.                                                                                 |
| `src/use-openui-store.ts`                 | `useSyncExternalStore` bridges for the store and the query manager.                                                                                                                                                       |
| `src/render-value.tsx`                    | `renderValue(value)` (the context's `renderNode`): primitives -> `<Text>`, arrays, elements, null -> nothing.                                                                                                             |
| `src/render-node.tsx`                     | Library lookup + error boundary. The red `UnknownComponent` branch is defensive: the parser already drops unknown components and reports them.                                                                            |
| `src/unknown-component.tsx`               | `<UnknownComponent>`: the red `Unknown component: X` line for a type the library lacks.                                                                                                                                   |
| `src/error-footer.tsx`                    | `<ErrorFooter>`: one red dim line per error, drawn under the program when no `onError` is passed.                                                                                                                         |
| `src/element-node.ts`                     | `isElementValue` guard for parsed component nodes (lang-core keeps its own internal). Public export.                                                                                                                      |
| `src/element-error-boundary.tsx`          | Keeps the last good children when a renderer throws; reports `render-error`.                                                                                                                                              |
| `src/library.ts`                          | `defineComponent` / `createLibrary` typed for Ink renderers (thin wrappers over lang-core).                                                                                                                               |
| `src/reactive.ts`                         | `reactive(schema)`: marks a prop as bindable (`markReactive`).                                                                                                                                                            |
| `src/default-library.ts`                  | `inkLibrary` (root `Stack`) and its prompt groups.                                                                                                                                                                        |
| `src/schemas/*.ts`                        | Verbatim copies of `packages/react-ui/src/genui-lib/<X>/schema.ts`. Do not edit by hand (see below). `combobox-schema.ts` is the one terminal-only schema: Select's shape under another name.                             |
| `src/components/*.tsx`                    | One Ink renderer per component; `text-input.tsx` is the model-facing `Input`. `col.tsx`, `tab-item.tsx` and `select-item.tsx` render nothing: they are data for `table.tsx`, `tabs.tsx`, `select.tsx` and `combobox.tsx`. |
| `src/components/flex-box-props.ts`        | Pure mapping of Stack/Card flex props to Ink Box props.                                                                                                                                                                   |
| `src/components/text-editing.ts`          | Pure grapheme-aware editor logic (`applyKeyToEditor`, `splitForCursor`, `maskValue`).                                                                                                                                     |
| `src/components/combobox-options.ts`      | Pure `filterOptions` (case-insensitive label or value match) and `listWindow` (the visible slice of a long list around the cursor).                                                                                       |
| `src/components/text-content-style.ts`    | Pure mapping of the TextContent size to bold / dim / underline.                                                                                                                                                           |
| `src/components/button-keys.ts`           | `isPressKey`: Enter or Space presses a button; kitty release events never do.                                                                                                                                             |
| `src/components/arrow-keys.ts`            | `horizontalStep` / `verticalStep`: -1, 0 or 1 for the arrow keys; kitty release events are 0.                                                                                                                             |
| `src/components/step-index.ts`            | `clampIndex` / `stepIndex`: clamped list moves shared by Tabs and Select (no wrapping).                                                                                                                                   |
| `src/components/table-layout.ts`          | Pure measuring of a Table's Col elements: `cellText`, column widths (graphemes), alignment and row count.                                                                                                                 |
| `src/components/table-paging.ts`          | Pure `pageBounds` / `pageSummary`: which rows a page shows and the `rows 1-10 of 42` footer text.                                                                                                                         |
| `src/components/table-pager.tsx`          | `TablePager`: the footer of a paged table with the focusable `[ prev ]` / `[ next ]` controls.                                                                                                                            |
| `src/components/select-options.ts`        | Pure `selectOptions` / `indexOfOption`: SelectItem elements to `{ value, label }` options.                                                                                                                                |
| `src/components/markdown.ts`              | Pure markdown subset parser (`parseMarkdown`, `parseInline`, `hasMarkdown`) used by TextContent.                                                                                                                          |
| `src/components/button-validation.ts`     | `buttonNeedsValidation`: which action plans make a primary button validate its form first.                                                                                                                                |
| `src/components/chart-data.ts`            | Pure `buildSeriesRows` / `buildSlices` / `seriesNames`: chart props (Series elements, tabular rows, labels + values) to rows and slices.                                                                                  |
| `src/components/chart-text.ts`            | Pure text glyph helpers: `barCells`, `sparkline` (kept as a building block for custom components), `percentages`, `proportionSegments`, `formatNumber`.                                                                   |
| `src/components/series-bars.tsx`          | Shared renderer for BarChart, HorizontalBarChart and RadarChart (one text bar per label and series).                                                                                                                      |
| `src/components/braille-canvas.ts`        | Pure braille canvas: a cell grid of 2 x 4 dot matrices on U+2800 with `plot`, `plotLine`, `fillBelow`, `plotArea`, `projectValue` and `toLines`.                                                                          |
| `src/components/braille-plot.tsx`         | `BraillePlot`: the frame of every braille chart (y range labels, canvas in the accent color, x caption, legend lines, axis names).                                                                                        |
| `src/components/braille-series-chart.tsx` | Shared renderer for LineChart and AreaChart (one braille polyline per series; AreaChart fills under the lines).                                                                                                           |
| `src/components/scatter-data.ts`          | Pure `readScatterDatasets`: ScatterSeries and Point elements to named point lists.                                                                                                                                        |
| `src/components/proportion-chart.tsx`     | Shared renderer for PieChart, RadialChart and SingleStackedBarChart (colored proportion bar plus legend).                                                                                                                 |
| `src/components/axis-labels.tsx`          | The dim x/y axis caption under a chart.                                                                                                                                                                                   |
| `src/components/null-renderer.ts`         | Renderer of the data-only components (Series, Slice, Point, ScatterSeries).                                                                                                                                               |
| `src/form-validation-context.ts`          | `FormValidationContext`, `useFormValidation`, `useCreateFormValidation` (ported from react-lang).                                                                                                                         |
| `src/theme.ts`                            | `InkTheme` (`accent`, `danger`, `muted`), `defaultTheme`, `resolveTheme`, `ThemeContext`, `useTheme`.                                                                                                                     |
| `src/query-status.tsx`                    | `QueryStatus`: the spinner while queries load and the focusable `[ retry ]` after a failure.                                                                                                                              |
| `src/focus/use-focusable.ts`              | `useFocus` with a per-instance id; `isActive: false` while streaming.                                                                                                                                                     |
| `src/focus/focus-style.ts`                | Pure focus ring styles: `buttonTextStyle` for buttons, `pagerTextStyle` for the table pager (keeps the ring while disabled).                                                                                              |
| `examples/demo.tsx`                       | Streams `examples/demo-program.ts` into `InkRenderer` and logs host callbacks.                                                                                                                                            |
| `test/`                                   | Vitest suites (see Testing). `test/helpers/` holds the Ink test library, the renderer-less runtime fixture and the render helpers.                                                                                        |

## Key Patterns

### Schema parity rule

Every component that exists in `packages/react-ui/src/genui-lib/` keeps its name, positional argument order, Zod schema, enum values, defaults and description. `test/schema-parity.test.ts` compares `inkLibrary` with `docs/generated/playground-library.spec.json` (override the path with `OPENUI_LIBRARY_SPEC`). The only allowed differences are the member lists of `Card.children`, `TabItem.content` and `FormControl.input`, which list the terminal components. `Combobox` has no react-ui counterpart; the parity suite instead checks that its JSON Schema equals `Select`'s. If a parity test fails after an upstream change, update the copy in `src/schemas/` to match react-ui, never the other way round.

### Adding a component

1. Copy its schema from react-ui into `src/schemas/<name>-schema.ts` (verbatim; unions reduced to terminal components if needed).
2. Write the Ink renderer in `src/components/<name>.tsx` as a named function and `defineComponent({ name, props, description, component })` with the react-ui description.
3. Add it to `inkLibrary` in `src/default-library.ts`, to a prompt group, and to `src/index.ts`.
4. Add the name to `SHARED` in `test/schema-parity.test.ts` (and to `UNION_PROPS` when a union was reduced), add it to the component list in `test/components.test.tsx`, and write rendering tests there or in a `test/<name>.test.tsx` suite for interactive components (TDD: test first).

### Interactive components

Use `useFocusable({ isActive: !isStreaming })` for the focus ring and `useInput(handler, { isActive })` for keys. Fire actions only through `useTriggerAction()`; write values only through `useStateField(name, value).setValue` or `useSetFieldValue()`. Components never call the host and never write to the console (`no-console` is an error in `src/`).

Ink's focus order is the order in which `useFocus` effects run, and React runs a child's effects before its parent's. A focusable container that renders focusable children (Tabs) must therefore put its own focus hook in a child component rendered before the content (`TabStrip`), or Tab would reach the buttons inside before the strip. Several keys can arrive in one stdin chunk before React re-renders, so handlers read the latest state from a ref (`Input`, `Select`, `Combobox`) or use functional `setState` updates (`Tabs`, the table pager). Ink reports a run of plain characters in one chunk as one input string, so tests press Tab and Enter one write at a time. Ink holds a lone Escape for 20ms and then drops focus; tests that press it wait with `settle(60)`.

### Code style (strict)

- One file per responsibility; plain functions; named function expressions where a stack trace would otherwise show `anonymous`.
- No method chaining (`a.b().c()`): use intermediate variables and loops. The Zod builders in `src/schemas/` are the one exception because they must stay byte-identical to react-ui.
- No conditional or mapped types, no deep generics. Interfaces and explicit types; the only generics are the shallow single-parameter ones that mirror react-lang: the schema-typed family in `library.ts` (`ComponentRenderProps<P>`, `ComponentRenderer<P>`, `DefinedComponent<T>`, `DefineComponentConfig<T>`, `defineComponent<T>`), `reactive<T>` and `useStateField<T>`.
- Everything in English. Prettier (`format:fix`) and ESLint (`lint:fix`) are the source of truth for layout and imports.
- No em dashes in anything we write. The two component descriptions copied from react-ui (`Col`, `Table`) keep theirs because the parity test compares descriptions byte for byte.

## Testing

- Vitest, node environment, `FORCE_COLOR=1` (set in `vitest.config.ts`) so frames carry ANSI styles that tests can assert on; strip them with `test/helpers/ansi.ts` when asserting on text.
- `ink-testing-library` renders `<InkRenderer>` with fake streams. `test/helpers/render-program.tsx` mounts a program, `instance.stdin.write(KEYS.TAB)` presses keys (`test/helpers/keys.ts`), and `settle()` waits a few macrotasks.
- `test/helpers/ink-test-library.tsx` is a small library with hooks into the tests (`setters`, `clicks`, `probe`) for runtime behaviour; `test/helpers/test-library.ts` is a renderer-less library for the pure `runtime/` tests.
- `test/conformance.interactions.test.tsx` replays `spec/fixtures/1.0/**/interactions.json` with generic Ink renderers, like react-lang's runner (`OPENUI_FIXTURES` overrides the path, `OPENUI_CONFORMANCE_REPORT` writes a report).
- Pure modules (`runtime/*`, `flex-box-props`, `text-editing`, `focus-style`, `arrow-keys`, `step-index`, `table-layout`, `table-paging`, `select-options`, `combobox-options`, `braille-canvas`, `scatter-data`) have direct unit tests; write those first when changing behaviour.

## Do NOT Change

- **Schemas** in `src/schemas/` by hand: they are copies of react-ui and the parity test guards them.
- **`Input` naming**: the file is `text-input.tsx` but the model-facing name is `Input`, as in react-ui.
- **ESM-only output** (`type: module`, tsdown `format: ["esm"]`): Ink 8 and yoga-layout use top-level await and cannot be required from CommonJS.
- **Peer dependencies** `ink` and `react`: they must be peers so the host shares one Ink and one React instance; a second copy breaks context and focus.
- **Engines** `node >= 22` (Ink 8). The monorepo root still admits Node 20; this package does not.
