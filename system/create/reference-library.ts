import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { FURNITURE_CATEGORIES } from "@/system/furniture/furniture-catalog";
import { MOODBOARDS } from "@/system/moodboard/moodboards";

export type ReferenceLibraryTab = "furniture" | "mood" | "bookmarks";

export type ReferenceLibraryGroup = {
  id: string;
  name: string;
  description: string;
  previewImages: string[];
  images: string[];
};

export type ReferenceLibraryData = Record<
  ReferenceLibraryTab,
  ReferenceLibraryGroup[]
>;

const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|webp)$/i;
const collator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base",
});

function getImages(relativeDirectory: string): string[] {
  const directory = path.join(
    process.cwd(),
    "public",
    "references",
    relativeDirectory,
  );

  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSION.test(entry.name))
    .map((entry) => entry.name)
    .filter((fileName) => !/_render\.(jpe?g|png|webp)$/i.test(fileName))
    .sort((left, right) => collator.compare(left, right))
    .map(
      (fileName) => (
        `/references/${relativeDirectory}/${encodeURIComponent(fileName)}`
      ),
    );
}

function getBookmarkGroups(): ReferenceLibraryGroup[] {
  const root = path.join(process.cwd(), "public", "references", "bookmarks");

  if (!existsSync(root)) {
    return [];
  }

  const entries = readdirSync(root, { withFileTypes: true });
  const rootImages = getImages("bookmarks");
  const groups = entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => collator.compare(left.name, right.name))
    .map((entry) => {
      const images = getImages(`bookmarks/${entry.name}`);

      return {
        id: entry.name,
        name: entry.name,
        description: `저장한 북마크 이미지 · ${images.length}장`,
        previewImages: images.slice(0, 3),
        images,
      };
    });

  if (rootImages.length) {
    groups.unshift({
      id: "all-bookmarks",
      name: "북마크",
      description: `저장한 북마크 이미지 · ${rootImages.length}장`,
      previewImages: rootImages.slice(0, 3),
      images: rootImages,
    });
  }

  return groups;
}

export function getReferenceLibraryData(): ReferenceLibraryData {
  const furniture = FURNITURE_CATEGORIES.map((category) => {
    const images = getImages(`furniture/${category.slug}`);

    return {
      id: category.slug,
      name: category.name,
      description: images.length
        ? `${category.description} · ${images.length}장`
        : `${category.description} · 준비 중`,
      previewImages: images.slice(0, 3),
      images,
    };
  });

  const mood = MOODBOARDS.map((moodboard) => {
    const images = getImages(`mood/${moodboard.slug}`);

    return {
      id: moodboard.slug,
      name: moodboard.name,
      description: `${moodboard.description} · ${images.length}장`,
      previewImages: images.slice(0, 3),
      images,
    };
  });

  return {
    furniture,
    mood,
    bookmarks: getBookmarkGroups(),
  };
}
