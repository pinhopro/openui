# Overlays and the floating Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Floating elements render on top of the program without changing its layout: an overlay host paints absolutely positioned boxes after everything else, the mouse hit-test respects that stacking, and `Tooltip` becomes the first overlay.

**Architecture:** Components register overlays (anchor box, placement, content) in an `OverlayRegistry`; an `OverlayHost` rendered last in the tree (by `FocusScope` for the whole app, or by a standalone `InkRenderer`) measures each anchor after layout and paints the content in a `position="absolute"` box, re-providing the library contexts the registering component captured (a context bridge). Mouse targets carry a stacking layer so overlays win the hit-test. Ink 8 paints later nodes over earlier cells and positions absolute children relative to their parent, which is all the host needs.

**Tech Stack:** TypeScript, React 19, Ink 8 (`position="absolute"`, `top`/`left`, `measureElement`), `@openuidev/lang-core`, vitest, ink-testing-library, tmux for the real terminal.

**Spec:** `packages/ink-lang/docs/superpowers/specs/2026-10-19-focus-layers-design.md`, Part 2 "Rendering" (delivery step 2), plus the parked minors of step 1.

## Global Constraints

- Only `packages/ink-lang` changes. Run `pnpm` with `OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1`.
- Code style: one file per responsibility, named functions, plain interfaces, no method chaining, no conditional or mapped types, no deep generics. Everything written to files in English. No em dash.
- TDD: every behaviour gets a failing ink-testing-library or unit test first. Commit messages carry no Co-Authored-By trailer.
- The base layout never changes because an overlay is open: the rows of the program keep their y when a tooltip or a dialog shows.
- Overlays stay inside the Ink root's rectangle: a placement that does not fit flips to the opposite side, then is shifted into the bounds.
- The order of focus stops is unchanged by this plan (overlay content inherits the anchor's sequence path through the bridge).

## Review Focus

- A tooltip whose trigger sits on the last row of a standalone renderer must still show (flipped above), since Ink's output ends at the root's height; pinned in Task 4.
- A tooltip trigger inside a scrolled pane (`contentOffsetY`) must be measured where it is on screen, not where it is in the content; pinned in Task 5 with the showcase.
- An overlay registered while its anchor is unmounted or zero-size must render nothing and never throw; pinned in Task 2.
- Two overlays open at once (two hovered or focused tooltips cannot happen, but a tooltip inside a modal's content can) must each sit at their own anchor and the later one paints on top; pinned in Task 2.
- A click on a cell where an overlay covers a base button must go to the overlay, and when the overlay closes the button gets clicks again; pinned in Task 3.

---

### Task 0: Parked minors from step 1

**Files:**

- Modify: `src/context.ts` (remove `renderNode` from `OpenUIContextValue` and its wiring in `src/use-openui-runtime.ts` and `src/ink-renderer.tsx`), `README.md` (the "never on mount timing" sentence of "### Focus order" becomes "never on mount timing within a program; renderers in one scope rank in the order they first render"; a sentence under `FocusNavigator` that several standalone renderers need a `FocusScope`, since Ink's focus switch is one global flag), `src/focus/focus-navigator.tsx` (same sentence in the JSDoc).
- Test: `test/context.test.tsx` (existing; add that the `renderNode` field is gone from the context value).

- [ ] **Step 1: Write the failing test** (a Probe inside a renderer asserts `"renderNode" in useOpenUI()` is false).
- [ ] **Step 2: Run it to verify it fails.** Run: `pnpm exec vitest run test/context.test.tsx`
- [ ] **Step 3: Remove the field and its wiring; fix the two README sentences and the JSDoc.**
- [ ] **Step 4: Run the full suite.** Run: `pnpm exec vitest run` Expected: all pass.
- [ ] **Step 5: Commit** `chore(ink-lang): drop the unnumbered context renderNode, document ranks and the single focus switch`.

### Task 1: Context bridge

**Files:**

- Create: `src/overlay/context-bridge.tsx`
- Test: `test/overlay/context-bridge.test.tsx`

**Interfaces:**

- Produces: `CapturedContexts` (a plain interface with one field per bridged context: `openUI`, `theme`, `designSystem`, `uiEvents`, `focusRegistry`, `focusCommands`, `modalLayers`, `layerId`, `elementPath`, `sequencePath`, `formName`, `formValidation`, `mouse`, `programRanks`, `focusCycle`), `useCapturedContexts(): CapturedContexts` (reads them with `useContext`, in a hook) and `BridgedContexts({ captured, children })` (re-provides every one of them, nested in that order). The contexts are the ones defined in `src/context.ts`, `src/theme.ts`, `src/design/design-system-context.ts`, `src/ui-events.ts`, `src/focus/focus-registry.ts`, `src/focus/focus-commands.ts`, `src/focus/modal-layer.ts` (both), `src/element-type-context.ts`, `src/focus/sequence-path.ts`, `src/form-name-context.ts`, `src/form-validation-context.ts`, `src/mouse/mouse-provider.tsx`, `src/focus/program-rank.ts`, `src/focus/focus-cycle.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// Inside a renderer, a test-only component captures its contexts and hands them to a Probe rendered
// OUTSIDE the renderer (a sibling of <InkRenderer> under the same ink root) through BridgedContexts:
// the Probe reads useElementPath() === ["Stack", "Capture"], useSequencePath() equal to the capturer's,
// useLayerIsActive() true, useOpenUI().library === inkLibrary (extended), and useTheme() is the renderer's theme.
```

- [ ] **Step 2: Run it to verify it fails.** Run: `pnpm exec vitest run test/overlay/context-bridge.test.tsx` Expected: FAIL, module not found.
- [ ] **Step 3: Implement `context-bridge.tsx`.**
- [ ] **Step 4: Run the test and the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): context bridge for content rendered outside its component's subtree`.

### Task 2: Overlay registry, placement and host

**Files:**

- Create: `src/overlay/overlay-registry.ts`, `src/overlay/overlay-placement.ts`, `src/overlay/overlay-host.tsx`, `src/overlay/use-overlay.ts`, `src/overlay/root-rect.ts`
- Modify: `src/ink-renderer.tsx` (mounts `OverlayHost` as the last child of the page box when no `OverlayRegistryContext` is inherited), `src/focus/focus-scope.tsx` (provides the registry and mounts `OverlayHost` after `children`), `src/index.ts` (exports)
- Test: `test/overlay/overlay-placement.test.ts`, `test/overlay/overlay-host.test.tsx`

**Interfaces:**

- Consumes: `CapturedContexts`, `BridgedContexts`, `useCapturedContexts`, `elementRect`.
- Produces:
  - `OverlayKind = "tooltip" | "dialog" | "modal"`; `OverlayPlacement = "top" | "bottom" | "left" | "right" | "center"`.
  - `Overlay { id: string; kind: OverlayKind; anchorRef: RefObject<DOMElement | null>; placement: OverlayPlacement; gap: number; render: () => ReactNode; captured: CapturedContexts; offset: { x: number; y: number } }` (`offset` is added to the placed position; 0 until step 4 adds drag).
  - `OverlayRegistry { register(overlay): () => void; update(overlay): void; subscribe(listener): () => void; list(): Overlay[] }` (registration order = stacking order; `createOverlayRegistry()`), `OverlayRegistryContext` (default null).
  - `useOverlay(options: { kind; anchorRef; placement; gap?; isOpen: boolean; render })`: registers while `isOpen`, updates on every render, captures contexts, returns `{ id }`.
  - `rootRect(element: DOMElement): CellRect` in `root-rect.ts`: the rect of the ink root reached through `parentNode` (its yoga node's computed width and height at 0,0).
  - `placeOverlay(input: { anchor: CellRect; size: { width: number; height: number }; placement: OverlayPlacement; gap: number; bounds: CellRect }): { x: number; y: number }` in `overlay-placement.ts`: bottom = `(anchor.x, anchor.y + anchor.height + gap)`, top = `(anchor.x, anchor.y - size.height - gap)`, right = `(anchor.x + anchor.width + gap, anchor.y)`, left = `(anchor.x - size.width - gap, anchor.y)`, center = centred in `bounds`; if the side does not fit in `bounds` flip to the opposite side; then shift the box so it lies inside `bounds` (never shrink).
  - `OverlayHost()`: renders `<Box position="absolute" top={0} left={0}>` wrapping, for each overlay in stacking order, `<Box key position="absolute" left top>` with `BridgedContexts` around `render()`. Positions are state measured in a layout effect after every render: anchor rect via `elementRect`, overlay size via `measureElement` of the overlay box (first pass renders at the anchor's position, the effect corrects it), bounds via `rootRect`; relative to the host box's own `elementRect`. Unchanged positions do not set state. An overlay whose anchor is null or zero-size renders nothing.

- [ ] **Step 1: Write the failing tests**

```ts
// overlay-placement.test.ts (pure):
expect(
  placeOverlay({
    anchor: { x: 4, y: 2, width: 6, height: 1 },
    size: { width: 10, height: 3 },
    placement: "bottom",
    gap: 0,
    bounds: { x: 0, y: 0, width: 40, height: 10 },
  }),
).toEqual({ x: 4, y: 3 });
// top with no room above flips below; bottom with no room below flips above; right at the edge flips left;
// a box wider than the room is shifted to x = 0; center centres in the bounds.

// overlay-host.test.tsx (ink-testing-library):
// A test-only "Floater" component in a program (test library) renders a Box with text "anchor" and registers an
// overlay (bottom) whose render() draws "OVERLAY" in a bordered box. Program: Stack([Floater, TextContent("row after")]).
// - the frame shows "row after" on the row right under "anchor" (layout unchanged) and "OVERLAY" painted over it;
// - an overlay with a null anchor (Floater prop hide) draws nothing and the test does not throw;
// - two Floaters open: each overlay sits under its own anchor; the second (later) paints over the first when they overlap;
// - a Floater on the last row of the program: the overlay is drawn above it (flipped), inside the root.
```

- [ ] **Step 2: Run them to verify they fail.** Run: `pnpm exec vitest run test/overlay/`
- [ ] **Step 3: Implement the registry, placement, host, hook and root rect; wire the renderer and the scope.**
- [ ] **Step 4: Run the suite.** Expected: all pass, including every showcase test.
- [ ] **Step 5: Commit** `feat(ink-lang): overlay host paints anchored floating boxes over the program`.

### Task 3: Mouse stacking

**Files:**

- Modify: `src/mouse/mouse-target.ts` (`MouseTarget.layer: number`, 0 for the base), `src/mouse/hit-test.ts` (`compareInnermost` sorts by `layer` descending first), `src/mouse/use-mouse.ts` (reads `MouseLayerContext`), `src/overlay/overlay-host.tsx` (provides `MouseLayerContext` = stacking index + 1 around each overlay)
- Create: `src/mouse/mouse-layer.ts` (`MouseLayerContext`, default 0)
- Test: `test/mouse/hit-test.test.tsx` (existing), `test/overlay/overlay-mouse.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// hit-test: two targets containing the cell, the shallower one with layer 1 comes first.
// overlay-mouse: a program with a Button under an open overlay whose render() has a clickable box (test-only):
// MOUSE.click on the covered cell calls the overlay's onClick, not the button's action; after the overlay closes the
// button's action fires on the same cell.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): overlays win the mouse hit-test`.

### Task 4: Tooltip as an overlay

**Files:**

- Modify: `src/components/tooltip.tsx` (the trigger stays in the flow in a `Box` with the focusable ref; the bubble is `useOverlay({ kind: "tooltip", anchorRef: focusable.ref, placement, gap: placement is left or right ? 1 : 0, isOpen, render })`; the bubble is a bordered box for every placement, sides included, styled by `.bubble` and the variant class as today; the focus and stop semantics of step 1 unchanged)
- Test: `test/tooltip.test.tsx` (update), `test/focus/sequence-order.test.tsx` (unchanged expectations must still pass)

- [ ] **Step 1: Write the failing tests**

```ts
// The bubble floats: with Tooltip(Icon, "View certificate details", "bottom") above a Button("Next"), focusing the
// tooltip shows the text on the row(s) below the icon, painted over "[ Next ]" (the Next row keeps its y: findCell
// of "[ Next ]" is the same before and after, or it is covered and reappears when focus leaves).
// "right": the bubble starts one cell right of the trigger on the trigger's row. "left": ends one cell left of it.
// "top" on the first row of the program flips below. Hover still opens it with mouse on.
```

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.**
- [ ] **Step 5: Commit** `feat(ink-lang): the Tooltip bubble floats over the program instead of pushing it`.

### Task 5: Scope-level host and the showcase

**Files:**

- Modify: `examples/showcase/showcase-app.tsx` only if the `FocusScope` needs a prop (it should not: the scope hosts overlays by default), `README.md` ("## Overlays" section after "### Focus order": what floats, the host, the bridge, stacking, placement rules, the scope-level host avoids the pane's clipping; the Tooltip paragraph updated), `AGENTS.md` (module rows for `src/overlay/*` and `src/mouse/mouse-layer.ts`)
- Test: `test/showcase/showcase-app.test.tsx` (a page whose Tooltip trigger sits on the pane's last visible row after scrolling: the bubble shows over the pane's bottom border instead of being clipped)

- [ ] **Step 1: Write the failing test.**
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement what is missing; write the docs.**
- [ ] **Step 4: Run `pnpm run ci`.** Expected: exit 0.
- [ ] **Step 5: Commit** `docs(ink-lang): overlays section; scope-level overlay host checked with the showcase`.

### Task 6: Real-terminal check

- [ ] **Step 1:** tmux 130x44, showcase Content page: focus each tooltip trigger (top, bottom, left, right); the bubble paints over the neighbours and the rows do not move; a trigger scrolled to the pane bottom shows the bubble over the border; a bubble over the QR code or wide characters (the Chat page avatars) leaves no half cells.
- [ ] **Step 2:** anything off becomes a failing test in the owning task's file, fixed, `pnpm run ci` rerun.
