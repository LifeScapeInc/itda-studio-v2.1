# 용도·구도·비율별 생성 프롬프트

작성일은 2026-11-19이다. [프리셋 분해 논의](generation-preset-decomposition.md)의 용도 4개, 구도 7개, 비율 6개를 대상으로 새 영문 프롬프트를 작성했다. 첫 번째 입력은 제품이 놓인 완성된 공간 사진이며, 별도 레퍼런스는 사용하지 않는다. 아래 문구는 구현 전 초안이고 실제 이미지 생성으로 검증하지 않았다. 구도의 45도 명칭은 기존 분류를 유지하며 영문에는 `three-quarter view`를 사용한다.

## 기존 조합 분석

| 기존 요소 | 현재 동작 | 새 조합에 반영한 방식 |
|---|---|---|
| 역할·목적 | 상세페이지·SNS·광고·룩북마다 역할과 게시 목적을 지정 | 사진가 역할은 공통 앞 문구, 쓰임에 따른 요구는 용도로 이동 |
| 제품 보존 | 형태·비례·색상·소재 유지 | 공통 앞 문구로 통합 |
| 레퍼런스 관계 | 없음이면 새 공간 생성, 있음이면 교체·분위기·소재 모드 분기 | 첫 번째 공간 사진의 동일성을 유지하는 전제로 재작성 |
| 컷별 의도 | 히어로·측면·디테일·공간·카피 여백 등을 컷마다 지정 | 카피 여백과 가독성은 용도, 시점과 촬영 범위는 구도로 이동 |
| 앵글 변주 | 같은 방 재촬영, 카메라 이동, 구도·렌즈·심도 지정 | 같은 방 재촬영은 공통 앞 문구, 이동과 촬영 특성은 구도로 이동 |
| 스타일·사용자 입력 | 콘텐츠 세트는 조명·분위기·소품과 사용자 입력을 추가. 앵글 변주는 이 요소를 조합하지 않음 | 공간과 조명을 유지하는 이번 전제에 맞춰 17개 옵션에는 포함하지 않음 |
| 비율 | 프롬프트와 별도로 API에 전달하고 서버에서 크기 매핑 | 비율별 프롬프트와 API 요청 크기를 함께 정의 |
| 사실성·일관성 | 자연스러운 크기·접촉 그림자, 같은 방 유지, 프레임 밖 요소 생략 | 공통 뒤 문구로 통합 |

기본은 눈높이 정면을 채택했다. 기존 망원의 고정 초점거리와 강한 배경 흐림은 일반화했고, 디테일은 소재에 필요한 초점만 지정한다. 공간 포함은 기존 방의 배치와 생활 맥락을 보여주도록 구성했다. 리버스는 방 반대편이라는 이동 지시를 유지한다.

## 조합 순서와 적용 규칙

한 이미지마다 각 속성에서 하나씩 선택하고, 다음 다섯 블록을 빈 줄로 연결한다.

```text
{COMMON_PREFIX}

{PURPOSE_PROMPT}

{COMPOSITION_PROMPT}

{RATIO_PROMPT}

{COMMON_SUFFIX}
```

용도는 광고 여백과 작은 화면에서의 가독성을, 구도는 시점과 촬영 범위를, 비율은 캔버스 형태를 결정한다. 구도에서 제품 중심이라고 표현할 때는 시각적 주인공이라는 뜻이며, 배너의 한쪽 배치와 함께 적용할 수 있다.

용도와 구도를 결합할 때 다음 기준을 적용한다.

- 디테일에서는 소재·마감 부분이 주 피사체이다. 썸네일도 선택한 디테일의 가독성을 높인다.
- 공간 포함에서는 주변 방의 맥락을 유지하면서 썸네일 가독성을 확보한다.
- 배너 여백은 카메라 이동과 프레이밍으로 확보하며 기존 가구를 이동하거나 없애지 않는다.
- 스토리는 모든 비율과 조합할 수 있도록 화면을 채우는 용도로 정의한다. 세로 화면용 기본 템플릿은 9:16을 사용한다.
- 비율 문구와 API의 비율·크기는 같은 값을 사용한다. 텍스트 지시와 함께 실제 출력 크기를 지정한다.

