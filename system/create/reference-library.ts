import { cloudReferenceLibrary } from "@/system/server/cloud-catalog";
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

export async function getReferenceLibraryData():Promise<ReferenceLibraryData>{ return cloudReferenceLibrary(); }
