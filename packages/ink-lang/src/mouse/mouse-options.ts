/** The `mouse` prop of InkRenderer, resolved. */
export interface MouseOptions {
  /** Report every pointer move (xterm mode 1003) so hover handlers fire; on by default. */
  motion: boolean;
}

/** `mouse: true` turns everything on; an object overrides single options; false or undefined is off. */
export function resolveMouseOptions(
  mouse: boolean | Partial<MouseOptions> | undefined,
): MouseOptions | null {
  if (mouse === undefined || mouse === false) return null;
  if (mouse === true) return { motion: true };
  return { motion: mouse.motion ?? true };
}