레퍼런스 없이 입력 이미지만 사용하는 경우에는 아래 공간 동일성 지시를 모든 조합에 적용한다. 배너 여백과 비율 변경도 동일한 방 안에서 카메라와 프레이밍을 조정해 구현한다.

## 공통 앞 문구

`COMMON_PREFIX`

```text
Act as a professional interior and product photographer continuing the same photo shoot. Treat the first input image as a finished photograph of a real room. Re-photograph that exact same room as if the photographer moved to another camera position during the same shoot. Everything in the room stays identical; only the camera moves, with lens and framing adjusted for the selected shot. Create one new photograph of that same room and its main furniture subject, using the selected purpose, composition, and aspect ratio below. Preserve the subject's identity, shape, proportions, color, material, and construction. Preserve the room's architecture, furniture arrangement, existing objects, lighting direction, and overall color palette. Adjust the camera position, lens, and framing to achieve the selected composition and layout.
```

## 용도 프롬프트 4개

### 1. 일반 이미지 · `purpose.general`

대표 사진, 피드, 제품 소개와 룩북의 일반 사진을 통합한다.

```text
Create a polished editorial photograph for presenting the furniture and its setting. Establish a clear visual hierarchy with the selected subject or detail as the focal point, balanced spacing, and a clean photographic presentation.
```

### 2. 배너 · `purpose.banner`

SNS 광고용과 광고 배너의 카피 여백 요구를 통합한다. 여백에 문구는 후편집으로 배치한다고 가정했다.

```text
Create a photographic banner background with a clear, visually quiet area for copy to be added later. Place the selected subject or detail off-center and keep the copy area separate from it. In landscape and square formats, favor copy space beside the subject; in portrait formats, favor copy space above or below it. Use existing wall, floor, or softly rendered room surfaces to create this space through framing. Keep the subject prominent and the copy area low in visual detail.
```

### 3. 썸네일 · `purpose.thumbnail`

전체 제품이나 선택한 디테일이 작게 표시되어도 식별되도록 지시한다.

```text
Create a thumbnail that remains legible at a small display size. Make the selected subject or detail immediately recognizable through clear contours, readable material features, and strong visual separation from its surroundings. Allocate enough of the frame to the focal subject while retaining the room context required by the selected composition.
```

### 4. 스토리 · `purpose.story`

캔버스의 세로 여부는 비율 옵션이 정한다. 가장자리까지 채우면서 주요 피사체는 UI에 가려질 수 있는 경계에서 떨어뜨린다.

```text
Create an immersive, full-bleed social story photograph that fills the entire selected canvas. Give the selected subject or detail an immediate visual focus and keep its essential features comfortably inside the frame, with breathing room near the outer edges for interface overlays added by the publishing platform.
```

## 구도 프롬프트 7개

### 5. 기본 · `composition.standard`

히어로·피드·룩북 전면과 에디토리얼 정면의 공통 의도를 사용한다.

```text
Photograph the main furniture subject straight on from a natural eye-level camera position. Keep its front face readable and show the complete piece with balanced breathing room. Use a natural, gently compressed perspective and controlled depth of field that keeps the furniture clearly resolved. Position the subject within the canvas according to the selected purpose.
```

### 6. 45도 · `composition.three_quarter`

정면과 측면을 함께 보여주는 기존 사선 컷을 사용한다.

```text
Move the camera to a three-quarter view of the main furniture subject, approximately 45 degrees from its front. Show the front and one side together so its volume, depth, and construction are clearly visible. Keep the complete piece in frame at a natural eye-level camera height, with realistic proportions and controlled perspective.
```

### 7. 사이드 · `composition.side`

