import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { IconTextSchema } from "../schemas/icon-text-schema";
import { useTheme } from "../theme";
import { iconText } from "./icon";
import { displayText } from "./pad";
import { TitledLine } from "./titled-line";
import { variantColor } from "./variant-color";

type IconTextProps = z.infer<typeof IconTextSchema>;

function IconTextRenderer({ props }: ComponentRenderProps<IconTextProps>) {
  const theme = useTheme();
  return (
    <TitledLine
      lead={iconText(props.icon)}
      leadColor={variantColor(props.iconVariant, theme)}
      title={displayText(props.title)}
      subtitle={displayText(props.subtitle)}
      bold={props.bold === true}
      layout={props.layout}
    />
  );
}

export const IconText = defineComponent({
  name: "IconText",
  props: IconTextSchema,
  description:
    "An icon badge with a title and optional subtitle, laid out horizontally or vertically. iconVariant sets the badge color.",
  component: IconTextRenderer,
});
