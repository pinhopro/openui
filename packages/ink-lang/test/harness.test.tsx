import { Text, useInput } from "ink";
import { render } from "ink-testing-library";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { settle } from "./helpers/settle";

function Echo() {
  const [typed, setTyped] = useState("");
  useInput(function handleInput(input) {
    setTyped(function append(previous) {
      return previous + input;
    });
  });
  return <Text>typed:{typed}</Text>;
}

describe("test harness (ink-testing-library with Ink 8 and React 19.3)", () => {
  it("renders a frame", () => {
    const instance = render(<Text>hello</Text>);
    expect(instance.lastFrame()).toBe("hello");
    instance.unmount();
  });

  it("delivers keystrokes to useInput", async () => {
    const instance = render(<Echo />);
    instance.stdin.write("ab");
    await settle();
    expect(instance.lastFrame()).toBe("typed:ab");
    instance.unmount();
  });
});
