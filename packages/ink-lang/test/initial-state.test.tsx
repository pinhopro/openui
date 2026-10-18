import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  '$q = "default"',
  "root = Stack([TextContent($q), form])",
  'form = Form("signup", Buttons([save]), [emailField])',
  'emailField = FormControl("Email", Input("email", "you@example.com"))',
  'save = Button("Save", @ToAssistant("Save"))',
].join("\n");

const initialState = {
  $q: "restored",
  signup: { email: { value: "a@b", componentType: undefined } },
};

describe("initialState", () => {
  it("restores bindings and form fields without firing onStateUpdate", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(inkLibrary, program, {
      initialState,
      onStateUpdate: function onStateUpdate(state) {
        snapshots.push(state);
      },
    });
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("restored");
    expect(plain).toContain("a@b");
    expect(snapshots).toEqual([]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("c");
    await settle();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.["signup"]).toEqual({
      email: { value: "a@bc", componentType: undefined },
    });
    rendered.unmount();
  });

  it("keeps user edits when a later parse adds a declaration", async () => {
    const rendered = await renderProgram(inkLibrary, program, { initialState });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("c");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("a@bc");
    await rendered.update({ response: "$flag = true\n" + program });
    expect(stripAnsi(rendered.frame())).toContain("a@bc");
    rendered.unmount();
  });
});
