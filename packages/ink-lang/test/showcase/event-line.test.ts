import { describe, expect, it } from "vitest";
import { describeUiEvent } from "../../examples/showcase/event-line";

describe("describeUiEvent", () => {
  it("names the event, the component and the instance", () => {
    expect(describeUiEvent({ type: "focus", component: "Button", name: "Go" })).toBe(
      'focus Button "Go"',
    );
    expect(describeUiEvent({ type: "blur", component: "Input", name: "" })).toBe("blur Input");
    expect(describeUiEvent({ type: "keydown", component: "", name: "", key: "Tab" })).toBe(
      "keydown key=Tab",
    );
  });

  it("adds the cell and button of mouse events and the direction of wheel events", () => {
    expect(
      describeUiEvent({
        type: "click",
        component: "Button",
        name: "Go",
        x: 4,
        y: 2,
        button: "left",
      }),
    ).toBe('click Button "Go" @4,2 left');
    expect(
      describeUiEvent({
        type: "wheel",
        component: "Select",
        name: "plan",
        x: 1,
        y: 1,
        direction: "down",
        ticks: 2,
      }),
    ).toBe('wheel Select "plan" @1,1 down x2');
  });

  it("adds the value of input and change events as JSON", () => {
    expect(describeUiEvent({ type: "change", component: "Input", name: "q", value: "ab" })).toBe(
      'change Input "q" = "ab"',
    );
    expect(describeUiEvent({ type: "change", component: "Slider", name: "v", value: [3] })).toBe(
      'change Slider "v" = [3]',
    );
  });
});
