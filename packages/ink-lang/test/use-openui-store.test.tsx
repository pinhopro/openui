import { createQueryManager, createStore } from "@openuidev/lang-core";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { useQuerySnapshot, useStoreSnapshot } from "../src/use-openui-store";
import { settle } from "./helpers/settle";

describe("useStoreSnapshot", () => {
  it("re-renders when the store changes", async () => {
    const store = createStore();
    store.set("$n", 1);
    function View() {
      const snapshot = useStoreSnapshot(store);
      return <Text>n={String(snapshot["$n"])}</Text>;
    }
    const instance = render(<View />);
    expect(instance.lastFrame()).toBe("n=1");
    store.set("$n", 2);
    await settle();
    expect(instance.lastFrame()).toBe("n=2");
    instance.unmount();
  });
});

describe("useQuerySnapshot", () => {
  it("re-renders when the query manager changes", async () => {
    const queryManager = createQueryManager(null);
    function View() {
      const snapshot = useQuerySnapshot(queryManager);
      const status = snapshot["save"] as { status: string } | undefined;
      return <Text>save={status?.status ?? "none"}</Text>;
    }
    const instance = render(<View />);
    expect(instance.lastFrame()).toBe("save=none");
    queryManager.registerMutations([{ statementId: "save", toolName: "saveTicket" }]);
    await settle();
    expect(instance.lastFrame()).toBe("save=idle");
    instance.unmount();
  });
});
