import {
  createQueryManager,
  createStore,
  createStreamingParser,
  type ActionEvent,
  type ActionPlan,
  type ElementNode,
  type OpenUIError,
  type ParseResult,
  type Store,
} from "@openuidev/lang-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OpenUIContextValue } from "./context";
import type { Library } from "./library";
import { collectErrors, errorsKey } from "./runtime/collect-errors";
import { evaluateResult } from "./runtime/evaluate-result";
import { buildRuntimeFunctions, createEvaluationContext } from "./runtime/evaluation-context";
import { getFieldValue, getFormPayload, setFieldValue } from "./runtime/field-state";
import { parseResponse } from "./runtime/parse-response";
import { buildMutationNodes, buildQueryNodes } from "./runtime/query-nodes";
import type { ActionRuntime } from "./runtime/run-action-plan";
import { createStableToolProvider, type ToolProviderInput } from "./runtime/tool-provider";
import { triggerAction as runTriggerAction, type LegacyAction } from "./runtime/trigger-action";
import { useQuerySnapshot, useStoreSnapshot } from "./use-openui-store";

export interface OpenUIRuntimeOptions {
  response: string | null;
  library: Library;
  isStreaming: boolean;
  onAction: ((event: ActionEvent) => void) | undefined;
  onStateUpdate: ((state: Record<string, unknown>) => void) | undefined;
  /** `$`-prefixed keys are bindings, everything else is form state. */
  initialState: Record<string, unknown> | undefined;
  toolProvider: ToolProviderInput;
  onError: ((errors: OpenUIError[]) => void) | undefined;
}

export interface OpenUIRuntime {
  /** The evaluated root, or null before the program has one. */
  root: ElementNode | null;
  /** The raw parse result, with AST values still in props. */
  parseResult: ParseResult | null;
  contextValue: OpenUIContextValue;
  isQueryLoading: boolean;
  /** Failed queries whose defaults are showing instead of fresh data. */
  queryErrors: OpenUIError[];
  /** Re-runs every failed query. */
  retryQueries: () => void;
  /** The current error list; also delivered through onError when it changes. */
  errors: OpenUIError[];
}

interface HostCallbacks {
  onAction: ((event: ActionEvent) => void) | undefined;
  onStateUpdate: ((state: Record<string, unknown>) => void) | undefined;
  onError: ((errors: OpenUIError[]) => void) | undefined;
}

/**
 * Seeds the store: declared defaults through `initialize` (which keeps user
 * changes), and the host's initialState only when it is new, so a later parse
 * never puts stale restored values back over what the user typed.
 */
function seedStore(
  store: Store,
  declarations: Record<string, unknown>,
  initialState: Record<string, unknown> | undefined,
): void {
  const bindingDefaults: Record<string, unknown> = {};
  if (initialState !== undefined) {
    for (const [key, value] of Object.entries(initialState)) {
      if (key.startsWith("$")) {
        bindingDefaults[key] = value;
      } else {
        store.set(key, value);
      }
    }
  }
  store.initialize(declarations, bindingDefaults);
}

/**
 * The whole OpenUI runtime for one rendered program: parser, store, query
 * manager, evaluation, actions and error collection. Pure logic lives in
 * `runtime/`; this hook only ties it to React state.
 */
