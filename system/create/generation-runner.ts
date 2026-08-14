export const FREE_GENERATION_CONCURRENCY = 4;

export async function runGenerationQueue<T>(
  items: T[],
  concurrency: number,
  runItem: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;

  let nextIndex = 0;
  const workerCount = Math.min(
    items.length,
    Math.max(1, Math.floor(concurrency)),
  );

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await runItem(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );
}
