import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef, useState } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { elementRect } from "../focus/element-rect";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { CarouselSchema } from "../schemas/carousel-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
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
  const theme = useTheme();
  const strip = `◂ ${index + 1} / ${count} ▸`;
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: `${index + 1} / ${count}`,
    arrows: { horizontal: true },
    mouse: {
      // The left arrow glyph steps back, the right one forward.
      onClick: function handleClick(event) {
        const element = focusable.ref.current;
        if (element === null || isStreaming) return;
        const offset = event.x - elementRect(element).x;
        if (offset <= 0) onStep(-1);
        else if (offset >= strip.length - 1) onStep(1);
      },
    },
  });

  useInput(
    function handleCarouselKey(_input, key) {
      const delta = horizontalStep(key);
      if (delta !== 0) onStep(delta);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const ring = focusable.isFocused ? textProps(theme.focusRing) : textProps({});
  return (
    <Box ref={focusable.ref}>
      <Text {...ring} dimColor={focusable.isFocused ? ring.dimColor : true}>
        {strip}
      </Text>
    </Box>
  );
}

/** One item visible at a time; Left and Right move while the indicator is focused. */
function CarouselRenderer({ props, renderNode }: ComponentRenderProps<CarouselProps>) {
  const theme = useTheme();
  const isStreaming = useIsStreaming();
  const items = Array.isArray(props.children) ? props.children : [];
  const [index, setIndex] = useState(0);
  const current = clampIndex(index, items.length);
  const carouselRef = useRef<DOMElement | null>(null);

  function step(delta: number): void {
    setIndex(function move(previous) {
      return stepIndex(clampIndex(previous, items.length), items.length, delta);
    });
  }

  // The wheel anywhere over the carousel moves between its items.
  useMouse(carouselRef, {
    onWheel: function handleWheel(event) {
      if (isStreaming) return;
      step(event.direction === "up" || event.direction === "left" ? -event.ticks : event.ticks);
    },
  });

  if (items.length === 0) return null;
  const borderStyle =
    props.variant === "card" ? "round" : props.variant === "sunk" ? "single" : undefined;
  return (
    <Box
      ref={carouselRef}
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
