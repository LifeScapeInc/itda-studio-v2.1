"use client";

import { useState } from "react";
import styled from "styled-components";
import { MoodboardCollageItem } from "@/components/moodboard/moodboard-collage-item";
import { MoodboardDetailViewer } from "@/components/moodboard/moodboard-detail-viewer";
import type { MoodboardLayoutManifest } from "@/system/moodboard/moodboard-layout";

const Root = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  align-items: center;
  justify-content: center;
  background: white;
  overflow: hidden;
`;

const Canvas = styled.div`
  position: relative;
  width: min(100%, calc((100vh - 190px) * 16 / 9));
  max-width: 1600px;
  aspect-ratio: 16 / 9;
  background: white;
`;

export function MoodboardCollage({
  manifest,
  styleName,
}: {
  manifest: MoodboardLayoutManifest;
  styleName: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const images = manifest.items.map((item) => item.src);

  return (
    <Root>
      <Canvas aria-label={`${styleName} 스타일 무드보드 콜라주`}>
        {manifest.items.map((item, imageIndex) => (
          <MoodboardCollageItem
            key={item.src}
            item={item}
            styleName={styleName}
            imageIndex={imageIndex}
            onSelect={setActiveIndex}
          />
        ))}
      </Canvas>
      {activeIndex !== null ? (
        <MoodboardDetailViewer
          images={images}
          name={styleName}
          initialIndex={activeIndex}
          isOpen
          onClose={() => setActiveIndex(null)}
        />
      ) : null}
    </Root>
  );
}
