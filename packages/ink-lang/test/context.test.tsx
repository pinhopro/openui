import { renderToString, Text } from "ink";
import { afterEach, describe, expect, it } from "vitest";
import { useOpenUI } from "../src/context";
import { FormNameContext, useFormName } from "../src/form-name-context";
import { makeInkTestLibrary, probe, resetInkTestLibrary } from "./helpers/ink-test-library";
import { renderProgram } from "./helpers/render-program";

afterEach(resetInkTestLibrary);

describe("useOpenUI", () => {
  it("throws outside an InkRenderer", () => {
    function Outside() {
      useOpenUI();
      return <Text>never</Text>;
    }
    expect(function renderOutside() {
      renderToString(<Outside />);
    }).toThrow(/InkRenderer/);
  });

  it("gives components the library, the store and the evaluation context", async () => {
    const library = makeInkTestLibrary();
    const rendered = await renderProgram(library, 'root = Stack([Probe("p")])');
    expect(probe.context?.library).toBe(library);
    expect(typeof probe.context?.store.get).toBe("function");
    expect(typeof probe.context?.evaluationContext.getState).toBe("function");
    expect(probe.context?.isStreaming).toBe(false);
    rendered.unmount();
  });
});

describe("public hooks", () => {
  it("offer no context-wide renderNode: a component draws its children with its own numbered renderNode", async () => {
    const api: Record<string, unknown> = await import("../src/index");
    expect(Object.keys(api)).not.toContain("useRenderNode");
  });
});

describe("useFormName", () => {
  it("is undefined outside a form and the form name inside", () => {
    function Reader() {
      const formName = useFormName();
      return <Text>form={formName ?? "none"}</Text>;
    }
    expect(renderToString(<Reader />)).toBe("form=none");
    expect(
      renderToString(
        <FormNameContext.Provider value="signup">
          <Reader />
        </FormNameContext.Provider>,
      ),
    ).toBe("form=signup");
  });
});
