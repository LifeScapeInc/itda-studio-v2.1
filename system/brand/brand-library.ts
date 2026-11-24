export type BrandCase = "positive" | "negative";
export type BrandImage = { id: string; name: string; imageUrl: string; caseType?: BrandCase };
export type BrandCollection = {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  images: BrandImage[];
};

export type BrandSelection = Pick<BrandCollection, "id" | "name" | "version">;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("itda-studio-brand-library", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("brands", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadBrands(): Promise<BrandCollection[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("brands", "readonly");
      const request = transaction.objectStore("brands").getAll();
      transaction.oncomplete = () => resolve((request.result as BrandCollection[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

// Read and write in a single transaction so edits never overwrite concurrent image additions.
export async function updateBrand(id: string, update: (current: BrandCollection | undefined) => BrandCollection | null): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("brands", "readwrite");
      const store = transaction.objectStore("brands");
      const request = store.get(id);
      request.onsuccess = () => {
        const next = update(request.result as BrandCollection | undefined);
        if (next) store.put(next); else store.delete(id);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

export async function createBrand(name: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await updateBrand(id, () => ({ id, name: name.trim().slice(0, 120) || "새 브랜드", version: 1, createdAt: now, updatedAt: now, images: [] }));
  return id;
}

export function reviseBrand(brand: BrandCollection, changes: Partial<Pick<BrandCollection, "name" | "images">>): BrandCollection {
  return { ...brand, ...changes, version: brand.version + 1, updatedAt: new Date().toISOString() };
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
export async function readBrandImages(files: File[]): Promise<BrandImage[]> {
  if (files.some(file => !IMAGE_TYPES.has(file.type))) throw new Error("JPG, PNG, WEBP, AVIF 또는 GIF 이미지만 추가할 수 있습니다.");
  return Promise.all(files.map(file => new Promise<BrandImage>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const image = new Image();
      image.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, imageUrl });
      image.onerror = () => reject(new Error(`‘${file.name}’ 파일을 이미지로 열 수 없습니다.`));
      image.src = imageUrl;
    };
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다. 다시 시도해 주세요."));
    reader.readAsDataURL(file);
  })));
}
