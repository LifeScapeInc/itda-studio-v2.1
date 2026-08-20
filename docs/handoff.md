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
- 사용자 업로드, 라이브러리, 프로젝트 미리보기 및 생성 결과처럼 로딩 시간이 발생할 수 있는 content image는 `LoadingImage`를 사용한다. 이미지가 로드되기 전에는 neutral placeholder 중앙에 loading spinner를 표시하고, 로드 완료 후 fade-in한다. 로고·아이콘처럼 즉시 표시되는 정적 SVG에는 적용하지 않는다.

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
- `useDetailPageStore`: 상세페이지 단계, 업로드 재료, 기획안 후보, 템플릿 타일과 프로젝트별 snapshot
- `useWorkspaceLayoutStore`: navigation 접힘과 resizable panel 너비
- `useAppSettingsStore`: API key 연결, mock mode 등 앱 설정
- `useThemeStore`: light/dark theme

## 6. 공유 컴포넌트 기준

- `ButtonBack`: 가져오기 depth 2, 무드보드 상세, 가구 상세에서 공유한다.
- `ItemReferences`: 무드보드와 가구의 목록 item에서 공유하고, 페이지별 이동 로직은 부모가 담당한다.
- `ReferenceDetailTitle`: 무드보드와 가구 상세의 제목·설명 조합에서 공유한다.
- `ImageAlbum`: 가구 viewer와 무드보드 상세 overlay에서 공유한다.
- `PanelResizeHandle`: create 양쪽 panel과 furniture gallery처럼 너비 조절이 필요한 영역에서 공유한다.
- `LoadingImage`: 프로젝트, 라이브러리와 상세 depth, create 및 상세페이지의 content image loading placeholder에서 공유한다.
- `UploadCard`: create 재료 준비의 이미지 업로드와 상세페이지의 이미지·요청서 업로드가 공유하는 정사각형 업로드 frame이다.

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
- 프로젝트를 더블클릭하면 프로젝트의 생성 종류에 맞는 작업 화면을 연다. 상세페이지 프로젝트는 `/detail-page`, 컷 생성 프로젝트는 `/create`를 사용한다.
- 프로젝트가 열리면 `NavigationTop`에 프로젝트 이름의 탭이 추가된다. 탭 전환 시 각 프로젝트의 진행 상태가 복원되고, 닫기 버튼은 탭만 닫으며 프로젝트 데이터는 삭제하지 않는다.
- 프로젝트 탭 영역은 왼쪽 navigation의 접힘 여부와 무관하게 고정된 시작 offset을 사용하며, 탭이 많아지면 가로 overflow로 처리한다.
- 프로젝트 썸네일과 최근 작업 시각은 생성 결과 또는 상세페이지 초안 기록을 반영할 수 있는 구조다.

### 컷 연출(Create)

- 재료 준비, staging canvas, 생성 설정의 세 영역으로 구성된다.
- 재료 준비와 생성 설정 panel은 최소 너비와 drag resize를 지원한다.
- 콘텐츠 세트와 앵글 변주는 동시에 선택할 수 없다.
- 레퍼런스 이미지가 있을 때만 AI 편집 방식 설정을 노출한다.
- 설정값은 `system/create/generation-prompt.ts`를 통해 최종 프롬프트로 조합한다.
- API key가 없거나 mock mode이면 mock 생성 흐름을 사용하고, 그 외에는 `/api/generate`를 호출한다.
- 프로젝트 탭에서 연 create workspace와 프로젝트에 속하지 않은 일반 create workspace의 상태를 각각 보관한다.
- 생성 히스토리는 프로젝트 ID로 분리되며 현재 프로젝트의 항목만 표시한다. 프로젝트가 없는 workspace에서는 unscoped 히스토리만 표시한다.
- 콘텐츠 세트와 앵글 변주는 자유 생성을 제외하고 요청을 동시에 실행한다. 자유 생성은 최대 네 요청씩 병렬 실행하며, 429와 5xx 응답은 지수 backoff 후 재시도한다.
- 생성 결과는 요청 순서와 무관하게 원래 shot 위치에 결합한다.

### 상세 페이지

