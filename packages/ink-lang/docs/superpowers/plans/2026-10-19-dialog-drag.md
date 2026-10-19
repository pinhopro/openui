# Dialog drag, re-anchoring and resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dialogs can be dragged by their title bar (mouse) or moved with Ctrl+arrows, re-anchor on drop to the stop behind them (so their place in the Tab order follows), keep their anchor and relative offset across a terminal resize, and report drag events; the focus map exposes each stop's layer and anchor.

**Architecture:** `useOverlay` gains an `offset` (added after placement, then clamped into the bounds) and an `onPlaced` callback (the shown form's rect in root cells). A `useDrag` hook on the dialog's title bar turns a captured press-move-release into an offset and emits `dragstart`/`drag`/`dragend`; Ctrl+arrows do the same from the keyboard while a stop of the dialog has focus. On drop, a pure `anchorBehind(topLeft, stops)` picks the base stop behind the dialog's top-left cell; the dialog then anchors its overlay to that stop's box with an offset recomputed so it stays where it was dropped, and wraps its content in that stop's sequence path so its stops sit right after it in the cycle; when the stop disappears, the dialog falls back to its declaration anchor. Resize changes positions only: the base order is tree-derived, anchored overlays are re-placed from their anchor's new rect, and the clamp keeps everything on screen.

**Tech Stack:** TypeScript, React 19, Ink 8, `@openuidev/lang-core`, vitest, ink-testing-library (`test/helpers/render-terminal.tsx` for resizes), tmux.

**Spec:** `packages/ink-lang/docs/superpowers/specs/2026-10-19-focus-layers-design.md`, Part 2 "Anchoring and drag", "Resize", "Mouse" (drag), Part 3 (`draggable`, focus map `layer`/`anchor`, drag events); delivery step 4.

## Global Constraints

- Only `packages/ink-lang` changes. Run `pnpm` with `OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1`.
- Code style: one file per responsibility, named functions, plain interfaces, no method chaining, no conditional or mapped types, no deep generics. Everything written to files in English. No em dash.
- TDD: every behaviour gets a failing test first. Commit messages carry no Co-Authored-By trailer.
- The base layout never changes because a dialog is dragged (the overlay moves, the page does not; the standalone spacer rule of step 3 stays).
- Re-anchoring happens on drop only, never during a drag; the anchor is a stop id, never coordinates; a never-dragged dialog keeps its declaration anchor across resizes.
- The order of the base stops never changes on resize (step 1's rule).

## Review Focus

- A drag that ends outside the bounds (mouseup past the right edge) must leave the dialog clamped inside, with `dragend` reporting the clamped cell; pinned in Task 2.
- Dropping a dialog onto the cells of its own opener must anchor to that opener (the stop under the top-left cell) and keep Tab order sane (opener, then the dialog's stops); pinned in Task 3.
- A re-anchored dialog whose anchor stop unmounts (a tab switched) must fall back to its declaration anchor without throwing and without losing its stops from the cycle; pinned in Task 3.
- Ctrl+arrows must not move focus (the navigator ignores modified arrows) and must move only the dialog whose stop has focus, never a page dialog while a modal is open; pinned in Task 2.
- A resize while a dialog is mid-drag (pressed) must not corrupt the offset: the drag continues from the new positions; pinned in Task 4.

---

### Task 1: Offset and placed rect on `useOverlay`

**Files:**

- Modify: `src/overlay/use-overlay.ts` (`offset?: { x: number; y: number }` option, default 0,0; `onPlaced?: (rect: CellRect | null) => void` called by the host whenever the shown form's cells change, with root cells, null while nothing shows), `src/overlay/overlay-registry.ts` (`Overlay.onPlaced`), `src/overlay/overlay-measure.ts` (`shownSpot` clamps into the bounds after adding the offset; a `cover` form ignores the offset), `src/overlay/overlay-host.tsx` (calls `onPlaced` after a placement change, outside render, only when the rect changed), `src/index.ts`
- Test: `test/overlay/overlay-offset.test.tsx`, `test/overlay/overlay-placement.test.ts`

**Interfaces:**

- Produces: `UseOverlayOptions.offset`, `UseOverlayOptions.onPlaced`, `clampIntoBounds(position, size, bounds)` exported from `overlay-placement.ts` (pure; used by `shownSpot`).

- [ ] **Step 1: Write the failing tests**

```ts
// A Floater with offset {x: 3, y: 1}: the overlay's top-left is 3 cells right and 1 row down from where it was without the offset.
// An offset pushing the form past the right edge: the form is clamped to end at the last column.
// onPlaced receives the shown rect once per change (open: a rect; move: a new rect; close: null); the same rect twice is not reported twice.
// clampIntoBounds unit cases.
```

- [ ] **Step 2: Run to verify they fail.** Run: `pnpm exec vitest run test/overlay/overlay-offset.test.tsx test/overlay/overlay-placement.test.ts`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): overlays take an offset, clamped into the bounds, and report where they were placed`.

### Task 2: Drag by the title bar and Ctrl+arrows, drag events

**Files:**

- Create: `src/overlay/use-drag.ts` (`useDrag({ enabled, handleRef, onDrop })` returns `{ offset, isDragging, moveBy(dx, dy) }`: `useMouse(handleRef, { onMouseDown, onMouseMove, onMouseUp })`: a left press records the pointer cell and the offset at press; captured moves set `offset = offsetAtPress + (pointer - pressCell)`; release calls `onDrop()`; `moveBy` adds to the offset and calls `onDrop()` at once; emits `dragstart` (press), `drag` (each move with a change), `dragend` (release) through `useUiEvents()` with `component`, `name` (the dialog's title) and the pointer cell)
- Modify: `src/ui-events.ts` (`"dragstart" | "drag" | "dragend"`), `src/components/dialog-surface.tsx` (`titleRef` prop on the title row Box, and a `dragging` flag that styles the title bold+inverse while dragging), `src/components/dialog-renderer.tsx` (`useDrag` with `enabled = props.draggable !== false && mouse on` for the pointer; `useInput` in the dialog content: Ctrl+ArrowLeft/Right/Up/Down calls `moveBy(±1, 0)`/`(0, ±1)` while a stop of this dialog has focus, read through `FocusRegistryContext` and `useFocusManager().activeId`), `src/schemas/dialog-schema.ts` and `src/schemas/modal-dialog-schema.ts` and `src/schemas/modal-schema.ts`? (no: `ModalSchema` is a verbatim react-ui copy and must not change; `Modal` is draggable by default with no prop), `src/components/modal.tsx` (same drag on its title row), `src/default-library.ts` (prompt notes), `test/helpers/keys.ts` (`CTRL_LEFT` etc.: `\u001b[1;5D`, `\u001b[1;5C`, `\u001b[1;5A`, `\u001b[1;5B`) (`test/helpers/mouse.ts` already has `MOUSE.press`, `MOUSE.drag` and `MOUSE.release`)
- Test: `test/dialog-drag.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// Mouse on: press on the title bar of an open ModalDialog, two drag reports (+4, +2), release: the dialog's
// top-left moved by (4, 2); events dragstart, drag, drag, dragend with the title as name; the page under it unchanged.
// A release past the right edge: the dialog ends clamped at the last column; dragend reports the clamped cell.
// Ctrl+Right with a stop of the dialog focused moves it 1 cell right and focus stays; Ctrl+Right with focus on a page
// button moves nothing; Ctrl+arrows while a modal is open move the modal, not a page Dialog.
// draggable false: a press on the title bar moves nothing and emits no drag events.
// Modal (generic): the same press-move-release on its title row moves it.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): dialogs drag by their title bar and move with Ctrl+arrows, reporting drag events`.

### Task 3: Re-anchoring on drop

**Files:**

- Create: `src/focus/anchor-behind.ts` (pure `anchorBehind(topLeft: { x, y }, stops: FocusStop[]): string | null`: the base stop (`overlay === null`) whose rect contains the cell, else the last base stop before the cell in reading order (a lower y, or the same y and a lower x, comparing the stop's top-left), else null)
- Modify: `src/components/dialog-renderer.tsx` (state `anchorStopId: string | null`; on drop: `anchorBehind` over `focusOrder(registry)` with the placed rect's top-left; when found, the overlay's `anchorRef` becomes that entry's `ref` and the offset is recomputed so the form stays where it was dropped (`droppedTopLeft - placeOverlay(anchorRect, size, placement, gap, bounds)`); the dialog's `render` wraps its content in `<SequencePathContext.Provider value={anchorEntry.path}>` so its stops sort right after the anchor stop; when the entry is gone or inactive on a later render, fall back to the declaration anchor and path), `src/focus/focus-order.ts` (`FocusStop.layer: string` = `"base"` or the overlay id, `FocusStop.anchor: string | null` = the anchor stop id for a re-anchored overlay's stops; `useFocusable` gets an `anchor` from a new `OverlayAnchorContext` the dialog's render provides)
- Test: `test/focus/anchor-behind.test.ts`, `test/dialog-drag.test.tsx`, `test/focus/focus-order.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// anchorBehind: inside a stop's rect; in the gap after a stop on the same row; on a row below the last stop; above the first stop (null).
// Program [A, Open, Dialog, B, C] with the Dialog open: drag it so its top-left lands on C's cells, release: Tab from C
// reaches the dialog's Close, then wraps to A; the dialog's stops report anchor = C's id and layer = the overlay id.
// Dropping onto the opener's cells anchors to Open: order A, Open, Close, B, C.
// The anchor stop unmounts (C inside a Tabs tab that is switched away): no error, the dialog still shows at its
// declaration anchor plus no offset, and its stops are back after Open in the cycle.
// A never-dragged dialog keeps anchor null.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): a dropped dialog re-anchors to the stop behind it and takes its place in the cycle`.

### Task 4: Resize behaviour

**Files:**

- Modify: `src/overlay/use-drag.ts` (a resize during a press: the next move computes from the new pointer cell against the press cell; the offset stays consistent because it is relative to the placement, which the host recomputes), `src/components/dialog-renderer.tsx` only if a test fails
- Test: `test/overlay/overlay-resize.test.tsx` (uses `test/helpers/render-terminal.tsx`)

- [ ] **Step 1: Write the failing tests**

```ts
// Base order unchanged by a resize: a row Stack that wraps at 60 columns and not at 100: Tab visits the same sequence at both widths (resize in the middle of the cycle, the next Tab continues from the same stop).
// A never-dragged bottom Dialog follows its declaration anchor after a width change.
// A dragged dialog (re-anchored to B, offset +4,+2) keeps B as its anchor and the same offset after the terminal widens; when the terminal shrinks so the offset would push it out, it is clamped inside.
// A modal is re-centred after a resize.
// A press, a resize, then a drag report: the dialog follows the pointer from the new positions without a jump larger than the pointer delta.
```

- [ ] **Step 2: Run to verify they fail (at least the clamp and mid-drag cases).**
- [ ] **Step 3: Implement what is missing.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `test(ink-lang): dialogs keep their anchor and offset across a resize; the order never changes`.

### Task 5: Docs and the showcase

**Files:**

- Modify: README.md ("### Dialogs and modals" gains "Drag and re-anchoring" and "Resize" paragraphs: the title bar drag, Ctrl+arrows, `draggable`, the drop rule (stop behind the top-left cell, else the last stop before it in reading order), the anchor as a stop id, the fallback, resize rules; the focus map paragraph documents `layer` and `anchor`; the UI events table gains the three drag rows), AGENTS.md (rows for `use-drag.ts`, `anchor-behind.ts`, the pattern paragraph), the spec (Part 3 `draggable` line marked delivered; step 4 of the delivery list ticked), `examples/showcase/programs/dialogs.ts` (the intro text mentions dragging by the title bar and Ctrl+arrows), `test/showcase/showcase-app.test.tsx` (a drag of the note dialog in the showcase with mouse on)
- Test: as listed

- [ ] **Step 1: Write the showcase drag test and see it fail (if the note dialog is not yet draggable there) or pass.**
- [ ] **Step 2: Write the docs.**
- [ ] **Step 3: Run `pnpm run ci`.** Expected: exit 0.
- [ ] **Step 4: Commit** `docs(ink-lang): dialog drag, re-anchoring, resize and the focus map's layer and anchor`.

### Task 6: Real-terminal check

- [ ] **Step 1:** tmux 130x44, showcase Dialogs page: drag the note dialog with SGR press/motion/release reports (`\e[<0;x;yM`, `\e[<32;x;yM`, `\e[<0;x;ym`): the dialog follows the pointer, the page does not move; Tab after the drop follows the new anchor; Ctrl+arrows move the focused dialog; `tmux resize-window -x 100 -y 40` then back: the dialog keeps its place relative to its anchor and stays on screen; a modal is re-centred.
- [ ] **Step 2:** anything off becomes a failing test in the owning task's file, fixed, `pnpm run ci` rerun.
