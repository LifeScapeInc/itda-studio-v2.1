import "server-only";
import { cloudMoodboardDetail } from "@/system/server/cloud-catalog";
export async function getMoodboardLayoutManifest(style:string){return (await cloudMoodboardDetail(style))?.manifest??null;}