- route는 `/detail-page`이며 `app/detail-page/page.tsx`와 `components/detail-page/`에서 조립한다.
- 작업은 `재료 준비 → 기획안 → 템플릿 제작 → 템플릿 편집`의 네 단계로 진행하며 `DetailStepNavigation`으로 이동한다.
- 단계 navigation 높이는 create panel header와 같은 58px이고, 제목과 보조 문구는 staging canvas의 `type-xsmall-body`, `type-xsmall-thin` 조합을 사용한다.
- 재료 준비는 대상 가구 이미지와 의뢰 요청서를 받는다. 두 업로드 영역은 같은 `UploadCard`와 최대 420px 정사각형 크기를 사용한다.
- 가구 이미지는 1:1 crop 형태로 표시한다. 요청서는 PDF, DOC, DOCX, XLSX, TXT를 허용한다.
- `기획 생성`은 현재 mock 동작이다. 약 900ms 뒤 세 개의 `MOCK_PLANNING_CANDIDATES`를 제공하며, 이전/다음 navigator로 후보를 넘기고 하나를 확정한다.
- 기획안 단계에는 템플릿 미리보기를 표시하지 않고 콘셉트, 제목, 설명, 키워드만 표시한다.
- 기획안을 확정하면 `createDetailTiles`가 선택한 `tileTypes` 순서대로 템플릿 초안을 만든다.
- 템플릿 제작 단계에서는 각 타일의 설명을 textarea로 수정할 수 있다. 이미지 타일은 `shotCount`를 가지며 1~12컷 범위로 수정한다. 기본값은 히어로 1컷, 클로즈업 3컷, 소재 2컷, 공간 연출 2컷이다.
- 템플릿 편집 단계는 왼쪽 타일 library, 가운데 wireframe, 오른쪽 inspector로 구성된다. 타일 추가·삭제·선택·순서 변경과 PNG/WebP 내보내기를 지원한다.
- 타일 drag 중에는 반투명 drag image가 pointer를 따라가며 전체 cursor를 `grabbing`으로 통일한다. drag enter 시 로컬 preview 배열을 먼저 재배치하고 drop 시 Zustand 상태에 확정해 Figma auto-layout과 유사한 순서 미리보기를 제공한다.
- 이미지 타일을 선택하면 inspector에서 이미지 생성 prompt를 확인한다. 현재 실제 상세페이지 이미지 생성과 기획 생성 API는 연결하지 않은 mockup 단계다.
- `useDetailPageStore`는 프로젝트별 workspace snapshot과 프로젝트에 속하지 않은 snapshot을 분리한다. 프로젝트 탭 전환 시 재료, 단계, 기획안, 타일 편집 상태가 복원된다.

### 무드보드

- `public/references/mood/<style>/`를 데이터 원본으로 사용한다.
- 목록은 `ItemReferences` grid로 표시한다.
- 상세 화면은 `<style>_render.png`에 의존하지 않고 `<style>_<n>.<ext>` 이미지와 `data/moodboard-layouts/<style>.json`을 이용해 16:9 자유형 collage를 직접 렌더링한다.
- manifest는 `npm run moodboard:layout`으로 생성한다. 스크립트는 축소 이미지의 OKLab 평균·분산 임베딩을 스타일 전체 중심과 비교해 상대 가중치를 만들고, 가중치가 큰 이미지를 더 크고 중앙에 배치한 결정론적 결과를 기록한다.
- 레이아웃 계산의 기준 gap은 8px이고 스타일 이름 기반 고정 seed를 사용한다. 기존 manifest의 `weightOverride` 값은 재생성할 때 보존되므로 사람이 중요도를 보정할 수 있다.
- 배치는 가장 높은 가중치 이미지를 중앙에 놓고, 다음 이미지를 기존 이미지의 변과 8px 간격으로 이어 붙이는 center-out packing 방식이다. 후보는 기존 이미지 변의 중간이 아니라 양 끝에 맞춘 위치만 생성한다.
- 1~4번 이미지는 원점 거리와 분산 평가로 기본 골격을 만든다. 5번부터는 유효 후보가 맞닿는 기존 이미지 수를 먼저 계산하고, 가장 많은 이미지와 접촉하는 후보들만 남긴 뒤 새 면적 가중 중심과 canvas 원점 `(0.5, 0.5)` 사이의 거리, 전체 중심으로부터의 정규화된 2차 모멘트, X/Y 분산의 비등방성을 비교한다. 이전 단계의 무게중심 변화량은 평가하지 않는다.
- 색상 유사도 순위는 logarithmic decay로 0.08~1 사이의 가중치가 된다. 이미지 면적에는 `0.46 + weight^1.75 × 2.3`을 사용하며, 1순위와 최하위 목표 면적의 비율이 6배를 넘지 않도록 하위 구간의 기울기를 완화한다.
- 전체 이미지의 목표 점유율은 virtual canvas의 96%를 기준으로 계산하며, 개별 최대 폭과 높이는 가중치에 따라 각각 15~30%, 19~42% 범위로 제한한다.
- 배치 완료 후 전체 bounding box를 다시 계산하고, aspect ratio를 유지한 uniform scale로 `BB 높이 = canvas 높이`가 되도록 확대한다. BB 상단은 canvas 상단에 맞추고, 가로는 BB 전체를 canvas 중앙에 정렬한다.
- 페이지 진입 시 이미지 분석이나 rectangle packing을 다시 실행하지 않고 server component가 검증된 manifest를 읽는다.
- collage 이미지는 원본 aspect ratio를 유지한다. hover 시 내부 이미지만 `280ms ease-out`으로 1.04배 확대되어 layout shift 없이 가장자리만 crop된다.
- 각 collage 이미지를 클릭하면 해당 이미지 index부터 workspace 범위의 overlay album을 연다. 별도의 `상세보기` 버튼은 사용하지 않는다.

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