```text
Rotate the camera to look at the current scene fully from the side. Turn the viewpoint a full 90 degrees to the left or right from the original photo so the camera looks at the main furniture subject directly from the side, not diagonally. Make this an unmistakable full side view, not a front view or a three-quarter view. Move the camera, not the furniture. The background must also be seen from this new side position, with the walls, floor, and nearby objects changing perspective together. Keep the furniture and room layout unchanged. Show the complete subject at a natural eye-level camera height.
```

### 8. 디테일 · `composition.detail`

기존 디테일·질감 클로즈업·매크로를 통합한다. 기존 이미지에서 확인되는 특징을 우선한다.

```text
Move close to a distinctive, visible area of the main furniture subject and make that material or construction detail the focal subject. Frame the texture, seam, joinery, edge, or finish tightly enough to reveal its craftsmanship. Use close-up photography with selective focus that keeps the chosen feature sharply resolved and lets surrounding areas fall off gently. Preserve the exact material appearance and construction supported by the input image.
```

### 9. 공간 포함 · `composition.environmental`

```text
Pull the camera back to show the main furniture subject within the existing room. Include enough surrounding architecture and nearby furnishings to communicate scale, placement, and the room's lived-in context. Use a comfortable standing-height viewpoint and a corrected wide-angle perspective, with clear spatial depth and a readable focal subject.
```

### 10. 리버스 · `composition.reverse`

기존의 반대편 이동과 망원 구도 의도를 유지한다. 반대편 공간이나 제품 뒷면은 단일 입력에서 관찰되지 않을 수 있다.

```text
Move the camera to the opposite side of the room and photograph the main furniture subject while looking back toward the original camera position. Favor a three-quarter view from this reverse direction, with a gently compressed telephoto perspective and a softly resolved background. Keep the subject's geometry and its position relative to the room consistent with the input image. Derive newly visible surfaces conservatively from the visible architecture, materials, and construction.
```

### 11. 로우앵글 · `composition.low_angle`

```text
Lower the camera close to floor height and photograph the main furniture subject looking slightly upward. Emphasize its structure, base, and presence within the room. Use tilt-shift-style architectural perspective correction to keep wall lines vertical and proportions believable, with deep front-to-back sharpness and precise interior-editorial framing.
```

## 비율 프롬프트 6개

비율 블록은 캔버스와 그 안의 재프레이밍만 지시한다. 배너 여백과 피사체 촬영 방향은 각각 용도와 구도 블록을 따른다.

### 12. 1:1 · `ratio.square`

API 비율은 `1:1`, 요청 크기는 `1024x1024`이다.

```text
Output a square image with an exact 1:1 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the square canvas while preserving realistic subject proportions.
```

### 13. 3:4 · `ratio.portrait_3_4`

API 비율은 `3:4`, 요청 크기는 `1152x1536`이다.

```text
Output a portrait image with an exact 3:4 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the portrait canvas while preserving realistic subject proportions.
```

### 14. 4:5 · `ratio.portrait_4_5`

API 비율은 `4:5`, 요청 크기는 `1024x1280`이다.

```text
Output a portrait image with an exact 4:5 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the portrait canvas while preserving realistic subject proportions.
```

### 15. 9:16 · `ratio.portrait_9_16`

API 비율은 `9:16`, 요청 크기는 `1152x2048`이다.

```text
Output a tall portrait image with an exact 9:16 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the tall canvas while preserving realistic subject proportions.
```

### 16. 16:9 · `ratio.landscape_16_9`

API 비율은 `16:9`, 요청 크기는 `2048x1152`이다.

```text
Output a wide landscape image with an exact 16:9 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the wide canvas while preserving realistic subject proportions.
```

### 17. 3:2 · `ratio.landscape_3_2`

새 비율 값은 `3:2`, 요청 크기는 `1536x1024`이다. 현재 코드에는 `3:2` 타입이 없어 구현 시 추가가 필요하다. 기존 `original`이 이 크기를 사용한다.

