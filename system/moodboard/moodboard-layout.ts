export const MOODBOARD_CANVAS = {
  width: 1600,
  height: 900,
  gap: 8,
} as const;

export type MoodboardColorEmbedding = [
  lightness: number,
  greenRed: number,
  blueYellow: number,
  lightnessSpread: number,
  chromaSpread: number,
];

export type MoodboardLayoutSource = {
  src: string;
  fileName: string;
  width: number;
  height: number;
  colorEmbedding: MoodboardColorEmbedding;
  colorDistance: number;
  weight: number;
  weightOverride?: number;
};

export type MoodboardLayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MoodboardLayoutItem = MoodboardLayoutSource & {
  rect: MoodboardLayoutRect;
};

export type MoodboardLayoutManifest = {
  version: 1;
  style: string;
  generatedAt: string;
  seed: number;
  canvas: typeof MOODBOARD_CANVAS;
  items: MoodboardLayoutItem[];
};

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type PlacementCandidate = MoodboardLayoutRect & {
  tieBreaker: number;
};

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed || 1;

  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);

    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function effectiveWeight(source: MoodboardLayoutSource): number {
  return clamp(source.weightOverride ?? source.weight, 0, 1);
}

function overlaps(
  candidate: MoodboardLayoutRect,
  placed: MoodboardLayoutRect,
  gap: number,
): boolean {
  return !(
    candidate.x + candidate.width + gap <= placed.x
    || placed.x + placed.width + gap <= candidate.x
    || candidate.y + candidate.height + gap <= placed.y
    || placed.y + placed.height + gap <= candidate.y
  );
}

function touches(
  candidate: MoodboardLayoutRect,
  placed: MoodboardLayoutRect,
): boolean {
  const { gap } = MOODBOARD_CANVAS;
  const tolerance = 0.5;
  const horizontalOverlap = Math.min(
    candidate.x + candidate.width,
    placed.x + placed.width,
  ) - Math.max(candidate.x, placed.x);
  const verticalOverlap = Math.min(
    candidate.y + candidate.height,
    placed.y + placed.height,
  ) - Math.max(candidate.y, placed.y);
  const touchesVerticalEdge = (
    Math.abs(candidate.x + candidate.width + gap - placed.x) < tolerance
    || Math.abs(placed.x + placed.width + gap - candidate.x) < tolerance
  ) && verticalOverlap > tolerance;
  const touchesHorizontalEdge = (
    Math.abs(candidate.y + candidate.height + gap - placed.y) < tolerance
    || Math.abs(placed.y + placed.height + gap - candidate.y) < tolerance
  ) && horizontalOverlap > tolerance;

  return touchesVerticalEdge || touchesHorizontalEdge;
}

function getContactCount(
  candidate: MoodboardLayoutRect,
  placed: MoodboardLayoutRect[],
): number {
  return placed.reduce(
    (count, rect) => count + Number(touches(candidate, rect)),
    0,
  );
}

function getBounds(rects: MoodboardLayoutRect[]): Bounds {
  return rects.reduce<Bounds>(
    (bounds, rect) => ({
      left: Math.min(bounds.left, rect.x),
      top: Math.min(bounds.top, rect.y),
      right: Math.max(bounds.right, rect.x + rect.width),
      bottom: Math.max(bounds.bottom, rect.y + rect.height),
    }),
    {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
    },
  );
}

function getAnchorFitScale(
  rects: MoodboardLayoutRect[],
  bounds = getBounds(rects),
): number {
  const anchor = rects[0];
  const anchorCenterX = anchor.x + anchor.width / 2;
  const anchorCenterY = anchor.y + anchor.height / 2;
  const outerMargin = 24;
  const availableHalfWidth = MOODBOARD_CANVAS.width / 2 - outerMargin;
  const availableHalfHeight = MOODBOARD_CANVAS.height / 2 - outerMargin;

  return Math.min(
    1,
    availableHalfWidth / Math.max(anchorCenterX - bounds.left, 1),
    availableHalfWidth / Math.max(bounds.right - anchorCenterX, 1),
    availableHalfHeight / Math.max(anchorCenterY - bounds.top, 1),
    availableHalfHeight / Math.max(bounds.bottom - anchorCenterY, 1),
  );
}

