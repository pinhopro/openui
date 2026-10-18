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
export { useFieldRules } from "./use-field-rules";
export type { FieldRules } from "./use-field-rules";
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
export { Button } from "./components/button";
export { Buttons } from "./components/buttons";
export { Card } from "./components/card";
export { CardHeader } from "./components/card-header";
export { Col } from "./components/col";
export { Combobox } from "./components/combobox";
export { Form } from "./components/form";
export { FormControl } from "./components/form-control";
export { Label } from "./components/label";
export { Select } from "./components/select";
export { SelectItem } from "./components/select-item";
export { Stack } from "./components/stack";
export { TabItem } from "./components/tab-item";
export { Table } from "./components/table";
export { Tabs } from "./components/tabs";
export { TextContent } from "./components/text-content";
export { Input } from "./components/text-input";
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
export { actionPropSchema } from "./schemas/action-schema";
export { AreaChartSchema } from "./schemas/area-chart-schema";
export { BarChartSchema } from "./schemas/bar-chart-schema";
export { ButtonSchema } from "./schemas/button-schema";
export { ButtonsSchema } from "./schemas/buttons-schema";
export { CardHeaderSchema } from "./schemas/card-header-schema";
export { CardChildUnion, CardSchema } from "./schemas/card-schema";
export { ColSchema } from "./schemas/col-schema";
export { ComboboxSchema } from "./schemas/combobox-schema";
export { FlexPropsSchema } from "./schemas/flex-props-schema";
export { FormControlSchema } from "./schemas/form-control-schema";
export { FormSchema } from "./schemas/form-schema";
export { HorizontalBarChartSchema } from "./schemas/horizontal-bar-chart-schema";
export { InputSchema } from "./schemas/input-schema";
export { LabelSchema } from "./schemas/label-schema";
export { LineChartSchema } from "./schemas/line-chart-schema";
export { PieChartSchema } from "./schemas/pie-chart-schema";
export { PointSchema } from "./schemas/point-schema";
export { RadarChartSchema } from "./schemas/radar-chart-schema";
export { RadialChartSchema } from "./schemas/radial-chart-schema";
export { rulesSchema } from "./schemas/rules-schema";
export { ScatterChartSchema } from "./schemas/scatter-chart-schema";
export { ScatterSeriesSchema } from "./schemas/scatter-series-schema";
export { SelectItemSchema } from "./schemas/select-item-schema";
export { SelectSchema, createSelectSchema } from "./schemas/select-schema";
export { SeriesSchema } from "./schemas/series-schema";
export { SingleStackedBarChartSchema } from "./schemas/single-stacked-bar-chart-schema";
export { SliceSchema } from "./schemas/slice-schema";
export { StackSchema } from "./schemas/stack-schema";
export { TabContentChildUnion, TabItemSchema } from "./schemas/tab-item-schema";
export { TableSchema } from "./schemas/table-schema";
export { TabsSchema } from "./schemas/tabs-schema";
export { TextContentSchema } from "./schemas/text-content-schema";

// Building blocks for custom terminal components
export { horizontalStep, verticalStep } from "./components/arrow-keys";
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
export { flexBoxProps } from "./components/flex-box-props";
export type { FlexBoxProps, FlexProps } from "./components/flex-box-props";
export { hasMarkdown, parseInline, parseMarkdown } from "./components/markdown";
export type { MarkdownLine, MarkdownLineKind, MarkdownSegment } from "./components/markdown";
export { indexOfOption, selectOptions } from "./components/select-options";
export type { SelectOption } from "./components/select-options";
export { clampIndex, stepIndex } from "./components/step-index";
export { cellText, tableLayout } from "./components/table-layout";
export type { TableAlign, TableColumn, TableLayout } from "./components/table-layout";
export { textContentStyle } from "./components/text-content-style";
export type { TextContentStyle } from "./components/text-content-style";
export { applyKeyToEditor, maskValue, splitForCursor } from "./components/text-editing";
export type { CursorSplit, EditorState } from "./components/text-editing";
export { buttonTextStyle } from "./focus/focus-style";
export type { ButtonTextStyle } from "./focus/focus-style";
export { useFocusable } from "./focus/use-focusable";
export type { Focusable, FocusableOptions } from "./focus/use-focusable";
