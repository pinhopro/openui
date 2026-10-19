# Dialog layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modals and dialogs float as overlays with the keyboard and mouse rules of the spec: a see-through backdrop that cancels, Escape as cancel, a non-modal `Dialog` whose stops sit at its anchor and take priority while hovered or focused within, automatic focus when shown (after streaming), nested overlays, a dim base behind a modal, and `cancel`/`open`/`close` UI events.

**Architecture:** Overlay content gets two host-provided contexts (its overlay id and whether its form shows), which `useFocusable` and `useMouse` fold in, so hidden content is inert and every stop knows its overlay. A `cover` placement and a see-through `backdrop` kind give the modal its full-bounds click surface. Modal layers carry a cancel handler the navigator calls on Escape. A scope-level priority state (hovered overlay from the host, focus-within from the registry) restricts the Tab cycle and the arrows to one dialog while it holds. `Modal`, `ModalDialog` and the new `Dialog` share one surface component and render through `useOverlay`.

**Tech Stack:** TypeScript, React 19, Ink 8 (`internal_transform` for the dim), `@openuidev/lang-core`, vitest, ink-testing-library, tmux.

**Spec:** `packages/ink-lang/docs/superpowers/specs/2026-10-19-focus-layers-design.md`, Part 2 "Tab order with layers", "Mouse", "Streaming", the dim option of "Rendering"; Part 3 "OpenUI Lang components" (`ModalDialog`, `Dialog`, `Modal`), "UI events" (`cancel`, `open`, `close`); delivery step 3.

## Global Constraints