```text
Output a landscape image with an exact 3:2 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the landscape canvas while preserving realistic subject proportions.
```

## 공통 뒤 문구

`COMMON_SUFFIX`

```text
Render a photorealistic photograph with believable scale, coherent perspective, natural contact shadows, and faithful material textures. Maintain the identity of the exact room shown in the input image throughout the new photograph. Keep all existing objects in their original positions. If an object falls outside the new frame or becomes occluded, omit it from view and never invent a replacement. Preserve the room's spatial continuity wherever the new view reveals additional surfaces, using restrained continuations of the visible structure and materials. Avoid adding or replacing furniture, props, architectural features, or decorative details. Render the photograph edge to edge without borders, graphic overlays, or newly generated text or logos. Preserve any existing product markings faithfully wherever they remain visible.
```

공통 뒤 문구의 텍스트 제한은 새로 그려 넣는 문구에 적용한다. 배너는 후편집용 이미지로 가정했으며, 기존 제품의 표식은 보존하도록 작성했다.

## 조합 예시

SNS 광고용에 해당하는 `배너 × 기본 × 1:1`은 다음 완성 프롬프트를 사용한다. API 크기는 `1024x1024`이다.

```text
Act as a professional interior and product photographer continuing the same photo shoot. Treat the first input image as a finished photograph of a real room. Re-photograph that exact same room as if the photographer moved to another camera position during the same shoot. Everything in the room stays identical; only the camera moves, with lens and framing adjusted for the selected shot. Create one new photograph of that same room and its main furniture subject, using the selected purpose, composition, and aspect ratio below. Preserve the subject's identity, shape, proportions, color, material, and construction. Preserve the room's architecture, furniture arrangement, existing objects, lighting direction, and overall color palette. Adjust the camera position, lens, and framing to achieve the selected composition and layout.

Create a photographic banner background with a clear, visually quiet area for copy to be added later. Place the selected subject or detail off-center and keep the copy area separate from it. In landscape and square formats, favor copy space beside the subject; in portrait formats, favor copy space above or below it. Use existing wall, floor, or softly rendered room surfaces to create this space through framing. Keep the subject prominent and the copy area low in visual detail.

Photograph the main furniture subject straight on from a natural eye-level camera position. Keep its front face readable and show the complete piece with balanced breathing room. Use a natural, gently compressed perspective and controlled depth of field that keeps the furniture clearly resolved. Position the subject within the canvas according to the selected purpose.

Output a square image with an exact 1:1 width-to-height aspect ratio. Reframe the selected composition and purpose layout to fit the square canvas while preserving realistic subject proportions.

Render a photorealistic photograph with believable scale, coherent perspective, natural contact shadows, and faithful material textures. Maintain the identity of the exact room shown in the input image throughout the new photograph. Keep all existing objects in their original positions. If an object falls outside the new frame or becomes occluded, omit it from view and never invent a replacement. Preserve the room's spatial continuity wherever the new view reveals additional surfaces, using restrained continuations of the visible structure and materials. Avoid adding or replacing furniture, props, architectural features, or decorative details. Render the photograph edge to edge without borders, graphic overlays, or newly generated text or logos. Preserve any existing product markings faithfully wherever they remain visible.
```

## 적용 시 확인할 한계

단일 이미지에서는 보이지 않는 제품 뒷면과 방 반대편의 구조를 확정할 수 없다. 리버스와 사이드는 새로 보이는 면의 추정이 필요하므로, 동일성 유지 지시를 포함해도 결과의 정확성을 실제 이미지로 확인해야 한다.

## 근거 코드

- [기존 프롬프트 조합](../system/create/generation-prompt.ts)
- [기존 앵글의 구도·촬영 기법](../system/create/generation-options.ts)
- [컷 정의](../system/create/generation-shots.ts)
- [API 요청 크기](../system/server/image-settings.ts)

