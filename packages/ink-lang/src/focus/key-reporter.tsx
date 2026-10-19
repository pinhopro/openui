import { useFocusManager, useInput } from "ink";
import { useContext } from "react";
import { useUiEvents } from "../ui-events";
import { activeEntry } from "./focus-navigator";
import { FocusRegistryContext } from "./focus-registry";
import { keyName } from "./key-name";

/** Reports every key press (and kitty release) as a keydown or keyup UI event. Renders nothing. */
export function KeyReporter() {
  const emit = useUiEvents();
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();

  useInput(function reportKey(input, key) {
    const entry = activeEntry(registry, manager.activeId);
    emit({
      type: key.eventType === "release" ? "keyup" : "keydown",
      component: entry === null ? "" : entry.component,
      name: entry === null ? "" : entry.name,
      key: keyName(input, key),
    });
  });

  return null;
}
