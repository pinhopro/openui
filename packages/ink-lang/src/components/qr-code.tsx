import { Box, Text } from "ink";
import { useMemo, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useComponentStyle } from "../design/design-system-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { QrCodeSchema } from "../schemas/qr-code-schema";
import { textProps } from "../theme-styles";
import { displayText } from "./pad";
import { qrBlockLines, qrMatrix } from "./qr-matrix";

type QrCodeProps = z.infer<typeof QrCodeSchema>;

const QUIET_ZONE = 2;

/** A QR code drawn with block characters; a quiet zone of two modules keeps it scannable. */
function QrCodeRenderer({ props }: ComponentRenderProps<QrCodeProps>) {
  const data = displayText(props.data);
  const size = props.size === "large" ? "large" : "compact";
  const style = useComponentStyle([size]);
  const lines = useMemo(
    function encode() {
      if (data === "") return [];
      return qrBlockLines(qrMatrix(data, QUIET_ZONE), size);
    },
    [data, size],
  );
  if (lines.length === 0) return null;
  const rows: ReactNode[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    rows.push(
      <Text key={index} {...textProps(style.text)}>
        {lines[index]}
      </Text>,
    );
  }
  return (
    <Box flexDirection="column" backgroundColor={style.box.background}>
      {rows}
    </Box>
  );
}

export const QrCode = defineComponent({
  name: "QrCode",
  props: QrCodeSchema,
  description:
    'A QR code for a URL or text, drawn with block characters. size: "compact" (default) | "large".',
  component: QrCodeRenderer,
});