### Studio 로그인

- `STUDIO_LOGIN_PASSWORD_HASH`: `npm run auth:setup`으로 생성한 `scrypt:<salt>:<hash>` 형식의 salted password hash. Next.js 환경변수 치환과 충돌하는 `$`를 구분자로 사용하지 않는다.
- `STUDIO_AUTH_SECRET`: 같은 명령으로 생성한 세션 쿠키 HMAC 서명 secret

비밀번호 원문이나 hash를 클라이언트 코드에 넣지 않는다. 두 값은 Git에서 제외되는 `.env.local` 또는 배포 환경의 secret manager에만 저장한다. 인증 성공 시 서버가 `HttpOnly`, `SameSite=Lax` 세션 쿠키를 발급하며, `proxy.ts`가 로그인 페이지와 공개 정적 파일을 제외한 화면 및 API 접근을 확인한다. 쿠키에는 `Max-Age`나 `Expires`를 지정하지 않아 브라우저 종료 시 폐기하고, 다음 실행에서는 다시 로그인하게 한다. 서명 토큰 자체의 최대 유효시간은 12시간이다.

## 9. 검증과 Git

- 변경 범위에 맞춰 ESLint와 `tsc --noEmit --incremental false`를 실행한다.
- 레이아웃 또는 interaction 변경은 실제 브라우저에서 표시, scroll, resize, keyboard, overlay 범위를 확인한다.
- shared component 변경은 최소 두 개 이상의 소비 화면에서 회귀 여부를 확인한다.
- 무드보드 전용, 가구 전용, shared reference UI, 공용 navigation/UI 변경은 가능한 별도 커밋으로 나눈다.
- 사용자의 기존 변경을 덮어쓰거나 관련 없는 파일을 정리하지 않는다.

### 현재 작업 트리와 최근 검증

- 상세페이지 구현과 프로젝트 탭 관련 파일은 현재 아직 커밋되지 않은 상태다. `app/detail-page/`, `components/detail-page/`, `stores/useDetailPageStore.ts`, `system/detail-page/`는 untracked이므로 누락하지 않는다.
- `components/create/preparation/upload-card.tsx`도 새 공용 컴포넌트로 untracked 상태다.
- 기존 사용자 변경과 상세페이지 변경이 같은 작업 트리에 있으므로 reset, checkout 또는 일괄 정리를 하지 않는다.
- 최근 검증에서 `npx tsc --noEmit`, `npm run lint`, `npm run build`가 모두 통과했다.
- 브라우저에서 `/detail-page` 초기 화면의 58px 단계 header, typography class, 이미지 및 문서 accept 형식을 확인했다.
- Git 명령은 sandbox ownership 때문에 필요할 경우 `git -c safe.directory="C:/Users/jusmi/Desktop/+/LifeScape/workspace/itda-studio-v2.1" ...` 형식으로 실행한다. 전역 Git 설정은 변경하지 않는다.
