import { action, defineAction, defineFunction } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { createLibrary, defineComponent, type Library } from "../../src/library";
import { reactive } from "../../src/reactive";

/** A renderer that draws nothing; the runtime tests never render. */
export function NullRenderer(): null {
  return null;
}

export const TitleSchema = z.object({ text: z.string() });

export const Title = defineComponent({
  name: "Title",
  description: "A title line",
  props: TitleSchema,
  component: NullRenderer,
});

export const Metric = defineComponent({
  name: "Metric",
  description: "A labelled number",
  props: z.object({ label: z.string(), value: z.number() }),
  component: NullRenderer,
});

export const TestButton = defineComponent({
  name: "Button",
  description: "A button",
  props: z.object({ label: z.string(), action: action().optional() }),
  component: NullRenderer,
});

export const TestInput = defineComponent({
  name: "Input",
  description: "A text field",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    value: reactive(z.string().optional()),
  }),
  component: NullRenderer,
});

export const TestStack = defineComponent({
  name: "Stack",
  description: "A container",
  props: z.object({ children: z.array(z.any()) }),
  component: NullRenderer,
});

export const Upper = defineFunction({
  name: "Upper",
  description: "Upper-cases text",
  params: z.object({ text: z.string() }),
  returns: z.string(),
  fn: function upper(args: { text: string }): string {
    return args.text.toUpperCase();
  },
});

export const Boom = defineFunction({
  name: "Boom",
  description: "Always throws",
  params: z.object({ text: z.string() }),
  returns: z.string(),
  fn: function boom(): string {
    throw new Error("boom");
  },
});

export const CopyToClipboard = defineAction({
  name: "CopyToClipboard",
  description: "Copies text",
  params: z.object({ text: z.string() }),
});

/** The library every runtime test parses against. */
export function makeTestLibrary(): Library {
  return createLibrary({
    root: "Stack",
    components: [TestStack, Title, Metric, TestButton, TestInput],
    functions: [Upper, Boom],
    actions: [CopyToClipboard],
  });
}
