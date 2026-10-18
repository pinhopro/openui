import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CarouselSchema } from "../schemas/carousel-schema";
import { useTheme } from "../theme";
import { horizontalStep } from "./arrow-keys";
import { clampIndex, stepIndex } from "./step-index";

type CarouselProps = z.infer<typeof CarouselSchema>;

interface CarouselStripProps {
  index: number;
  count: number;
  onStep: (delta: number) => void;
}

/**
 * The focusable `◂ n / total ▸` line. It owns the focus hook and is rendered
 * before the item so Tab reaches it before any button inside the item.
 */
function CarouselStrip({ index, count, onStep }: CarouselStripProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });

  useInput(
    function handleCarouselKey(_input, key) {
      const delta = horizontalStep(key);
      if (delta !== 0) onStep(delta);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  return (
    <Text inverse={focusable.isFocused} dimColor={!focusable.isFocused}>
      {`◂ ${index + 1} / ${count} ▸`}
    </Text>
  );
}

/** One item visible at a time; Left and Right move while the indicator is focused. */
function CarouselRenderer({ props, renderNode }: ComponentRenderProps<CarouselProps>) {
  const theme = useTheme();
  const items = Array.isArray(props.children) ? props.children : [];
  const [index, setIndex] = useState(0);
  const current = clampIndex(index, items.length);

  function step(delta: number): void {
    setIndex(function move(previous) {
      return stepIndex(clampIndex(previous, items.length), items.length, delta);
    });
  }

  if (items.length === 0) return null;
  const borderStyle =
    props.variant === "card" ? "round" : props.variant === "sunk" ? "single" : undefined;
  return (
    <Box
      flexDirection="column"
      borderStyle={borderStyle}
      borderColor={props.variant === "card" ? theme.accent : undefined}
      borderDimColor={props.variant === "sunk"}
      paddingX={borderStyle === undefined ? 0 : 1}
    >
      <CarouselStrip index={current} count={items.length} onStep={step} />
      <Box flexDirection="column">{renderNode(items[current])}</Box>
    </Box>
  );
}

export const Carousel = defineComponent({
  name: "Carousel",
  props: CarouselSchema,
  description: "Horizontal scrollable carousel",
  component: CarouselRenderer,
});