export function useOpenUIRuntime(options: OpenUIRuntimeOptions): OpenUIRuntime {
  const { response, library, isStreaming, initialState, toolProvider } = options;

  const callbacksRef = useRef<HostCallbacks>({
    onAction: options.onAction,
    onStateUpdate: options.onStateUpdate,
    onError: options.onError,
  });
  callbacksRef.current = {
    onAction: options.onAction,
    onStateUpdate: options.onStateUpdate,
    onError: options.onError,
  };

  // Parser and library-derived data, rebuilt only when the library changes.
  const schema = useMemo(
    function buildSchema() {
      return library.toJSONSchema();
    },
    [library],
  );
  const parser = useMemo(
    function buildParser() {
      return createStreamingParser(schema, library.root);
    },
    [schema, library.root],
  );
  const functions = useMemo(
    function buildFunctions() {
      return buildRuntimeFunctions(schema, library);
    },
    [schema, library],
  );
  const customActionNames = useMemo(
    function listCustomActions() {
      return Object.keys(schema.actions ?? {});
    },
    [schema],
  );

  const parseOutcome = useMemo(
    function parse() {
      return parseResponse(parser, response, isStreaming);
    },
    [parser, response, isStreaming],
  );
  const parseResult = parseOutcome.result;
  const parseResultRef = useRef(parseResult);
  parseResultRef.current = parseResult;

  // Store: one per renderer, disposed on unmount.
  const store = useMemo(function buildStore() {
    return createStore();
  }, []);
  useEffect(
    function manageStore() {
      return function disposeStore() {
        store.dispose();
      };
    },
    [store],
  );

  // Query manager: created once per "has a provider" state; the provider wrapper
  // reads the host's latest input on every call.
  const toolProviderRef = useRef(toolProvider);
  toolProviderRef.current = toolProvider;
  const stableToolProvider = useMemo(function buildToolProvider() {
    return createStableToolProvider(function readToolProvider() {
      return toolProviderRef.current;
    });
  }, []);
  const hasToolProvider = toolProvider !== null && toolProvider !== undefined;
  const queryManager = useMemo(
    function buildQueryManager() {
      return createQueryManager(hasToolProvider ? stableToolProvider : null);
    },
    [hasToolProvider, stableToolProvider],
  );
  useEffect(
    function manageQueryManager() {
      queryManager.activate();
      return function disposeQueryManager() {
        queryManager.dispose();
      };
    },
    [queryManager],
  );

  // Declared defaults and initial state seed the store; declared defaults never
  // count as a user change, and initialState is applied once per distinct value.
  const initializingRef = useRef(false);
  const declarationsKeyRef = useRef("");
  const initialStateKeyRef = useRef("");
  const declarations = parseResult?.stateDeclarations;
  useEffect(
    function seedStoreOnChange() {
      const declarationsKey = JSON.stringify(declarations ?? null);
      const initialStateKey = JSON.stringify(initialState ?? null);
      const declarationsChanged = declarationsKey !== declarationsKeyRef.current;
      const initialStateChanged = initialStateKey !== initialStateKeyRef.current;
      if (!declarationsChanged && !initialStateChanged) return;
      declarationsKeyRef.current = declarationsKey;
      initialStateKeyRef.current = initialStateKey;
      initializingRef.current = true;
      seedStore(store, declarations ?? {}, initialStateChanged ? initialState : undefined);
      initializingRef.current = false;
    },
    [declarations, initialState, store],
  );

  const storeSnapshot = useStoreSnapshot(store);
  const querySnapshot = useQuerySnapshot(queryManager);

  const evaluationContext = useMemo(
    function buildEvaluationContext() {
      return createEvaluationContext(store, queryManager, functions, schema.actions);
    },
    [store, queryManager, functions, schema.actions],
  );

  // Queries and mutations wait for the stream to end.
  useEffect(
    function submitQueries() {
      if (isStreaming) return;
      const nodes = buildQueryNodes(parseResult, evaluationContext, storeSnapshot);
      queryManager.evaluateQueries(nodes);
    },
    [isStreaming, parseResult, evaluationContext, queryManager, storeSnapshot],
  );
  useEffect(
    function submitMutations() {
      if (isStreaming) return;
      const nodes = buildMutationNodes(parseResult, evaluationContext);
      queryManager.registerMutations(nodes);
    },
    [isStreaming, parseResult, evaluationContext, queryManager],
  );

  // One onStateUpdate per user-driven store change.
  useEffect(
    function watchStore() {
      let lastSnapshot = store.getSnapshot();
      return store.subscribe(function notifyStateUpdate() {
        const snapshot = store.getSnapshot();
        if (initializingRef.current) {
          lastSnapshot = snapshot;
          return;
        }
        if (snapshot === lastSnapshot) return;
        lastSnapshot = snapshot;
        callbacksRef.current.onStateUpdate?.(snapshot);
      });
    },
    [store],
  );

  // Render errors reported by the error boundary, collected after the stream ends.
  const renderErrorsRef = useRef<OpenUIError[]>([]);
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;
  const reportError = useCallback(function reportError(error: OpenUIError) {
    if (isStreamingRef.current) return;
    renderErrorsRef.current.push(error);
  }, []);

  const readFormPayload = useCallback(
    function readFormPayload(formName: string | undefined) {
      return getFormPayload(store, formName);
    },
    [store],
  );

  const triggerAction = useCallback(
    async function triggerActionFromComponent(
      userMessage: string,
      formName?: string,
      action?: ActionPlan | LegacyAction | null,
    ): Promise<void> {
      const runtime: ActionRuntime = {
        store,
        queryManager,
        evaluationContext,
        customActionNames,
        getMutationStatements: function getMutationStatements() {
          return parseResultRef.current?.mutationStatements ?? [];
        },
        getStateDeclarations: function getStateDeclarations() {
          return parseResultRef.current?.stateDeclarations ?? {};
        },
        getFormPayload: readFormPayload,
        emit: function emit(event: ActionEvent) {
          callbacksRef.current.onAction?.(event);
        },
      };
      await runTriggerAction(userMessage, formName, action, runtime);
    },
    [store, queryManager, evaluationContext, customActionNames, readFormPayload],
  );

  // Re-evaluate whenever the program, the store or the query results change.
  const evaluated = useMemo(
    function evaluate() {
      return evaluateResult(parseResult, evaluationContext, library, store);
    },
    // storeSnapshot and querySnapshot are the change signals the evaluator reads through the context.
    [parseResult, evaluationContext, library, store, storeSnapshot, querySnapshot],
  );

  const isQueryLoading = querySnapshot.__openui_loading.length > 0;
  const queryErrors = useMemo(
    function listQueryErrors() {
      const failed: OpenUIError[] = [];
      for (const error of querySnapshot.__openui_errors) {
        if (error.source === "query") failed.push(error);
      }
      return failed;
    },
    [querySnapshot],
  );
  const retryQueries = useCallback(
    function retryQueries() {
      const statementIds: string[] = [];
      for (const error of queryErrors) {
        if (error.statementId !== undefined) statementIds.push(error.statementId);
      }
      if (statementIds.length > 0) queryManager.invalidate(statementIds);
    },
    [queryErrors, queryManager],
  );

  const readField = useCallback(
    function readField(formName: string | undefined, name: string) {
      return getFieldValue(store, formName, name);
    },
    [store],
  );
  const writeField = useCallback(
    function writeField(
      formName: string | undefined,
      componentType: string | undefined,
      name: string,
      value: unknown,
    ) {
      setFieldValue(store, formName, componentType, name, value);
    },
    [store],
  );

  const contextValue = useMemo<OpenUIContextValue>(
    function buildContextValue() {
      return {
        library,
        triggerAction,
        isStreaming,
        isQueryLoading,
        getFieldValue: readField,
        setFieldValue: writeField,
        store,
        evaluationContext,
        reportError,
      };
    },
    [
      library,
      triggerAction,
      isStreaming,
      isQueryLoading,
      readField,
      writeField,
      store,
      evaluationContext,
      reportError,
    ],
  );

  // Errors: cleared while streaming, collected and delivered once it ends.
  const [errors, setErrors] = useState<OpenUIError[]>([]);
  const lastErrorKeyRef = useRef("");
  useEffect(
    function deliverErrors() {
      if (isStreaming) {
        renderErrorsRef.current = [];
        if (lastErrorKeyRef.current !== "") {
          lastErrorKeyRef.current = "";
          setErrors([]);
          callbacksRef.current.onError?.([]);
        }
        return;
      }
      const collected = collectErrors({
        program: parseOutcome.program,
        result: parseResult,
        parseError: parseOutcome.error,
        runtimeErrors: evaluated.errors,
        renderErrors: renderErrorsRef.current,
        queryErrors: querySnapshot.__openui_errors,
        library,
      });
      renderErrorsRef.current = [];
      const key = errorsKey(collected);
      if (key === lastErrorKeyRef.current) return;
      lastErrorKeyRef.current = key;
      setErrors(collected);
      callbacksRef.current.onError?.(collected);
    },
    [isStreaming, parseOutcome, parseResult, evaluated, querySnapshot, library],
  );

  return {
    root: evaluated.root,
    parseResult,
    contextValue,
    isQueryLoading,
    queryErrors,
    retryQueries,
    errors,
  };
}
