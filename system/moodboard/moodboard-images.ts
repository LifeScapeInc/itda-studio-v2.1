import "server-only";
import { cloudMoodboardDetail } from "@/system/server/cloud-catalog";
export async function getMoodboardDetailImages(style:string){return (await cloudMoodboardDetail(style))?.manifest.items.map(i=>i.src)??[];}
