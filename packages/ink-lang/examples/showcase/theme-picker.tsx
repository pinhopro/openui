/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text, type DOMElement } from "ink";
import { useRef } from "react";
import { useMouse } from "../../src/mouse/use-mouse";
import type { ThemePreset } from "../../src/theme-presets";

export interface ThemePickerProps {
  preset: ThemePreset;
  /** Moves to the next (1) or previous (-1) preset. */
  onCycle: (delta: number) => void;
}

/** The theme line under the page list: a click or the wheel cycles the presets. */
export function ThemePicker({ preset, onCycle }: ThemePickerProps) {
  const boxRef = useRef<DOMElement | null>(null);
  useMouse(boxRef, {
    onClick: function handleClick() {
      onCycle(1);
    },
    onWheel: function handleWheel(event) {
      onCycle(event.direction === "up" || event.direction === "left" ? -1 : 1);
    },
  });
  return (
    <Box ref={boxRef} flexDirection="column" marginTop={1}>
      <Text dimColor>Theme: {preset.name}</Text>
      <Text dimColor>{preset.description}</Text>
    </Box>
  );
}