- Only `packages/ink-lang` changes. Run `pnpm` with `OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1`.
- Code style: one file per responsibility, named functions, plain interfaces, no method chaining, no conditional or mapped types, no deep generics. Everything written to files in English. No em dash.
- TDD: every behaviour gets a failing test first. Commit messages carry no Co-Authored-By trailer.
- The base layout never changes because a modal or dialog is open (the row after a dialog's declaration keeps its y).
- Step 1's Tab order (sequence paths) and step 2's overlay machinery are reused, not reworked: a dialog's stops carry the owner's sequence path through the bridge, which is how they sit "at the anchor" in the cycle.
- `render` functions passed to `useOverlay` call no hooks; components inside the returned JSX may.

## Review Focus

- A dialog in its hidden first pass (measured below the root) must take no focus and no clicks, and its `autoFocus` into the layer must wait for the shown form; pinned in Tasks 1 and 3.
- A click on the backdrop exactly on the dialog's border must reach the dialog, not cancel; pinned in Task 2.
- Escape while a Combobox inside a modal has an open filter must clear the filter first and only the next Escape cancels the modal; pinned in Task 3.
- A non-modal dialog's priority by hover must end when the pointer leaves the dialog while no stop inside has focus, and must not end while one has; pinned in Task 5.
- A modal opened while the program is still streaming must not take focus until streaming ends; pinned in Task 6.

---

### Task 1: Overlay content contexts and inert hidden content

**Files:**

- Create: `src/overlay/overlay-content-context.ts` (`OverlayIdContext: Context<string | null>` default null; `OverlayVisibleContext: Context<boolean>` default true; `useOverlayId()`, `useOverlayVisible()`)
- Modify: `src/overlay/overlay-box.tsx` (provides both around the content: the id from a new `overlayId` prop, visible from `spot.visible`), `src/overlay/overlay-host.tsx` (passes `overlayId`), `src/focus/focus-registry.ts` (`FocusEntry.overlay: string | null`), `src/focus/use-focusable.ts` (`isActive = options.isActive && layerActive && useOverlayVisible()`, entry `overlay` from `useOverlayId()`), `src/mouse/use-mouse.ts` (handlers empty while not visible), `src/focus/focus-order.ts` (`FocusStop.overlay: string | null`), `src/overlay/context-bridge.tsx` (the two contexts are NOT bridged; the host provides them after the bridge), `src/index.ts`
- Test: `test/overlay/overlay-content.test.tsx`

**Interfaces:**

- Produces: the two contexts and hooks; `FocusEntry.overlay`, `FocusStop.overlay`.

- [ ] **Step 1: Write the failing tests**

```ts
// A test-only Floater whose overlay content holds a Button (test library): while the overlay's whole form is
// hidden (force it: a program one row high with a bordered 3-row content and no renderCompact), Tab never
// reaches the button (the cycle skips it) and a MOUSE.click on the row below the root reaches nothing;
// once the overlay fits (taller program), Tab reaches it and its FocusStop.overlay equals the overlay's id
// (read through a Probe on FocusRegistryContext); a base stop's overlay is null.
```

- [ ] **Step 2: Run to verify they fail.** Run: `pnpm exec vitest run test/overlay/overlay-content.test.tsx`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): overlay content knows its overlay and goes inert while its form is hidden`.

### Task 2: Cover placement and the backdrop

**Files:**

- Modify: `src/overlay/overlay-placement.ts` (`OverlayPlacement` gains `"cover"`: the box spans the bounds; `placeOverlay` returns the bounds' top-left; `overlayFits` true), `src/overlay/overlay-measure.ts` (`FormSpot.cover: boolean`; a cover form's width and height are the bounds', never measured), `src/overlay/overlay-box.tsx` (a cover form sets `width` and `height`), `src/overlay/overlay-registry.ts` (`OverlayKind` gains `"backdrop"`), `src/overlay/use-overlay.ts`
- Create: `src/overlay/backdrop.tsx` (`Backdrop({ onCancel })`: a full-size Box registered with `useMouse` whose `onClick` calls `onCancel`; rendered inside a backdrop overlay's content, so it is innermost in its layer and wins over the shield)
- Test: `test/overlay/overlay-placement.test.ts`, `test/overlay/backdrop.test.tsx`

**Interfaces:**

- Produces: placement `"cover"`, kind `"backdrop"`, `Backdrop` component.

- [ ] **Step 1: Write the failing tests**

```ts
// placement: cover returns the bounds' top-left and fits.
// backdrop: a test-only component registers two overlays in order: a see-through cover backdrop with
// <Backdrop onCancel> and, above it, a centred bordered box with a Button. With mouse on: a click on a base
// cell far from the box calls onCancel once and the base button under it does not fire; a click on the
// box's border cell calls neither; a click on the Button inside fires the Button. The base text still shows
// through the backdrop's cells (not opaque).
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): cover placement and a see-through backdrop that cancels on click`.

### Task 3: Modals as overlays with cancel

**Files:**

- Modify: `src/focus/modal-layer.ts` (`ModalLayers.open(id, onCancel: () => void)`; `cancelActive(): boolean` calls the top layer's handler, returns false when none), `src/focus/use-modal-layers.ts`, `src/focus/focus-navigator.tsx` (Escape: `layers.cancelActive()` first; when it returns false, drop focus as today), `src/ui-events.ts` (`"cancel" | "open" | "close"`), `src/components/modal-dialog.tsx`, `src/components/modal.tsx`
- Create: `src/components/dialog-surface.tsx` (`DialogSurface`: the bordered box with mark, title, body or children, and buttons; props for everything, no hooks that read the dialog's own state), `src/components/use-dialog-layer.ts` (`useDialogLayer({ isOpen, modal, onCancel, layerId })`: holds the modal layer while open, focuses the first stop of the layer once it is shown and not streaming (replaces the `holdLayer`/`focusIntoLayer` pairs), emits `open`/`close` UI events)
- Test: `test/modal-dialog.test.tsx`, `test/modal.test.tsx`, `test/focus/modal-layer.test.tsx`, `test/ui-events.test.tsx`

**Interfaces:**

- Consumes: `useOverlay`, `Backdrop`, `OverlayIdContext`.
- Produces: `DialogSurface`, `useDialogLayer`, the `cancel`/`open`/`close` events (`component` the dialog's type, `name` its title).

Rules: a modal registers two overlays from the same component, the backdrop (kind `backdrop`, placement `cover`, `opaque: false`) then the dialog (kind `modal`, placement `center`, opaque); the dialog's `render` wraps the surface in `<LayerIdContext.Provider value={layerId}>` (JSX, no hooks); backdrop click, Escape and the cancel button all run `cancel` (sets `$open` false, runs `cancelAction`, emits `cancel`); `Modal`'s `[ x ]` is its cancel; a modal without an `open` binding stays shown (ModalDialog today) and `cancel` only emits.

- [ ] **Step 1: Write the failing tests**

```ts
// ModalDialog over a program with a Button and a TextContent after the dialog's declaration: the row of that
// text keeps its y when the dialog opens (layout unchanged) and the dialog's box is painted over the page.
// Escape while the dialog is open emits cancel, runs cancelAction and closes it; Escape while a Combobox
// inside a Modal has a filter typed clears the filter and keeps the modal open; the next Escape closes it.
// A click on the backdrop closes it; a click inside does not. open/close events are emitted with the title.
// The existing modal-layer tests (Tab trapped, wraps, clicks outside ignored) keep passing.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite** (showcase Dialogs page included).
- [ ] **Step 5: Commit** `feat(ink-lang): modals float with a backdrop; Escape and the backdrop cancel`.

### Task 4: The non-modal Dialog

**Files:**

- Create: `src/schemas/dialog-schema.ts` (`DialogSchema`: `variant`, `title`, `body`, `cancelLabel?`, `confirmLabel?`, `open?` reactive, `confirmAction?`, `cancelAction?`, `placement?: "top" | "bottom" | "left" | "right" | "center"` default `"bottom"`), `src/components/dialog.tsx` (`Dialog`: an in-flow zero-size anchor Box at its declaration; one overlay of kind `dialog` at `placement`, opaque, no backdrop, no modal layer; `useDialogLayer({ modal: false })` focuses its first stop when shown; cancel closes and emits)
- Modify: `src/default-library.ts` ("Terminal extras" group, prompt note), `src/index.ts`, `test/components.test.tsx` (sorted list), `examples/showcase/programs/dialogs.ts` (a non-modal example: `noteDialog = Dialog("info", "Draft saved", "Keep editing or close this note.", "Close", null, $note)` opened by a button)
- Test: `test/dialog.test.tsx`, `test/showcase/pages.test.tsx` (coverage)

