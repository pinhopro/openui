import type { OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { demoProgram } from "../examples/demo-program";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

describe("examples/demo-program", () => {
  it("renders every statement without errors and shows the table and the select", async () => {
    const errors: OpenUIError[][] = [];
    const rendered = await renderProgram(inkLibrary, demoProgram, {
      onError: function onError(next) {
        errors.push(next);
      },
    });
    expect(errors[errors.length - 1]).toEqual([]);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Latency (ms)");
    expect(plain).toContain("Mumbai");
    expect(plain).toContain("Pick a region");
    expect(plain).toContain("[ Deploy ]");
    rendered.unmount();
  });

  it("binds the picked region to the hint and the deploy message", async () => {
    const rendered = await renderProgram(inkLibrary, demoProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Chosen: eu-west-1");
    rendered.unmount();
  });
});
