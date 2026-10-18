// Renderer
export { InkRenderer } from "./ink-renderer";
export type { InkRendererProps } from "./ink-renderer";

// Library definition
export { action, defineAction, defineFunction, steps, tagSchemaId } from "@openuidev/lang-core";
export type { ActionRef, DefinedAction, DefinedFunction } from "@openuidev/lang-core";
export { createLibrary, defineComponent } from "./library";
export type {
  ComponentGroup,
  ComponentRenderProps,
  ComponentRenderer,
  DefineComponentConfig,
  DefinedComponent,
  Library,
  LibraryDefinition,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
} from "./library";
export { reactive } from "./reactive";

// Context hooks for component authors
export { buttonNeedsValidation } from "./components/button-validation";
export {
  OpenUIContext,
  useGetFieldValue,
  useIsQueryLoading,
  useIsStreaming,
  useOpenUI,
  useRenderNode,
  useSetFieldValue,
  useTriggerAction,
} from "./context";
export type { GetFieldValue, OpenUIContextValue, SetFieldValue, TriggerAction } from "./context";
export { isElementValue } from "./element-node";
export { FormNameContext, useFormName } from "./form-name-context";
export {
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
} from "./form-validation-context";
export type { FormValidationContextValue } from "./form-validation-context";
export { renderValue } from "./render-value";
export { useFieldValidation } from "./use-field-validation";
export type { FieldValidation, FieldValidationOptions } from "./use-field-validation";
export { useStateField } from "./use-state-field";

// Theme
export { ThemeContext, defaultTheme, resolveTheme, useTheme } from "./theme";
export type { InkTheme } from "./theme";

// Tool providers
export type { ToolFunction, ToolFunctionMap, ToolProviderInput } from "./runtime/tool-provider";
export type { LegacyAction } from "./runtime/trigger-action";

// Re-exported from lang-core for hosts
export {
  ACTION_STEPS,
  BuiltinActionType,
  ToolNotFoundError,
  buildMessage,
  createParser,
  createStreamingParser,
  extractToolResult,
  generatePrompt,
  generateSystemPrompt,
  mergeStatements,
  parseMessage,
} from "@openuidev/lang-core";
export type {
  ActionEvent,
  ActionPlan,
  ActionStep,
  BuildMessageInput,
  ElementNode,
  EvaluationContext,
  McpClientLike,
  OpenUIError,
  ParseMessageOptions,
  ParseResult,
  ParsedMessage,
  StateField,
  ToolProvider,
} from "@openuidev/lang-core";

// Default terminal library and its components
export { Accordion } from "./components/accordion";
export { AccordionItem } from "./components/accordion-item";
export { BoldText } from "./components/bold-text";
export { Button } from "./components/button";
export { Buttons } from "./components/buttons";
export { Callout } from "./components/callout";
export { Card } from "./components/card";
export { CardHeader } from "./components/card-header";
export { Carousel } from "./components/carousel";
export { CheckBoxGroup } from "./components/check-box-group";
export { CheckBoxItem } from "./components/check-box-item";
export { ChipItem } from "./components/chip-item";
export { Chips } from "./components/chips";
export { CodeBlock } from "./components/code-block";
export { Col } from "./components/col";
export { Combobox } from "./components/combobox";
export { CompositeCardBlock } from "./components/composite-card-block";
export { CompositeCardItem } from "./components/composite-card-item";
export { ContextCardBlock } from "./components/context-card-block";
export { ContextCardItem } from "./components/context-card-item";
export { DatePicker } from "./components/date-picker";
export { EditableTable } from "./components/editable-table";
export { EntityList } from "./components/entity-list";
export { Form } from "./components/form";
export { FormControl } from "./components/form-control";
export { Icon } from "./components/icon";
export { IconButton } from "./components/icon-button";
export { IconText } from "./components/icon-text";
export { Image } from "./components/image";
export { ImageBlock } from "./components/image-block";
export { ImageGallery } from "./components/image-gallery";
export { ImageText } from "./components/image-text";
export { ImageTextLarge } from "./components/image-text-large";
export { InlineHeader } from "./components/inline-header";
export { Label } from "./components/label";
export { ListBlock } from "./components/list-block";
export { ListItem } from "./components/list-item";
export { MarkDownRenderer } from "./components/mark-down-renderer";
export { MetricIndicatorInline } from "./components/metric-indicator-inline";
export { MetricIndicatorWithStrikethrough } from "./components/metric-indicator-with-strikethrough";
export { Modal } from "./components/modal";
export { OptionCard } from "./components/option-card";
export { OptionCards } from "./components/option-cards";
export { OverviewCardBlock } from "./components/overview-card-block";
export { OverviewCardItem } from "./components/overview-card-item";
export { RadioGroup } from "./components/radio-group";
export { RadioItem } from "./components/radio-item";
export { Select } from "./components/select";
export { SelectItem } from "./components/select-item";
export { Separator } from "./components/separator";
export { Slider } from "./components/slider";
export { SnippetCardBlock } from "./components/snippet-card-block";
export { SnippetCardItem } from "./components/snippet-card-item";
export { Stack } from "./components/stack";
export { Steps } from "./components/steps";
export { StepsItem } from "./components/steps-item";
export { SwitchGroup } from "./components/switch-group";
export { SwitchItem } from "./components/switch-item";
export { TabItem } from "./components/tab-item";
export { Table } from "./components/table";
export { Tabs } from "./components/tabs";
export { Tag } from "./components/tag";
export { TagBlock } from "./components/tag-block";
export { Text } from "./components/text";
export { TextArea } from "./components/text-area";
export { TextCallout } from "./components/text-callout";
export { TextContent } from "./components/text-content";
export { Input } from "./components/text-input";
export { VisualCardBlock } from "./components/visual-card-block";
export { VisualCardItem } from "./components/visual-card-item";
export { inkComponentGroups, inkLibrary } from "./default-library";

