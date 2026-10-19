import { useStdout } from "ink";
import { useEffect, useState } from "react";

/**
 * A number that grows by one on every terminal resize, so a component that
 * reads it re-renders (and runs its layout effects again) after Ink has laid
 * the program out at the new width. Streams without `on` (some test doubles)
 * never report a resize.
 */
export function useResizeCount(): number {
  const { stdout } = useStdout();
  const [count, setCount] = useState(0);

  useEffect(
    function followResizes() {
      if (typeof stdout.on !== "function") return undefined;
      function handleResize(): void {
        setCount(function next(previous) {
          return previous + 1;
        });
      }
      stdout.on("resize", handleResize);
      return function stopFollowing() {
        stdout.off("resize", handleResize);
      };
    },
    [stdout],
  );

  return count;
}