function getAreaWeightedCenter(rects: MoodboardLayoutRect[]) {
  const result = rects.reduce(
    (accumulator, rect) => {
      const mass = rect.width * rect.height;

      return {
        mass: accumulator.mass + mass,
        x: accumulator.x + (
          (rect.x + rect.width / 2) / MOODBOARD_CANVAS.width
        ) * mass,
        y: accumulator.y + (
          (rect.y + rect.height / 2) / MOODBOARD_CANVAS.height
        ) * mass,
      };
    },
    { mass: 0, x: 0, y: 0 },
  );

  return {
    x: result.x / result.mass,
    y: result.y / result.mass,
  };
}

function getNormalizedVariance(
  rects: MoodboardLayoutRect[],
  center: { x: number; y: number },
) {
  const result = rects.reduce(
    (accumulator, rect) => {
      const mass = Math.sqrt(rect.width * rect.height);
      const centerX = (rect.x + rect.width / 2) / MOODBOARD_CANVAS.width;
      const centerY = (rect.y + rect.height / 2) / MOODBOARD_CANVAS.height;

      return {
        mass: accumulator.mass + mass,
        x: accumulator.x + (centerX - center.x) ** 2 * mass,
        y: accumulator.y + (centerY - center.y) ** 2 * mass,
      };
    },
    { mass: 0, x: 0, y: 0 },
  );

  return {
    x: result.x / result.mass,
    y: result.y / result.mass,
  };
}

function getCandidateCost(
  candidate: PlacementCandidate,
  placed: MoodboardLayoutRect[],
): number {
  const nextRects = [...placed, candidate];
  const nextCenter = getAreaWeightedCenter(nextRects);
  const centerOffset = Math.hypot(nextCenter.x - 0.5, nextCenter.y - 0.5);
  const variance = getNormalizedVariance(nextRects, nextCenter);
  const radialVariance = variance.x + variance.y;
  const anisotropy = Math.abs(variance.x - variance.y)
    / Math.max(radialVariance, Number.EPSILON);
  const bounds = getBounds(nextRects);
  const boundsArea = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  const occupiedArea = nextRects.reduce(
    (sum, rect) => sum + rect.width * rect.height,
    0,
  );
  const emptyRatio = 1 - occupiedArea / boundsArea;
  const anchorFitScale = getAnchorFitScale(nextRects, bounds);

  return (
    centerOffset * 22
    + radialVariance * 28
    + anisotropy * 5
    + emptyRatio * 1.8
    + (1 - anchorFitScale) * 12
    + candidate.tieBreaker * 0.002
  );
}

function createAlignedCandidates(
  width: number,
  height: number,
  placed: MoodboardLayoutRect[],
  random: () => number,
): PlacementCandidate[] {
  const { gap } = MOODBOARD_CANVAS;

  return placed.flatMap((rect) => {
    const leftX = rect.x - width - gap;
    const rightX = rect.x + rect.width + gap;
    const aboveY = rect.y - height - gap;
    const belowY = rect.y + rect.height + gap;
    const alignTop = rect.y;
    const alignBottom = rect.y + rect.height - height;
    const alignLeft = rect.x;
    const alignRight = rect.x + rect.width - width;

    return [
      { x: leftX, y: alignTop, width, height, tieBreaker: random() },
      { x: leftX, y: alignBottom, width, height, tieBreaker: random() },
      { x: rightX, y: alignTop, width, height, tieBreaker: random() },
      { x: rightX, y: alignBottom, width, height, tieBreaker: random() },
      { x: alignLeft, y: aboveY, width, height, tieBreaker: random() },
      { x: alignRight, y: aboveY, width, height, tieBreaker: random() },
      { x: alignLeft, y: belowY, width, height, tieBreaker: random() },
      { x: alignRight, y: belowY, width, height, tieBreaker: random() },
    ];
  });
}