export { AreaChart } from "./components/area-chart";
export { BarChart } from "./components/bar-chart";
export { HorizontalBarChart } from "./components/horizontal-bar-chart";
export { LineChart } from "./components/line-chart";
export { PieChart } from "./components/pie-chart";
export { Point } from "./components/point";
export { RadarChart } from "./components/radar-chart";
export { RadialChart } from "./components/radial-chart";
export { ScatterChart } from "./components/scatter-chart";
export { ScatterSeries } from "./components/scatter-series";
export { Series } from "./components/series";
export { SingleStackedBarChart } from "./components/single-stacked-bar-chart";
export { Slice } from "./components/slice";

// Schemas (verbatim copies of the React default library's)
export { AccordionItemSchema } from "./schemas/accordion-item-schema";
export { AccordionSchema } from "./schemas/accordion-schema";
export { actionPropSchema } from "./schemas/action-schema";
export { AreaChartSchema } from "./schemas/area-chart-schema";
export { BarChartSchema } from "./schemas/bar-chart-schema";
export { BoldTextSchema } from "./schemas/bold-text-schema";
export { ButtonSchema } from "./schemas/button-schema";
export { ButtonsSchema } from "./schemas/buttons-schema";
export { CalloutSchema } from "./schemas/callout-schema";
export { CardHeaderSchema } from "./schemas/card-header-schema";
export { CardChildUnion, CardSchema } from "./schemas/card-schema";
export { CarouselSchema } from "./schemas/carousel-schema";
export { CheckBoxGroupSchema, createCheckBoxGroupSchema } from "./schemas/check-box-group-schema";
export { CheckBoxItemSchema } from "./schemas/check-box-item-schema";
export { ChipItemSchema } from "./schemas/chip-item-schema";
export { ChipsSchema } from "./schemas/chips-schema";
export { CodeBlockSchema } from "./schemas/code-block-schema";
export { ColSchema } from "./schemas/col-schema";
export { ComboboxSchema } from "./schemas/combobox-schema";
export { CompositeCardBlockSchema } from "./schemas/composite-card-block-schema";
export {
  CompositeCardBodyItemSchema,
  CompositeCardFooterSchema,
  CompositeCardItemSchema,
} from "./schemas/composite-card-item-schema";
export { ContentChildUnion } from "./schemas/content-child-union";
export { ContextCardBlockSchema } from "./schemas/context-card-block-schema";
export { ContextCardItemSchema } from "./schemas/context-card-item-schema";
export { DatePickerSchema } from "./schemas/date-picker-schema";
export { EditableTableSchema } from "./schemas/editable-table-schema";
export { EntityListRowSchema, EntityListSchema } from "./schemas/entity-list-schema";
export { FlexPropsSchema } from "./schemas/flex-props-schema";
export { FormControlSchema } from "./schemas/form-control-schema";
export { FormSchema } from "./schemas/form-schema";
export { HorizontalBarChartSchema } from "./schemas/horizontal-bar-chart-schema";
export { IconButtonSchema } from "./schemas/icon-button-schema";
export { IconSchema } from "./schemas/icon-schema";
export { IconTextSchema } from "./schemas/icon-text-schema";
export { ImageBlockSchema } from "./schemas/image-block-schema";
export { ImageGallerySchema } from "./schemas/image-gallery-schema";
export { ImageSchema } from "./schemas/image-schema";
export { ImageTextLargeSchema } from "./schemas/image-text-large-schema";
export { ImageTextSchema } from "./schemas/image-text-schema";
export { InlineHeaderSchema } from "./schemas/inline-header-schema";
export { InputSchema } from "./schemas/input-schema";
export { LabelSchema } from "./schemas/label-schema";
export { LineChartSchema } from "./schemas/line-chart-schema";
export { ListBlockSchema } from "./schemas/list-block-schema";
export { ListItemSchema } from "./schemas/list-item-schema";
export { MarkDownRendererSchema } from "./schemas/mark-down-renderer-schema";
export {
  MetricIndicatorInlineSchema,
  MetricIndicatorTrendSchema,
  MetricIndicatorWithStrikethroughSchema,
} from "./schemas/metric-indicator-schema";
export { ModalSchema } from "./schemas/modal-schema";
export { OptionCardSchema } from "./schemas/option-card-schema";
export { OptionCardsSchema } from "./schemas/option-cards-schema";
export { OverviewCardBlockSchema } from "./schemas/overview-card-block-schema";
export { OverviewCardItemSchema } from "./schemas/overview-card-item-schema";
export { PieChartSchema } from "./schemas/pie-chart-schema";
export { PointSchema } from "./schemas/point-schema";
export { RadarChartSchema } from "./schemas/radar-chart-schema";
export { RadialChartSchema } from "./schemas/radial-chart-schema";
export { RadioGroupSchema } from "./schemas/radio-group-schema";
export { RadioItemSchema } from "./schemas/radio-item-schema";
export { rulesSchema } from "./schemas/rules-schema";
export { ScatterChartSchema } from "./schemas/scatter-chart-schema";
export { ScatterSeriesSchema } from "./schemas/scatter-series-schema";
export { SelectItemSchema } from "./schemas/select-item-schema";
export { SelectSchema, createSelectSchema } from "./schemas/select-schema";
export { SeparatorSchema } from "./schemas/separator-schema";
export { SeriesSchema } from "./schemas/series-schema";
export { SingleStackedBarChartSchema } from "./schemas/single-stacked-bar-chart-schema";
export { SliceSchema } from "./schemas/slice-schema";
export { SliderSchema } from "./schemas/slider-schema";
export { SnippetCardBlockSchema } from "./schemas/snippet-card-block-schema";
export { SnippetCardItemSchema } from "./schemas/snippet-card-item-schema";
export { StackSchema } from "./schemas/stack-schema";
export { StepsItemSchema } from "./schemas/steps-item-schema";
export { StepsSchema } from "./schemas/steps-schema";
export { SwitchGroupSchema, createSwitchGroupSchema } from "./schemas/switch-group-schema";
export { SwitchItemSchema } from "./schemas/switch-item-schema";
export { TabItemSchema } from "./schemas/tab-item-schema";
export { TableSchema } from "./schemas/table-schema";
export { TabsSchema } from "./schemas/tabs-schema";
export { TagBlockSchema } from "./schemas/tag-block-schema";
export { TagSchema } from "./schemas/tag-schema";
export { TextAreaSchema } from "./schemas/text-area-schema";
export { TextCalloutSchema } from "./schemas/text-callout-schema";
export { TextContentSchema } from "./schemas/text-content-schema";
export { TextSchema } from "./schemas/text-schema";
export { VisualCardBlockSchema } from "./schemas/visual-card-block-schema";
export { VisualCardItemSchema } from "./schemas/visual-card-item-schema";

