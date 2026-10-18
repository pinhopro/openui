/** Lets Ink and React flush pending updates: a few macrotask turns. */
export async function settle(turns = 5): Promise<void> {
  for (let index = 0; index < turns; index += 1) {
    await new Promise<void>(function wait(resolve) {
      setTimeout(resolve, 0);
    });
  }
}