- [ ] **Step 1: Write the failing tests**

```ts
// Dialog open under a program [Button A, Dialog(..., $note), Button B]: the base stays interactive (Tab reaches
// A and B); the dialog's stops sit between A and B in the cycle (declaration position); it opens with focus on
// its first stop; the row of Button B keeps its y; cancel closes it and emits.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): Dialog, a non-modal dialog floating at its declaration`.

### Task 5: Priority by hover or focus within

**Files:**

- Create: `src/focus/overlay-priority.ts` (`OverlayPriority { hovered: string | null; setHovered(id | null) }` state held by `FocusScope` (and by a standalone renderer) in a context `OverlayPriorityContext`; pure `priorityOverlay(hovered, activeEntry): string | null` = the active stop's `overlay` when not null, else `hovered`)
- Modify: `src/overlay/overlay-box.tsx` (a `kind === "dialog"` form registers enter/leave on its box through a small `PriorityTracker` component that sets `hovered`), `src/focus/focus-navigator.tsx` (`tabCycle` and the arrow candidates keep only the stops whose `overlay` equals the priority overlay while one holds; Escape with priority by focus: drop focus (the dialog keeps its place in the cycle), with priority by hover only: nothing), `src/focus/focus-scope.tsx`, `src/ink-renderer.tsx`
- Test: `test/focus/overlay-priority.test.ts`, `test/dialog.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// pure: priorityOverlay(null, entry with overlay "d") === "d"; ("d", base entry) === "d"; (null, base) === null.
// Dialog with two buttons over a base with A and B: Tab from the dialog's first stop goes to its second, then
// wraps to its first (priority by focus); Escape drops focus, then Tab visits A, dialog stops, B (no priority);
// with mouse on, the pointer entering the dialog box gives priority (Tab cycles inside) and leaving it with no
// focus inside ends it; leaving while a dialog stop has focus keeps it. Arrows inside a prioritised dialog
// never reach a base stop.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): a dialog takes Tab and the arrows while hovered or focused within`.

### Task 6: Streaming, dim behind, nesting, docs

**Files:**

- Modify: `src/components/use-dialog-layer.ts` (focus into the layer only when not streaming; re-run when streaming ends), `src/ink-renderer.tsx` and a new `src/dim-behind.tsx` (while a modal layer is open, the page is wrapped in a `DimBehind` element: Ink's `Transform` only wraps text, so `DimBehind` creates the raw `ink-box` element with `internal_transform` set to a function prefixing each line with the dim SGR, the way `Transform` does for `ink-text`; `renderNodeToOutput` passes a node's `internal_transform` down to every descendant. It is an internal reliance like `contentOffsetY`, named in the JSDoc; if it does not reach descendants in this Ink version, the task reports it and ships without the dim. Prop `dimBehindModal?: boolean` default true), README.md ("## Overlays" gains "### Dialogs and modals": kinds, backdrop, cancel, Escape, priority rules, auto focus, streaming, dim, nesting; Components table rows for `Dialog`; UI events table rows), AGENTS.md (rows for the new files, the pattern paragraph), the spec (one line in Part 3 noting `Dialog` placement default and that `draggable` is step 4)
- Test: `test/modal-dialog.test.tsx` (streaming: a dialog opened by state while `isStreaming` takes no focus; `update({ isStreaming: false })` then focuses it), `test/overlay/overlay-nesting.test.tsx` (a Tooltip inside a modal's content shows over the modal; a Dialog opened from a modal's button sits above it and takes priority; closing it returns focus into the modal), `test/ink-renderer.test.tsx` (dim: with a modal open the base lines carry `\u001b[2m`; without, they do not)

- [ ] **Step 1: Write the failing tests.**
- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement; write the docs.**
- [ ] **Step 4: Run `pnpm run ci`.** Expected: exit 0.
- [ ] **Step 5: Commit** `feat(ink-lang): dialogs wait for streaming, dim the page behind a modal, nest; docs`.

### Task 7: Real-terminal check

- [ ] **Step 1:** tmux 130x44, showcase Dialogs page: every dialog floats over the page without moving it; backdrop click cancels; Escape cancels; Tab trapped; the non-modal note dialog opens with focus, Tab cycles inside while focused, Escape releases it, the page behind stays usable; the page behind a modal is dim; the Feedback page's generic Modal behaves the same; the Chat page's dialog (if any) still works.
- [ ] **Step 2:** anything off becomes a failing test in the owning task's file, fixed, `pnpm run ci` rerun.