// Building blocks for custom terminal components
export { horizontalStep, verticalStep } from "./components/arrow-keys";
export {
  createBrailleCanvas,
  dotColumns,
  dotRows,
  fillBelow,
  plot,
  plotArea,
  plotLine,
  projectValue,
  toLines,
} from "./components/braille-canvas";
export type { BrailleCanvas } from "./components/braille-canvas";
export { buildSeriesRows, buildSlices, seriesNames } from "./components/chart-data";
export type { ChartSlice, SeriesRow } from "./components/chart-data";
export {
  barCells,
  formatNumber,
  percentages,
  proportionSegments,
  sparkline,
} from "./components/chart-text";
export { filterOptions, listWindow } from "./components/combobox-options";
export type { ListWindow } from "./components/combobox-options";
export {
  cellLabel,
  editableColumnWidths,
  editableColumns,
  editableRows,
  nextOptionValue,
  parseCellInput,
  withCellValue,
} from "./components/editable-table-layout";
export type {
  EditableColumn,
  EditableColumnType,
  EditableRow,
} from "./components/editable-table-layout";
export { entityListLayout } from "./components/entity-list-rows";
export type { EntityListLayout, EntityRow } from "./components/entity-list-rows";
export { flexBoxProps } from "./components/flex-box-props";
export type { FlexBoxProps, FlexProps } from "./components/flex-box-props";
export { iconText } from "./components/icon";
export { imageLabel } from "./components/image-placeholder";
export { hasMarkdown, parseInline, parseMarkdown } from "./components/markdown";
export type { MarkdownLine, MarkdownLineKind, MarkdownSegment } from "./components/markdown";
export { applyKeyToMultilineEditor, cursorAt, linePosition } from "./components/multiline-editing";
export type { LinePosition } from "./components/multiline-editing";
export { displayText, padEnd, padStart, widestText } from "./components/pad";
export { readScatterDatasets } from "./components/scatter-data";
export type { ScatterDataset, ScatterPoint } from "./components/scatter-data";
export { indexOfOption, selectOptions } from "./components/select-options";
export type { SelectOption } from "./components/select-options";
export {
  normalizeSelection,
  selectionForValidation,
  selectionItems,
  storedSelection,
  toggleSelection,
} from "./components/selection-field";
export type { SelectionItem, SelectionType } from "./components/selection-field";
export { sliderTrack, sliderValue, stepSliderValue } from "./components/slider-track";
export { clampIndex, stepIndex } from "./components/step-index";
export { cellText, tableLayout } from "./components/table-layout";
export type { TableAlign, TableColumn, TableLayout } from "./components/table-layout";
export { pageBounds, pageSummary } from "./components/table-paging";
export type { PageBounds } from "./components/table-paging";
export { textContentStyle } from "./components/text-content-style";
export type { TextContentStyle } from "./components/text-content-style";
export { applyKeyToEditor, maskValue, splitForCursor } from "./components/text-editing";
export type { CursorSplit, EditorState } from "./components/text-editing";
export { useOptionGroup } from "./components/use-option-group";
export type { OptionGroup, OptionGroupOptions } from "./components/use-option-group";
export { variantColor } from "./components/variant-color";
export { buttonTextStyle, pagerTextStyle } from "./focus/focus-style";
export type { ButtonTextStyle } from "./focus/focus-style";
export { useFocusable } from "./focus/use-focusable";
export type { Focusable, FocusableOptions } from "./focus/use-focusable";

// Mouse support
export { measureTargets, targetsUnderCell } from "./mouse/hit-test";
export type { CellRect, MeasuredTarget } from "./mouse/hit-test";
export { createMouseDispatcher } from "./mouse/mouse-dispatcher";
export type { MouseDispatcher } from "./mouse/mouse-dispatcher";
export { mouseDisableSequence, mouseEnableSequence } from "./mouse/mouse-mode";
export { resolveMouseOptions } from "./mouse/mouse-options";
export type { MouseOptions } from "./mouse/mouse-options";
export { MouseContext, MouseProvider } from "./mouse/mouse-provider";
export type { MouseProviderProps, MouseRegistry } from "./mouse/mouse-provider";
export { parseMouseSequence, splitMouseSequences } from "./mouse/mouse-sequence";
export type {
  MouseButton,
  MouseChunk,
  MouseEvent,
  MouseEventKind,
  WheelDirection,
} from "./mouse/mouse-sequence";
export type {
  MouseEventHandler,
  MouseHandlers,
  MouseTarget,
  MouseWheelEvent,
  MouseWheelHandler,
} from "./mouse/mouse-target";
export { useMouse } from "./mouse/use-mouse";
