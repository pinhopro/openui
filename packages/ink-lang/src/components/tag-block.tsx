import { Box } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TagBlockSchema } from "../schemas/tag-block-schema";
import { TagText } from "./tag-text";

type TagBlockProps = z.infer<typeof TagBlockSchema>;

/** A wrapping row of plain tags. */
function TagBlockRenderer({ props }: ComponentRenderProps<TagBlockProps>) {
  const tags = Array.isArray(props.tags) ? props.tags : [];
  const nodes: ReactNode[] = [];
  for (let index = 0; index < tags.length; index += 1) {
    nodes.push(<TagText key={index} text={tags[index]} />);
  }
  return (
    <Box flexDirection="row" flexWrap="wrap" gap={1}>
      {nodes}
    </Box>
  );
}

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: TagBlockSchema,
  description: "tags is an array of strings; optional size sm | md | lg",
  component: TagBlockRenderer,
});
