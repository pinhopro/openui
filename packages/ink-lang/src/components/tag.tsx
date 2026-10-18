import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TagSchema } from "../schemas/tag-schema";
import { TagText } from "./tag-text";

type TagProps = z.infer<typeof TagSchema>;

function TagRenderer({ props }: ComponentRenderProps<TagProps>) {
  return <TagText text={props.text} icon={props.icon} variant={props.variant} />;
}

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Styled tag/badge with optional Icon and variant",
  component: TagRenderer,
});
