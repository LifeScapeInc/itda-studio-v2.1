// Verified against the deployed /create final-prompt dialog (2026-11-23).
// "원본 유지" deliberately adds no styling instruction.
export const LIGHT_PROMPTS: Record<string, string> = {
  "원본 유지": "",
  "아침 햇살": "soft morning sunlight, fresh and airy",
  "한낮 자연광": "clear neutral midday daylight",
  "흐린 날 확산광": "soft overcast daylight with gentle low-contrast shadows",
  "노을빛": "warm golden-hour light, long soft shadows",
  "블루아워": "cool blue-hour ambient light balanced with warm interior lights",
  "부드러운 스튜디오": "soft diffused studio lighting",
  "측면 채광": "directional window light from the side, revealing surface texture",
  "역광 실루엣": "gentle backlighting with a readable product and delicate rim highlights",
  "따뜻한 간접조명": "warm indirect interior lighting without harsh hotspots",
  "드라마틱 대비": "dramatic high-contrast lighting",
};
export const MOOD_PROMPTS: Record<string, string> = {
  "원본 유지": "",
  "모던 미니멀": "modern minimal styling",
  "따뜻 포근": "warm, cozy, lived-in",
  "럭셔리": "luxury boutique hotel",
  "빈티지": "vintage retro",
  "재팬디": "restrained Japandi styling with organic textures and calm neutral tones",
  "스칸디나비안": "bright Scandinavian styling with pale wood and practical simplicity",
  "인더스트리얼": "industrial styling with concrete and metal accents",
  "내추럴 우드": "natural wood finishes, earthy textures and an organic palette",
  "갤러리 화이트": "quiet white gallery styling with generous breathing space",
};
export const PROP_PROMPTS: Record<string, string> = {
  "소품 없음": "no decorative props; keep the product and essential room architecture only",
  "식물": "plants and greenery",
  "러그": "a textured rug",
  "커피/책": "coffee, books, magazines",
  "벽 장식": "framed art on the wall",
  "도자기 화병": "a restrained ceramic vase",
  "플로어 램프": "a sculptural floor lamp",
  "쿠션/블랭킷": "coordinated cushions and a casually draped blanket",
  "오브제": "a small curated decorative object",
  "커튼": "soft linen curtains",
  "사이드 테이블": "a proportionate side table that does not obscure the main product",
};
