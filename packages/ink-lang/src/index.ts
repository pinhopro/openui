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
export { renderValue } from "./render-value";
export { useStateField } from "./use-state-field";

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