function getTargetSize(
  source: MoodboardLayoutSource,
  totalWeight: number,
): { width: number; height: number } {
  const weight = effectiveWeight(source);
  const areaShare = (0.46 + weight ** 1.75 * 2.3) / totalWeight;
  const targetArea = MOODBOARD_CANVAS.width
    * MOODBOARD_CANVAS.height
    * 0.96
    * areaShare;
  const aspectRatio = clamp(source.width / source.height, 0.55, 2.3);
  let width = Math.sqrt(targetArea * aspectRatio);
  let height = width / aspectRatio;
  const maxWidth = MOODBOARD_CANVAS.width * (0.15 + weight * 0.15);
  const maxHeight = MOODBOARD_CANVAS.height * (0.19 + weight * 0.23);
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  width *= scale;
  height *= scale;

  return { width, height };
}

function findPlacement(
  source: MoodboardLayoutSource,
  placed: MoodboardLayoutRect[],
  random: () => number,
  totalWeight: number,
): MoodboardLayoutRect {
  const targetSize = getTargetSize(source, totalWeight);
  const candidates = createAlignedCandidates(
    targetSize.width,
    targetSize.height,
    placed,
    random,
  ).filter((candidate) => (
    placed.every((rect) => !overlaps(candidate, rect, MOODBOARD_CANVAS.gap))
  ));

  if (candidates.length === 0) {
    throw new Error(`Could not place moodboard image: ${source.fileName}`);
  }

  const mostConnectedCandidates = placed.length < 4
    ? candidates
    : (() => {
      const maximumContactCount = Math.max(
        ...candidates.map((candidate) => getContactCount(candidate, placed)),
      );

      return candidates.filter((candidate) => (
        getContactCount(candidate, placed) === maximumContactCount
      ));
    })();

  return mostConnectedCandidates.reduce((best, candidate) => (
    getCandidateCost(candidate, placed) < getCandidateCost(best, placed)
      ? candidate
      : best
  ));
}

function fitLayoutToCanvasHeight(
  rects: MoodboardLayoutRect[],
): MoodboardLayoutRect[] {
  const bounds = getBounds(rects);
  const boundsWidth = bounds.right - bounds.left;
  const boundsHeight = bounds.bottom - bounds.top;
  const scale = MOODBOARD_CANVAS.height / boundsHeight;
  const scaledWidth = boundsWidth * scale;
  const offsetX = (MOODBOARD_CANVAS.width - scaledWidth) / 2;

  return rects.map((rect) => ({
    x: offsetX + (rect.x - bounds.left) * scale,
    y: (rect.y - bounds.top) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  }));
}

function roundRect(rect: MoodboardLayoutRect): MoodboardLayoutRect {
  return {
    x: Number((rect.x / MOODBOARD_CANVAS.width).toFixed(6)),
    y: Number((rect.y / MOODBOARD_CANVAS.height).toFixed(6)),
    width: Number((rect.width / MOODBOARD_CANVAS.width).toFixed(6)),
    height: Number((rect.height / MOODBOARD_CANVAS.height).toFixed(6)),
  };
}

export function createMoodboardLayoutManifest(
  style: string,
  sources: MoodboardLayoutSource[],
  generatedAt = new Date().toISOString(),
): MoodboardLayoutManifest {
  const seed = hashString(style);
  const random = createRandom(seed);
  const sortedSources = [...sources].sort((left, right) => (
    effectiveWeight(right) - effectiveWeight(left)
      || left.fileName.localeCompare(right.fileName, "en", { numeric: true })
  ));
  const totalWeight = sortedSources.reduce(
    (sum, source) => sum + 0.46 + effectiveWeight(source) ** 1.75 * 2.3,
    0,
  );
  const placed: MoodboardLayoutRect[] = [];
  const itemsWithRawRects = sortedSources.map((source, index) => {
    const rect = index === 0
      ? (() => {
        const size = getTargetSize(source, totalWeight);

        return {
          x: (MOODBOARD_CANVAS.width - size.width) / 2,
          y: (MOODBOARD_CANVAS.height - size.height) / 2,
          ...size,
        };
      })()
      : findPlacement(source, placed, random, totalWeight);

    placed.push(rect);

    return {
      ...source,
      rect,
    };
  });
  const fittedRects = fitLayoutToCanvasHeight(placed);
  const items = itemsWithRawRects.map((item, index) => ({
    ...item,
    rect: roundRect(fittedRects[index]),
  }));

  return {
    version: 1,
    style,
    generatedAt,
    seed,
    canvas: MOODBOARD_CANVAS,
    items,
  };
}
