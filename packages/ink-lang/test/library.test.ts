import { isReactiveSchema } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { isElementValue } from "../src/element-node";
import { createLibrary, defineComponent } from "../src/library";
import { reactive } from "../src/reactive";
import { makeTestLibrary, NullRenderer, Title } from "./helpers/test-library";

describe("defineComponent", () => {
  it("keeps the name, schema, description and renderer and adds a ref", () => {
    expect(Title.name).toBe("Title");
    expect(Title.description).toBe("A title line");
    expect(Title.component).toBe(NullRenderer);
    expect(Title.ref).toBeDefined();
  });
});

describe("createLibrary", () => {
  it("exposes the JSON schema with props in declaration order", () => {
    const library = makeTestLibrary();
    const schema = library.toJSONSchema();
    const inputProps = schema.$defs?.["Input"]?.properties ?? {};
    expect(Object.keys(inputProps)).toEqual(["name", "placeholder", "value"]);
    expect(library.root).toBe("Stack");
    expect(Object.keys(library.components)).toContain("Title");
  });

  it("rejects a root that is not one of the components", () => {
    function build(): void {
      createLibrary({
        root: "Missing",
        components: [
          defineComponent({
            name: "Only",
            description: "",
            props: z.object({ text: z.string() }),
            component: NullRenderer,
          }),
        ],
      });
    }
    expect(build).toThrow(/Missing/);
  });
});

describe("reactive", () => {
  it("marks the schema reactive and returns the same object", () => {
    const schema = z.string().optional();
    const marked = reactive(schema);
    expect(marked).toBe(schema);
    expect(isReactiveSchema(schema)).toBe(true);
  });
});

describe("isElementValue", () => {
  it("accepts a parsed element node", () => {
    const node = { type: "element", typeName: "Title", props: { text: "x" }, partial: false };
    expect(isElementValue(node)).toBe(true);
  });

  it("rejects primitives, arrays and objects without the element shape", () => {
    expect(isElementValue(null)).toBe(false);
    expect(isElementValue("Title")).toBe(false);
    expect(isElementValue([])).toBe(false);
    expect(isElementValue({ type: "element", typeName: "Title" })).toBe(false);
  });
});
