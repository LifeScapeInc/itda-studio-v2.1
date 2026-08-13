# ITDA Studio v2.1 Handoff

## 1. 작업 기준과 경로

- 실제 작업 루트는 `C:\Users\jusmi\Desktop\+\LifeScape\workspace\itda-studio-v2.1`이다.
- `C:\Users\jusmi\Desktop\+\LifeScape\workspace\itda-studio_v2`는 구현 방식과 기능 흐름을 확인하기 위한 참고 프로젝트다.
- v2.1을 수정하기 전에 관련 기능이 v2에 존재하는지 먼저 확인한다. 특히 생성 과정, 비용 산정, 프롬프트 조합, API 연동, navigation interaction을 적극 참고한다.
- v2는 읽기 전용으로 취급한다. 사용자가 명시적으로 요청하지 않는 한 v2에 v2.1 코드, 임시 파일, 빌드 결과 또는 로그를 생성하지 않는다.
- Figma 명세와 v2 구현이 충돌하면 시각 결과는 Figma를 우선하고, 코드 구조와 동작 방식은 가능한 v2의 검증된 패턴을 따른다.

## 2. 기술 구성

- Next.js App Router, React, TypeScript
- `styled-components`
- Zustand
- OpenAI Node SDK
- Lucide React와 `public/assets`의 프로젝트 SVG

새 의존성이나 구현 패턴을 추가하기 전에는 현재 구성으로 해결할 수 있는지 먼저 확인한다.

## 3. UI 및 디자인 시스템

새 페이지와 컴포넌트는 `app/globals.css`에 정의된 v2.1 color, typography, spacing token을 우선 사용한다. 임의의 색상, 글꼴 크기, 간격을 만들기 전에 기존 화면과 토큰을 확인한다.

- item grid의 기본 간격은 `var(--space-lg)`, 즉 24px이다.
- scrollable item grid에는 위아래 `var(--space-3xs)`, 즉 4px padding을 둔다. hover border, outline, shadow가 잘리지 않아야 한다.
- 내부 scroll 영역은 `min-height: 0`, flex sizing, `overflow`를 함께 설정하여 문서 전체가 scroll되지 않게 한다.
- workspace에서 남는 영역을 채우는 패널은 기존 가져오기, 프로젝트, create 및 furniture 화면의 sizing 방식을 참고한다.
- hover, focus, shadow 효과는 기존 공용 효과나 유사 컴포넌트의 interaction을 재사용한다.

### Border radius 규칙

**앞으로 새로 생성하는 모든 컴포넌트의 CSS `border-radius`는 `0px` 이상 `8px` 이하만 허용한다.**

- `border-radius: 999px`, `50%` 또는 8px을 초과하는 값으로 pill·원형 외곽을 만드는 새 컴포넌트는 허용하지 않는다.
- 필요한 경우 `0`, `4px`, `8px` 또는 이에 대응하는 기존 token을 사용한다.
- 이미지 자체의 형태가 원형이어야 한다면 CSS radius를 새로 추가하기보다 제공된 SVG/이미지 에셋을 우선 사용한다.
- 기존 컴포넌트의 8px 초과 radius는 별도 수정 요구가 없는 한 즉시 일괄 변경하지 않는다.

## 4. 코드 구조

- 공통 shell과 navigation: `components/layout/`
- 여러 페이지가 공유하는 UI: `components/ui/`, `components/references/`
- 페이지 전용 UI: `components/<페이지>/`
- 화면에서 분리 가능한 데이터 정의, formatter, validation, hook, domain 함수: `system/<페이지>/`
- 전역 또는 여러 컴포넌트가 공유하는 상태: `stores/`
- 페이지 파일은 데이터 준비와 feature 조립에 집중하고, 유의미한 UI 단위는 컴포넌트로 분리한다.
- TSX 파일 하나는 하나의 공개 컴포넌트를 중심으로 구성한다.
- 컴포넌트 스타일은 같은 TSX 파일의 `styled-components`로 작성한다. 컴포넌트별 CSS Module 파일이나 페이지 selector를 `globals.css`에 추가하지 않는다.
- 컴포넌트 밖으로 뺄 수 있는 formatter, validation, 파일 탐색, API 변환 로직은 `system/`에 둔다.
- 코드와 JSX는 한 줄로 압축하지 않고 읽기 쉬운 여러 줄 형식을 유지한다.

## 5. 상태 관리

공유 상태에는 가능한 Zustand를 사용하되, 단순한 일시적 UI 상태는 React 로컬 상태로 유지한다.

- store는 `stores/` 아래에서 용도별로 분리한다.
- 이름은 `use***Store` 관습을 따른다.
- 하나의 거대한 store에 서로 다른 도메인을 섞지 않는다.
- 재사용 가능한 순수 함수와 서버 데이터 변환은 store가 아니라 `system/`에 둔다.

현재 주요 store는 다음과 같다.

