# Root-down Tab order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Tab order of a program is computed from its component tree, from `root` down, with each component deciding the order of its own children, and the library (not Ink) owns Tab, Shift+Tab, Escape and autoFocus.

**Architecture:** `RenderNode` hands every component a sequenced `renderNode` that numbers the children in the order the component renders them; the number joins a `SequencePathContext`, and every stop registers its sequence path (`parent path + its own order`). `focusOrder` sorts stops by that path; a `FocusNavigator` replaces Ink's Tab and Escape handling and exposes focus commands (first stop of the active layer) that the modals use. Host stops have no path and are placed by `FocusScope`'s `order` function.

**Tech Stack:** TypeScript, React 19, Ink 8, `@openuidev/lang-core`, vitest, ink-testing-library.

**Spec:** `packages/ink-lang/docs/superpowers/specs/2026-10-19-focus-layers-design.md`, Part 1 and the `order` extension point of Part 3.

## Global Constraints

- Only `packages/ink-lang` changes. Run `pnpm` with `OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1`.
- Code style: one file per responsibility, named functions, plain interfaces, no method chaining, no conditional or mapped types, no deep generics. Everything written to files in English. No em dash.
- TDD: every behaviour gets a failing ink-testing-library or unit test first. Commit messages carry no co-author trailer.
- Existing tests keep passing; where a test encoded the old mount-order behaviour, change its expectation to the tree order and say so in the test name.
- The order depends only on the tree and on which children are rendered: never on mount timing, terminal width or scrolling.

## Review Focus

- A stop several levels deep (an `Input` inside a `Table` cell inside a `Card` inside a row `Stack`) must come between its siblings' stops exactly where the tree says; pinned in Task 2.
- A component that renders a child conditionally (`hasHeader ? renderNode(header) : null`) must keep the later children in order on both renders; pinned in Task 1.
- A host stop registered after the program's stops (rendered after the renderer in JSX) has no path and must neither crash `focusOrder` nor land inside the program's sequence; pinned in Task 6.
- Escape in a focused `Combobox` must still clear its filter and then drop focus, as Ink did, once Ink's Escape handling is off; pinned in Task 3.
- A host stop with `autoFocus` mounting after `disableFocus()` ran must still take focus, and only when nothing is focused; pinned in Task 3.

---

### Task 1: Sequence paths from `renderNode`

**Files:**

- Create: `src/focus/sequence-path.ts`
- Create: `src/focus/sequenced-render.tsx`
- Modify: `src/render-node.tsx`
- Modify: `src/render-value.tsx`
- Test: `test/focus/sequence-path.test.tsx`

**Interfaces:**

- Consumes: `RenderNode`, `renderValue(value)`, `ElementPathContext`.
- Produces:
  - `SequencePathContext: Context<number[]>` (default `[]`) and `useSequencePath(): number[]` in `sequence-path.ts`.
  - `RenderNodeOptions { order?: number }` and `SequencedRenderNode = (value: unknown, options?: RenderNodeOptions) => ReactNode` in `sequenced-render.tsx`, with `createSequencedRenderer(): SequencedRenderNode`: a fresh counter per call; each element rendered gets the next index (`options.order` overrides it); an array hands each item the next index in turn.
  - `RenderNode` takes `order: number` and provides `SequencePathContext` with `parent.concat(order)`.
  - The renderer's root node is rendered with `order: 0`.

- [ ] **Step 1: Write the failing test**

