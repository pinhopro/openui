import type {
  DefinedComponent as CoreDefinedComponent,
  Library as CoreLibrary,
  LibraryDefinition as CoreLibraryDefinition,
  ComponentRenderProps as CoreRenderProps,
  DefinedAction,
} from "@openuidev/lang-core";
import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
} from "@openuidev/lang-core";
import type { FC, ReactNode } from "react";
import type { z } from "zod/v4";
import type { $ZodObject } from "zod/v4/core";

export type {
  ComponentGroup,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
} from "@openuidev/lang-core";

/**
 * The props every Ink component renderer receives: the evaluated props of the
 * element, `renderNode` to draw nested values, and the statement id.
 */
export interface ComponentRenderProps<P = Record<string, unknown>> extends CoreRenderProps<
  P,
  ReactNode
> {}

/** An Ink component renderer is a React function component over ComponentRenderProps. */
export type ComponentRenderer<P = Record<string, unknown>> = FC<ComponentRenderProps<P>>;

/** A component definition whose renderer draws with Ink. */
export type DefinedComponent<T extends $ZodObject = $ZodObject> = CoreDefinedComponent<
  T,
  ComponentRenderer<z.infer<T>>
>;

/** Any custom action a library may declare with `defineAction`. */
type AnyAction = DefinedAction<any, string>;

/** A lang-core library whose renderers are Ink components. */
export type Library = CoreLibrary<ComponentRenderer<any>, AnyAction>;

export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer<any>, AnyAction>;

export interface DefineComponentConfig<T extends $ZodObject> {
  /** The name the model uses, e.g. "Stack". */
  name: string;
  /** Zod v4 object schema; key order is the positional argument order. */
  props: T;
  /** One line shown in the system prompt. */
  description: string;
  /** The Ink renderer for this component. */
  component: ComponentRenderer<z.infer<T>>;
}

/** Defines a component with an Ink renderer. Same shape as react-lang's defineComponent. */
export function defineComponent<T extends $ZodObject>(
  config: DefineComponentConfig<T>,
): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>(config);
}

/** Creates a library from Ink component definitions. Same shape as react-lang's createLibrary. */
export function createLibrary(input: LibraryDefinition): Library {
  const library = coreCreateLibrary<ComponentRenderer<any>, AnyAction>(input);
  return library;
}