- `useImportStore`: case 조회, 이메일별 고객 그룹, 고객/case 선택
- `useProjectStore`: 프로젝트 생성·조회·삭제와 선택 상태
- `useCreateStore`: 생성 설정, 업로드 이미지, 생성 상태
- `useWorkspaceLayoutStore`: navigation 접힘과 resizable panel 너비
- `useAppSettingsStore`: API key 연결, mock mode 등 앱 설정
- `useThemeStore`: light/dark theme

## 6. 공유 컴포넌트 기준

- `ButtonBack`: 가져오기 depth 2, 무드보드 상세, 가구 상세에서 공유한다.
- `ItemReferences`: 무드보드와 가구의 목록 item에서 공유하고, 페이지별 이동 로직은 부모가 담당한다.
- `ReferenceDetailTitle`: 무드보드와 가구 상세의 제목·설명 조합에서 공유한다.
- `ImageAlbum`: 가구 viewer와 무드보드 상세 overlay에서 공유한다.
- `PanelResizeHandle`: create 양쪽 panel과 furniture gallery처럼 너비 조절이 필요한 영역에서 공유한다.

공유 컴포넌트의 변경은 모든 소비 페이지에 미치는 영향을 확인한다. 페이지별 특수 동작은 무리하게 공용 컴포넌트 안에 넣지 말고 props 또는 페이지 전용 wrapper로 분리한다.

## 7. 주요 페이지 현황

### 가져오기

- `GET /api/integrations/cases`를 통해 ITDA NEO case를 가져온다.
- case는 이메일 주소별로 묶어 `ItemCustomer`로 표시한다.
- 고객 선택 후 route 이동 없이 workspace content가 해당 이메일의 case 목록으로 전환된다.
- 이미 프로젝트가 존재하는 case는 disabled 영역에 분리한다.
- case 기반 프로젝트 생성 시 프로젝트 페이지로 연결된다.

### 프로젝트

- case 기반 또는 사용자 입력 기반 프로젝트를 생성할 수 있다.
- 프로젝트 목록은 Zustand store를 사용하며 삭제 overlay를 제공한다.
- 프로젝트 썸네일은 이후 생성 결과를 저장할 수 있는 구조를 유지한다.

### 컷 연출(Create)

- 재료 준비, staging canvas, 생성 설정의 세 영역으로 구성된다.
- 재료 준비와 생성 설정 panel은 최소 너비와 drag resize를 지원한다.
- 콘텐츠 세트와 앵글 변주는 동시에 선택할 수 없다.
- 레퍼런스 이미지가 있을 때만 AI 편집 방식 설정을 노출한다.
- 설정값은 `system/create/generation-prompt.ts`를 통해 최종 프롬프트로 조합한다.
- API key가 없거나 mock mode이면 mock 생성 흐름을 사용하고, 그 외에는 `/api/generate`를 호출한다.

### 무드보드

- `public/references/mood/<style>/`를 데이터 원본으로 사용한다.
- 목록은 `ItemReferences` grid로 표시한다.
- 상세 화면은 `<style>_render.jpg`를 workspace에 맞춰 표시한다.
- 상세보기는 `<style> (n).png` 이미지들을 workspace 범위의 overlay album으로 표시한다.

### 가구

- `public/references/furniture/<category>/`를 데이터 원본으로 사용한다.
- 영문 디렉터리 이름을 한글 표시명으로 변환한다.
- 상세 화면은 이미지 album과 우측 resizable gallery panel로 구성한다.
- 방향키와 gallery item으로 현재 이미지를 변경할 수 있다.

## 8. API와 환경변수

### ITDA NEO 연동

- `ITDA_NEO_BASE_URL`: ITDA NEO 서버의 base URL
- `INTEGRATION_API_SECRET`: server-to-server Bearer 인증 secret

브라우저가 NEO를 직접 호출하지 않고 v2.1의 `/api/integrations/cases` route를 통한다. secret은 클라이언트 번들에 노출하지 않는다.

### 이미지 생성

- 로컬 환경변수 `OPENAI_API_KEY`를 최우선으로 확인한다.
- 환경변수가 없으면 설정 화면에서 사용자가 등록한 key를 서버 설정 경로를 통해 사용한다.
- key 원문을 클라이언트 상태나 로그에 노출하지 않는다.
- mock mode에서는 실제 OpenAI 요청을 보내지 않는다.

## 9. 검증과 Git

- 변경 범위에 맞춰 ESLint와 `tsc --noEmit --incremental false`를 실행한다.
- 레이아웃 또는 interaction 변경은 실제 브라우저에서 표시, scroll, resize, keyboard, overlay 범위를 확인한다.
- shared component 변경은 최소 두 개 이상의 소비 화면에서 회귀 여부를 확인한다.
- 무드보드 전용, 가구 전용, shared reference UI, 공용 navigation/UI 변경은 가능한 별도 커밋으로 나눈다.
- 사용자의 기존 변경을 덮어쓰거나 관련 없는 파일을 정리하지 않는다.