A `Probe` component inside the program (register it in a test-only library next to `inkLibrary`'s components) reads `useSequencePath()` into a shared array. Program: `root = Stack([Probe("a"), Stack([Probe("b"), Probe("c")]), Probe("d")])`.

```ts
expect(seen).toEqual({ a: [0, 0], b: [0, 1, 0], c: [0, 1, 1], d: [0, 2] });
```

Second test, conditional child: a test-only container that renders `renderNode(props.header)` only when `props.showHeader` is true, then `renderNode(props.body)`. With the header shown, body is `[0, 1]`; after `update` with the header hidden, body is `[0, 0]` (the test only pins that the order never puts the body before a shown header and is stable across the two renders).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/focus/sequence-path.test.tsx`
Expected: FAIL, `useSequencePath` not found.

- [ ] **Step 3: Implement `sequence-path.ts`, `sequenced-render.tsx`, and wire `RenderNode`**

`RenderNode` creates the sequenced renderer per render (`useMemo` is wrong here: the counter must reset every render) and passes it as `renderNode` to the Renderer. `renderValue(value, order)` becomes the pure fallback used by the sequenced renderer; arrays map through the counter.

- [ ] **Step 4: Run the test and the full suite**

Run: `pnpm exec vitest run`
Expected: all pass (the sequenced function still satisfies `(value: unknown) => ReactNode`).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ink-lang): sequence paths numbered by each component's renderNode calls"
```

### Task 2: Stops register their path; `focusOrder` sorts by it

**Files:**

- Modify: `src/focus/focus-registry.ts` (`FocusEntry.path: number[] | null`)
- Modify: `src/focus/use-focusable.ts` (`order?: number`, default 0; path from `useSequencePath()`, `null` when the context is empty)
- Modify: `src/focus/focus-order.ts`
- Modify: `src/components/tabs.tsx`, `src/components/table.tsx`, `src/components/table-pager.tsx`, `src/components/editable-table.tsx`, `src/components/editable-cell.tsx`, `src/components/card-block.tsx`, `src/components/list-block.tsx`, `src/components/accordion.tsx`
- Test: `test/focus/focus-order.test.tsx`, `test/focus/sequence-order.test.tsx`

**Interfaces:**

- Consumes: `useSequencePath()`.
- Produces:
  - `ORDER_LAST = Number.MAX_SAFE_INTEGER` in `focus-order.ts`.
  - `FocusStop.path: number[]` is now the sequence path; `focusOrder(registry)` returns only stops with a path, sorted by `compareSequencePath(a, b)`: element by element, then the shorter path first (a component's own stop before its children at the same index).
  - `hostStops(registry): FocusEntry[]` returns the active entries whose path is `null`, in registration order.

- [ ] **Step 1: Write the failing tests**

`sequence-order.test.tsx`, each a program rendered with `renderProgram` and walked with `KEYS.TAB`:

```ts
// Deep nesting: row Stack of two Cards; the first Card holds a Table with an Input cell and a Button under it.
expect(visited).toEqual(["Input:q", "[ Under ]", "[ Right ]"]);
// Tabs: the strip is one stop before the active tab's content.
expect(visited).toEqual(["One", "[ In tab ]"]);
// Paged Table with Inputs: cells row by row, then the pager.
expect(visited).toEqual(["Input:a1", "Input:b1", "Input:a2", "Input:b2", "[ prev ]", "[ next ]"]);
// EditableTable: cells row by row.
// Card block with actions and grid.columns 2: items in declaration order.
// Accordion and ListBlock: sections and items top to bottom.
```

Update `focus-order.test.tsx`: the `path` assertions become sequence paths (`Input:q` is `[0, 0, 0]`, `Button:Go` is `[0, 1, 0]`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run test/focus/sequence-order.test.tsx test/focus/focus-order.test.tsx`
Expected: FAIL on the Tabs and pager cases (DOM order puts them elsewhere) and on the path values.

- [ ] **Step 3: Implement**

`useFocusable` reads the context path and appends `options.order ?? 0`. Component orders: `TablePager` passes `ORDER_LAST - 1` to `[ prev ]` and `ORDER_LAST` to `[ next ]`, so both come after every cell; `EditableTable` passes `order: rowIndex * columnCount + columnIndex` to each `EditableCell`; `card-block` items `order: index`; `list-block` items `order: index`; `accordion` headers `order: index`; `Tabs` strip keeps `order: 0` (the tie rule puts it before the content). Remove `documentPath` and the Ink DOM import from `focus-order.ts`.

- [ ] **Step 4: Run the full suite**

Run: `pnpm exec vitest run`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ink-lang): focus order from sequence paths, components order their own stops"
```

### Task 3: The library owns Tab, Shift+Tab, Escape and autoFocus

**Files:**

- Create: `src/focus/focus-navigator.tsx` (replaces `arrow-navigator.tsx`; delete the old file)
- Create: `src/focus/focus-commands.ts`
- Modify: `src/focus/use-focusable.ts`, `src/focus/focus-scope.tsx`, `src/ink-renderer.tsx`, `src/focus/key-reporter.tsx`, `src/index.ts`
- Test: `test/focus/focus-navigator.test.tsx`

**Interfaces:**

- Consumes: `focusOrder`, `hostStops`, `nextInOrder`, `useLayerIsActive` semantics (entries carry `isActive` already filtered by layer).
- Produces:
  - `FocusCommands { focusFirst: () => void; focusNext: () => void; focusPrevious: () => void }`, `FocusCommandsContext` (default: no-ops) and `useFocusCommands()` in `focus-commands.ts`.
  - `FocusNavigator` component: calls `manager.disableFocus()` once on mount; handles Tab and Shift+Tab (`nextInOrder` over the cycle, no deferred `setTimeout`), Escape (`manager.focus` cleared the way Ink did: `setActiveFocusId(undefined)` is not exposed, so Escape calls `manager.disableFocus()` then `manager.enableFocus()`, which clears the active id), the arrows as today; provides `FocusCommandsContext`.
  - `activeEntry(registry, activeId)` moves to `focus-navigator.tsx`.
  - `useFocusable({ autoFocus })`: an effect after registration calls `manager.focus(id)` when `autoFocus` and `manager.activeId === undefined`.
  - The cycle, until Task 6: `hostStops` first in registration order, then `focusOrder`.

- [ ] **Step 1: Write the failing tests**

```ts
// Shift+Tab from the first stop wraps to the last, with no intermediate frame on another stop
// (assert the frame right after the key, with settle(0)).
// Escape in a focused Combobox clears the filter and drops focus (port the expectation from test/combobox.test.tsx).
// A host component with autoFocus mounted inside FocusScope after the renderer takes focus on mount;
// a second autoFocus component mounted later does not steal it.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run test/focus/focus-navigator.test.tsx`
Expected: FAIL, `FocusNavigator` not found.

- [ ] **Step 3: Implement and rename references**

`ink-renderer.tsx` and `focus-scope.tsx` mount `FocusNavigator`; `index.ts` exports `FocusNavigator`, `FocusCommands`, `useFocusCommands` and drops `ArrowNavigator`.

- [ ] **Step 4: Run the full suite**

Run: `pnpm exec vitest run`
Expected: all pass, including `test/combobox.test.tsx` and `test/tooltip.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ink-lang): the library owns Tab, Shift+Tab, Escape and autoFocus"
```

### Task 4: Modal and ModalDialog sequence

**Files:**

- Modify: `src/components/modal.tsx` (`CloseButton` gets `order: ORDER_LAST`; focus into the layer through `useFocusCommands().focusFirst` instead of Ink's `focusNext`)
- Modify: `src/components/modal-dialog.tsx` (`DialogButton` takes `order`; cancel `0`, confirm `1`; same `focusFirst`)
- Test: `test/focus/modal-layer.test.tsx`, `test/modal-dialog.test.tsx`

**Interfaces:**

- Consumes: `ORDER_LAST`, `useFocusCommands`.
- Produces: nothing new.

- [ ] **Step 1: Write the failing tests**

```ts
// Modal open: Tab visits [ Inside ] then [ x ], then wraps to [ Inside ].
// ModalDialog open: focus lands on [ Cancel ] when it opens; Tab reaches [ Delete contact ]; Tab wraps.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run test/focus/modal-layer.test.tsx test/modal-dialog.test.tsx`
Expected: FAIL on the `[ x ]` position (today it is first).

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the full suite**

Run: `pnpm exec vitest run`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ink-lang): modal close control last, dialogs focus their first stop through focus commands"
```

### Task 5: Tooltip and CompositeCardBlock audit

**Files:**

- Modify: `src/components/tooltip.tsx` (the bubble is rendered outside the sequence: render it with `renderNode` never, which is already the case; keep the trigger's stop detection; remove nothing)
- Modify: `src/components/composite-card-block.tsx` (header, body, footer already in call order; add a test only)
- Test: `test/focus/sequence-order.test.tsx`

- [ ] **Step 1: Write the tests**

```ts
// Tooltip(Button) between two Buttons: visited in declaration order, the bubble never focused.
// CompositeCardBlock with a header Button, a body Input and a footer Button: header, body, footer per card, card by card.
```

- [ ] **Step 2: Run tests**

Run: `pnpm exec vitest run test/focus/sequence-order.test.tsx`
Expected: PASS without code changes (this task pins the audit); if one fails, fix the component's `order` and keep the test.

- [ ] **Step 3: Commit**

```bash
git commit -m "test(ink-lang): pin the sequence of Tooltip and CompositeCardBlock stops"
```

### Task 6: `FocusScope.order` and the showcase

**Files:**

- Modify: `src/focus/focus-scope.tsx` (`order?: (program: FocusStop[], host: FocusEntry[]) => string[]`, returning the ids of the full cycle; default `defaultCycle` = host ids then program ids)
- Modify: `src/focus/focus-navigator.tsx` (reads the cycle from a `FocusCycleContext` the scope provides; the renderer without a scope uses `defaultCycle`)
- Modify: `examples/showcase/showcase-app.tsx` (passes `order` placing the sidebar, the theme select, then the program)
- Modify: `README.md` ("Focus order" section rewritten for sequence paths, `FocusScope.order`, Escape and autoFocus owned by the library), `AGENTS.md` (module table rows for `sequence-path.ts`, `sequenced-render.tsx`, `focus-navigator.tsx`, `focus-commands.ts`; remove `arrow-navigator.tsx`)
- Test: `test/focus/focus-scope.test.tsx`, `test/showcase/showcase-app.test.tsx`

**Interfaces:**

- Consumes: `focusOrder`, `hostStops`, `FocusStop`, `FocusEntry`.
- Produces: `FocusScopeProps.order`, `defaultCycle(program: FocusStop[], host: FocusEntry[]): string[]` exported from `focus-scope.tsx`.

- [ ] **Step 1: Write the failing tests**

```ts
// A host Panel rendered AFTER the renderer in JSX, default order: Tab visits [ Panel ] first, then the program.
// The same with order: (program, host) => program.map(id).concat(host.map(id)): Tab visits the program first.
// Showcase: existing "moves focus from the page back into the sidebar" keeps passing; add that Tab from the
// theme select reaches the page's first stop and Shift+Tab from the sidebar wraps to the page's last stop.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run test/focus/focus-scope.test.tsx`
Expected: FAIL, `order` ignored.

- [ ] **Step 3: Implement, then update README and AGENTS**

- [ ] **Step 4: Run the full suite and lint**

Run: `pnpm run ci`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(ink-lang): hosts place their stops around the program through FocusScope.order"
```

### Task 7: Real-terminal check

**Files:** none.

- [ ] **Step 1: Run the showcase in tmux** (`tmux new-session -d -s ink -x 130 -y 44 "pnpm run showcase"`), on the Forms, Data, Navigation and Dialogs pages: Tab walks the tree order (cells before the pager, strip before tab content, Cancel before Confirm, `[ x ]` last), Escape drops focus, Shift+Tab wraps, no stop visited twice per cycle.

- [ ] **Step 2: Record anything off as a failing test in the owning task's file, fix, rerun `pnpm run ci`.**

- [ ] **Step 3: Fast-forward `main` and push both branches to the fork.**
