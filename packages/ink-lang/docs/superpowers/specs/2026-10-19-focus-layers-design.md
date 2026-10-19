# Focus order and floating layers for `@openuidev/ink-lang`

Date: 2026-10-19. Status: draft for review.

## Goal

Make keyboard focus in the terminal renderer predictable and explainable:

1. The Tab order of a program is computed from its component tree, from `root` down, with each component deciding the order of its own children. Composition follows the same rule at every level.
2. Floating elements (tooltips, dialogs, modals) render on top of the program without changing its layout, and take their place in the Tab order from the element they belong to.
3. The host application (the showcase, or any app embedding `InkRenderer`) decides on its own where its stops go relative to the program's.

Everything below `root` is the library's responsibility. Everything above it is the host's.

## Vocabulary

- **Stop**: one focusable unit registered through `useFocusable` (a button, a field, a whole option group, one editable cell).
- **Base**: the program tree as laid out on screen, from `root` down.
- **Overlay**: a floating element painted over the base: a `tooltip`, a `dialog` (non-modal) or a `modal`.
- **Layer**: the base, or one overlay. Overlays form a stack above the base; the last opened is on top.
- **Anchor**: the tree node an overlay belongs to: the trigger of a tooltip, the declaration of a dialog.
- **Sequence path**: the list of indexes that places a stop in the tree order (see below).

## Part 1: Tab order from `root` down

### Rule

`order(node) = concat(order(child) for child in sequence(node))`, where `sequence(node)` is the order in which the component decides to visit its children. The order of the program is `order(root)`. A leaf that is a stop contributes itself; a leaf with several internal stops (an `EditableTable`, a paged `Table`, a card block with actions) contributes them in the order it defines.

Each component owns `sequence(node)` for its own children, based on how it lays them out:

| Container                                                                 | Sequence of children                                                               |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Stack`, `Card` (column)                                                  | top to bottom                                                                      |
| `Stack`, `Card` (row, with or without wrap)                               | left to right, each child in full before the next; with wrap this is reading order |
| Card blocks with `grid.columns` N                                         | row by row of the grid                                                             |
| `Form`, `FormControl`, `Accordion`, `Steps`, `OptionCards`, option groups | top to bottom                                                                      |
| `Buttons`                                                                 | row: left to right; column: top to bottom                                          |
| `Tabs`                                                                    | the strip, then the content of the active tab only                                 |
| `Carousel`                                                                | the current item only                                                              |
| `Modal`, `ModalDialog`                                                    | title and body first, the buttons, the close control last                          |
| `Table`, `EditableTable`                                                  | cell by cell, row by row; the pager after the cells                                |
| `Tooltip`                                                                 | the trigger only; the bubble never takes focus                                     |
| `CompositeCardBlock`                                                      | header, body, footer, per card                                                     |

Children that are not rendered (inactive tabs, non-current carousel items, closed accordion sections, a closed modal) are not in the order at all.

Groups that are one stop (`OptionCards`, `CheckBoxGroup`, `RadioGroup`, `SwitchGroup`, `Chips`) stay one stop; the arrows move inside them. `EditableTable` and `Table` with inputs are exceptions: each cell is a stop.

### Mechanism

- `renderNode` (which already builds the element path for CSS) assigns a sequence index to every child it renders during a component's render: the N-th `renderNode` call gets index N. A component that needs another order passes it explicitly (`renderNode(node, { order })`) or reorders its calls.
- A component with several internal stops gives each one a sub-index through `useFocusable({ order })`.
- The registry entry of a stop records its sequence path: the indexes from `root` to the stop, plus the sub-index. `focusOrder(registry)` sorts by that path lexicographically. The Ink DOM is no longer consulted for the order; it was an approximation of this rule and broke whenever a component reordered its boxes for visual reasons.
- Tab and Shift+Tab move along that order, wrapping at both ends. Ink's own Tab and Escape handling is switched off (`disableFocus()` keeps `focus(id)` working, see "Ink internals") so there is no frame where Ink has moved the focus somewhere else first.
- `autoFocus` becomes the registry's: the first stop that asks for it takes focus when it mounts, since Ink's own autoFocus is tied to its focus handling.

### Invariants

- The order depends only on the tree and on which children are rendered. It does not depend on mount timing, terminal width or scrolling.
- A resize never changes the order. It may change positions, which only matter for the arrows and the overlays.
- The arrows keep their current behaviour: a component keeps an arrow while it can still move in that direction; at its edge the arrow moves focus to the nearest stop in that direction.

## Part 2: Layers

### Rendering

`InkRenderer` mounts an `OverlayHost` as the last child of its root. Components register overlays through context (content, anchor, kind, placement or dragged offset). The host renders each overlay as an absolutely positioned box (`position="absolute"`, `top`, `left`), painted after the base, so it overwrites the cells beneath without changing the base layout. Positions are measured from the anchor's rectangle after layout, so an overlay appears one frame after its anchor moves; clamped to the screen.

A host application may provide the portal itself (through `FocusScope`), so an overlay inside a clipped panel is not cut at the panel's edge. Without it the library uses its own root.

The terminal has no transparency: a "transparent" backdrop paints nothing and only captures the mouse. A modal may dim what is behind it from below, through an output transform on the page box (`DimBehind`) that draws the page's text faint while a modal is open. That is a visual option, not part of the focus rules.

### Tab order with layers

- **Modal open**: only the stops of the modal's layer exist. A full-screen invisible backdrop sits just under the modal in the stack; a click on it, or Escape, is a `cancel`: `$open` becomes false and the optional `cancelAction` runs.
- **Non-modal dialog and tooltip**: their stops are spliced into the base order at the anchor's position, as a subsequence (the tooltip at its trigger, the dialog where it is declared). While the pointer is inside the overlay or one of its stops has focus, the overlay has priority: Tab and the arrows cycle inside it. Priority ends only when both are gone (pointer out and focus out), or on Escape, which also closes a tooltip.
- **A dialog that is shown** (modal or not) takes focus on its first stop, once streaming has finished.
- **Several overlays**: the top of the stack wins, for the keyboard and for the mouse hit-test. A tooltip inside a dialog, or a dialog opened from a dialog, nests the same way.
- **Arrows** respect the same layer rules as Tab: the candidates are the stops of the active layer only.

### Anchoring and drag

- Default anchor: the tree. An overlay's place in the order is its anchor's place.
- A dialog is draggable by its title bar when the mouse is on: mousedown captures, mousemove moves, mouseup drops; clamped to the screen. Ctrl+arrows move it one cell while one of its stops has focus, with the mouse on or off.
- On drop, the dialog re-anchors to the stop behind it: the base stop whose rectangle contains the dialog's top-left cell, else the last base stop before that cell in reading order (the row above, or to the left on the same row), else its tree anchor. The anchor is stored as a stop id, not as coordinates. Re-anchoring happens on drop only, never during the drag. The dialog does not move on drop: it is placed from its anchor stop's top-left plus its offset, never flipped, clamped to the screen, and its offset is rebased to keep it where it was dropped. Its stops sort right after the anchor stop, before anything that stop nests under it (an open accordion section under its header). It keeps the background of the cells its anchor stop sits on, never the stop's own fill.
- A dialog may anchor to a stop of another program in the same `FocusScope`; its stops then sit in that program's part of the cycle.
- A modal dialog never re-anchors (it is centred in its own layer), and neither does a Dialog declared inside a modal: its candidates are the modal's stops, which are not base stops.
- A drag passing over a stop with the button held moves no focus (hover focus needs no button held).
- If the anchor stop disappears (its tab closed, its list re-rendered), the dialog falls back to its tree anchor.
- A never-dragged dialog keeps its tree anchor across resizes.

### Resize

- The base order does not change.
- Overlays anchored to the tree are repositioned from the anchor's new rectangle.
- A dragged dialog keeps its anchor stop and its relative offset, clamped to the new screen.
- A modal is re-centred.
- Focus follows the stop id; the host's scroll-into-view brings it back into a scrolled panel, but ignores overlay stops, which are not in the panel's flow.

### Mouse

The dispatcher hit-tests from the top of the stack down: overlays first, then the backdrop (which captures everything that reaches it), then the base. Captured drags keep working across layers. `--no-mouse` disables drag and backdrop clicks; Escape and Ctrl+arrows cover those.

### Streaming

While `isStreaming` is true the stops of the program are inactive, overlays included. A dialog opened by state during the stream takes focus when streaming ends.

## Part 3: API

### OpenUI Lang components

- `ModalDialog(variant, title, body, cancelLabel?, confirmLabel?, open?, confirmAction?, cancelAction?, draggable?)`: react-ui's signature plus a last `draggable?` (step 4); gains the backdrop, `cancel` on backdrop click and Escape, drag and the layer rules.
- `Dialog(...)`: the same slots and props, non-modal: no backdrop, base stays interactive, priority by hover or focus-within.
- Step 3 ships `Dialog(variant, title, body, cancelLabel?, confirmLabel?, open?, confirmAction?, cancelAction?, placement?)` with `placement` `"bottom"` by default, against the line where it is declared; step 4 delivered `draggable` and the drag of either dialog.
- Both: `draggable` (default true; delivered in step 4, the last argument of each) and an optional initial placement relative to the anchor (`Dialog`'s `placement`). `Modal` keeps react-ui's schema and is always draggable.
- `Tooltip`: unchanged signature; rendered as an overlay instead of in the flow.
- `Modal` (the generic one): same layer rules as `ModalDialog`; the `[ x ]` control is last in its sequence.

### UI events

Added to the browser-like event stream: `cancel` (backdrop click or Escape on a modal), `open` and `close` of an overlay layer, `dragstart`, `drag`, `dragend` (the pointer's cell and the dialog box's drawn top-left, `left` and `top`). Existing `focus`, `blur`, `keydown`, mouse events are unchanged.

### Focus map

`focusOrder(registry)` returns the stops in Tab order, each with `id`, `component`, `name`, `path` (the sequence path), `rect`, `arrows` and now `layer` (`"base"` or the overlay id) and `anchor` (the anchor stop id for an overlay stop). Hosts and tests read it; the showcase can show it on a debug page.

### Host extension points on `FocusScope`

- `portal`: the host offers the box overlays are painted into (for apps that clip the renderer's panel). Superseded in step 2: the scope always hosts overlays (after its children, bounded by the ink root), and `OverlayHost` (with an optional `boundsRef`) plus `OverlayRegistryContext` are exported for a manual portal.
- `order`: a function that receives the program's ordered stops and the host's own stops and returns the full cycle. Default: the host's stops first, in their registration order, then the program's.

## Ink internals

Ink 8 `App`:

- `disableFocus()` sets a flag that stops Ink's Tab and Escape handling and clears the active id; `focus(id)` only checks that the id is registered and active, so programmatic focus keeps working with the flag off. The library calls it once and owns Tab, Shift+Tab and Escape.
- `addFocusable` honours `autoFocus` only while the flag is on; hence the registry's own autoFocus.
- `position="absolute"` with `top`/`left` is supported on `Box`; later nodes overwrite earlier cells in the output buffer.

## Testing

Every rule above gets an `ink-testing-library` test before its code: order of a nested program (row and column stacks, a grid block, tabs, a table with inputs), Tab with a modal open and after it closes, priority of a non-modal dialog by focus and by pointer, Escape in each layer, drag with mouse sequences and the order after the drop, resize in the middle of a Tab cycle, nested overlays, streaming. Real-terminal checks in tmux for painting (overlays over wide characters) and for the showcase.

## Delivery

Four steps, each with its tests, docs (README "Focus order", AGENTS module table) and its own commit:

1. Sequence paths in `renderNode` and the registry; `focusOrder` by sequence path; Tab, Shift+Tab, Escape and autoFocus owned by the library; audit of every container's sequence; `FocusScope.order` for the host; the showcase placing its sidebar and theme select through it. Done.
2. `OverlayHost` and the floating `Tooltip`; `FocusScope.portal`; tmux check of painting. (`portal` is superseded: the scope always hosts overlays, and `OverlayHost` plus `OverlayRegistryContext` are exported for a manual portal.) Done.
3. Backdrop and `cancel`, `Dialog`, auto focus, priority by hover or focus-within, layer-aware Tab, arrows and mouse hit-test, nested overlays, streaming rule, dim-behind context. Done.
4. Drag (mouse and Ctrl+arrows), re-anchoring on drop, resize behaviour, the focus map's `layer` and `anchor`, drag events. Done.

## Out of scope

- Right-to-left layouts.
- A `tabindex`-like prop in OpenUI Lang programs. The order is always the tree's.
- Changing how the arrows choose a neighbour inside a layer.
