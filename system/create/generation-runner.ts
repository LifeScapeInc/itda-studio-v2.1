export const FREE_GENERATION_CONCURRENCY = 4;

// Shared FIFO slots for initial batches and later regeneration requests.
let activeRequests = 0;
const waiting: (() => void)[] = [];
export async function scheduleGeneration<T>(run: () => Promise<T>): Promise<T> {
  await new Promise<void>(resolve => {
    const start = () => { activeRequests += 1; resolve(); };
    if (activeRequests < FREE_GENERATION_CONCURRENCY) start();
    else waiting.push(start);
  });
  try { return await run(); }
  finally { activeRequests -= 1; waiting.shift()?.(); }
}

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
      await scheduleGeneration(() => runItem(items[index], index));
    }
  }

  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );
}
