import { Text } from "ink";

export interface UnknownComponentProps {
  typeName: string;
}

/** The diagnostic drawn in place of a component the library does not know. */
export function UnknownComponent({ typeName }: UnknownComponentProps) {
  return <Text color="red">Unknown component: {typeName}</Text>;
}
