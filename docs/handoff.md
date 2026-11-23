# ITDA Studio v2.1 Handoff

## 1. 작업 기준과 경로

- 실제 작업 루트는 `C:\Users\jusmi\Desktop\+\LifeScape\workspace\itda-studio-v2.1`이다.

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
- `useTokenUsageStore`: 실제 API 응답의 일별 토큰 합계와 호출 맥락별 사용 기록

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
- 상단 단계는 `기획안 → 템플릿 제작 → 템플릿 편집`의 세 단계다. 재료 준비는 별도 단계가 아니라 기획안 화면 왼쪽의 resizable panel이다.
- 단계 navigation 높이는 create panel header와 같은 58px이고, 완료 조건을 충족한 단계만 다시 열 수 있다.
- 재료 준비 panel은 대상 가구 이미지와 의뢰 요청서를 받는다. 두 업로드 영역은 같은 `UploadCard`를 사용한다.
- 가구 이미지는 1:1 crop 형태로 표시한다. 요청서는 PDF, DOC, DOCX, XLSX, TXT를 허용한다.
- 실제 모드의 `기획 생성`은 `/api/planning`을 호출한다. 요청서를 구조화한 뒤 세 개의 기획 후보와 레퍼런스를 생성하며, NDJSON stream의 `input`/`proposal` 진행 상태를 UI에 표시한다. mock mode에서는 `MOCK_PLANNING_CANDIDATES`를 즉시 사용하고 재료가 없어도 흐름을 확인할 수 있다.
- 기획안 후보는 이전/다음 버튼, dot navigator, 좌우 방향키로 이동한다. 콘셉트, 슬로건, 타깃 고객, 톤앤매너, 네이밍과 레퍼런스를 표시한다.
- 기획안을 확정하면 실제 모드는 `/api/template-structure`, mock mode는 `MOCK_TEMPLATE_STRUCTURES`를 사용하여 선택 기획안 기반의 타일 구조를 만든다.
- 템플릿 제작 단계는 왼쪽 타일 library, 가운데 wireframe, 오른쪽 inspector의 3-panel composer다. 양쪽 panel은 resize할 수 있고 타일 추가·삭제·선택·순서 변경을 지원한다.
- 이미지 타일은 히어로만 1컷, 나머지는 1~4컷 범위다. 생성된 `content`, `imageLayout`, `imageCount`는 각각 설명, 이미지 제작 지시, 컷 수로 변환된다.
- 타일 drag 중에는 반투명 drag image가 pointer를 따라가며 전체 cursor를 `grabbing`으로 통일한다. drag enter 시 로컬 preview 배열을 먼저 재배치하고 drop 시 Zustand 상태에 확정해 Figma auto-layout과 유사한 순서 미리보기를 제공한다.
- `페이지 생성`은 `/api/detail-page-generation`을 호출한다. 실제 모드에서는 확정된 기획 입력과 타일을 바탕으로 텍스트 레이아웃을 만들고 이미지 타일의 컷을 병렬 생성한다. mock mode에서는 고정된 `MOCK_GENERATED_DETAIL_PAGE`를 사용한다.
- 템플릿 편집 단계는 생성 완료 페이지를 표시하며 PNG/WebP 내보내기를 지원한다. 타일 구성을 수정하면 기존 생성 결과를 무효화하므로 다시 생성해야 한다.
- `useDetailPageStore`는 프로젝트별 workspace snapshot과 프로젝트에 속하지 않은 snapshot을 분리한다. 프로젝트 탭 전환 중 API 응답이 완료되어도 해당 프로젝트 snapshot에 결과를 저장한다.

### 계정과 토큰 사용량

- `/account`는 계정 정보와 API 토큰 사용량을 같은 scroll workspace에 표시한다.
- `useTokenUsageStore`는 실제 API 응답에 usage가 있을 때만 브라우저 localStorage에 일별 합계와 개별 호출 기록을 저장한다. mock 응답은 기록하지 않는다.
- 집계는 전체, 입력 텍스트, 입력 이미지, 출력 텍스트, 출력 이미지로 구분하며 월 선택 요약과 현재 연도의 월별 line chart를 제공한다.
- 현재 미커밋 작업은 호출 기록에 모델과 생성 맥락을 추가한다. 컷 생성은 콘텐츠 세트/앵글/품질/비율/레퍼런스 여부를, 상세페이지는 기획·템플릿·최종 레이아웃·최종 이미지 단계를 구분한다.
- 호출 맥락별 통계는 호출 횟수와 1회 평균 토큰을 보여준다. 기존 일별 합계 데이터는 유지되지만 이 기능 추가 전에 저장된 사용량에는 맥락별 기록이 없다.

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
- 컷 생성의 `/api/generate`는 key가 없을 때도 mock 결과로 fallback한다. 상세페이지의 세 API는 mock mode가 꺼져 있으면 필수 입력과 key가 모두 필요하며, 없을 경우 오류를 반환한다.
- 상세페이지의 기획, 템플릿 구조와 최종 레이아웃 모델은 `OPENAI_PLANNING_MODEL`로 override할 수 있고 기본값은 `gpt-5.6-terra`다. 이미지 모델 설정은 `system/server/image-settings.ts`를 단일 기준으로 사용한다.

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

- 상세페이지, 프로젝트 탭과 공용 `UploadCard`는 이미 tracked 상태다. 기존 handoff에 적혀 있던 untracked 주의 문구는 더 이상 유효하지 않다.
- 현재 작업 트리에는 토큰 사용량의 호출 맥락·모델별 평균 통계를 확장하는 미커밋 변경이 있다. 관련 범위는 `components/account/`, `stores/useTokenUsageStore.ts`, create/detail-page API client와 server usage 변환, `system/usage/`다.
- 현재 변경에는 새 파일 `components/account/token-usage-section-heading.tsx`, `components/account/token-usage-statistics.tsx`, `system/usage/token-usage-context.ts`, `system/usage/token-usage-statistics.ts`가 포함된다. reset, checkout 또는 일괄 정리로 누락하지 않는다.
- `docs/handoff.md`도 현재 상태 갱신으로 수정되어 있다.
- 2026-08-24 현재 미커밋 변경을 포함해 `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build`가 모두 통과했다. 이번 handoff 갱신에서는 별도의 브라우저 interaction 회귀 검사는 실행하지 않았다.
- Git 명령은 sandbox ownership 때문에 필요할 경우 `git -c safe.directory="C:/Users/jusmi/Desktop/+/LifeScape/workspace/itda-studio-v2.1" ...` 형식으로 실행한다. 전역 Git 설정은 변경하지 않는다.

## 10. 컷 연출 평가·관제 설계 (2026-11-18)

이 절은 논의된 설계 방향이며 구현 완료 현황이 아니다. 아래에서 명시한 미확정 사항을 임의로 확정하지 않는다.

### 목표와 평가 구조

- 배치 생성된 각 결과 이미지에 Fidelity, BrandFit, TQ 점수를 산출하고, 종합 점수로 채택·제외를 결정한다. 회색지대는 사용자가 직접 판단한다.
- 각 평가 모듈은 점수와 평가 가능 여부를 제공한다. Fidelity 등 개별 항목에서 조기에 최종 적합·부적합을 결정하지 않는다.
- 종합 판단에는 logistic regression을 사용하는 방향이다. 입력은 개별 평가 점수와 Pool 적용 여부·평가 가능성 등의 조건을 사용하는 구성이 제안되어 있다. 원본·결과의 DINO 특징을 종합 모델에 직접 넣을지는 확정하지 않았다.
- 종합 logistic regression의 출력을 점수로 사용할 경우 의미는 사용자 채택 가능성이다. 절대적 품질이나 구매전환 확률과 혼동하지 않는다.
- 납품 후 고객사의 이미지 사용·노출·구매 데이터를 직접 확보하기 어려우므로 CTR·구매전환 예측은 현재 관제의 핵심 평가에서 제외한다.
- GPT Decisions API의 점수 산출 후 후보정 방식은 사용자가 적절하지 않다고 판단해 보류했다.

### 사용자 피드백

- 결과물별로 적합·부적합을 선택한다. 부적합이면 Fidelity, BrandFit, TQ 중 사유를 하나 이상 선택한다. 하위 항목은 선택하지 않는다.
- 최종 적합은 종합 모델의 긍정 라벨, 최종 부적합은 부정 라벨이다. 특정 input/output 특징에 직접 긍정 가중치를 추가하는 것이 아니라 사례를 저장하고 학습 시 모델 계수를 업데이트한다.
- 부적합 사유로 선택된 항목에만 명시적인 부정 신호를 전달한다. 선택하지 않은 항목은 긍정으로 간주하지 않는다.
- 최종 적합을 모든 평가 항목의 명시적 긍정으로 간주하지 않는다. 개별 모듈에 약한 긍정으로 활용할지는 학습 정책으로 검증해야 한다.
- 이진 피드백을 임의로 0점·100점의 연속 점수 정답으로 변환하지 않는다. 항목별 허용 가능성을 학습할지, 별도 초기 점수 라벨을 확보할지는 미확정이다.
- 피드백에는 원본·결과, 생성 조건, 선택 사유, 원래 평가값, Pool·평가 모델·전처리 버전을 연결해 저장한다.
- 피드백은 즉시 저장하되 매 클릭마다 운영 모델을 교체하지 않는다. 기존 사례와 함께 재학습하고 별도 검증 후 버전을 적용하는 방향이다. 회색지대 외 자동 처리 사례도 일부 검수해 학습 데이터 편중을 확인한다.

### BrandFit

- 브랜드·채널 맥락 정합성을 평가한다. 사용자가 프로젝트처럼 생성·삭제하고 이미지를 추가·제거할 수 있는 브랜드 레퍼런스 Pool을 도입한다.
- Pool에는 브랜드 제품 이미지와 연출 이미지를 넣을 수 있다. 제품 맥락과 연출 스타일의 역할을 구분한다.
- 생성마다 Pool을 선택하며 생성 방향과 BrandFit 평가의 근거로 함께 사용한다. Pool을 지정하지 않으면 생성·평가 모두에 반영하지 않는다.
- Pool 미지정은 BrandFit 0점이 아닌 미적용이다. 미적용 시 종합 점수 처리 방식(가중치 재정규화, 별도 모델 등)은 구현 시 확정해야 한다.
- BrandFit을 사유로 제외한 결과는 해당 Pool의 부정 검수 사례에 연결한다. 사용자 기준 레퍼런스와 부정 사례는 구분한다.
- 초기 실패 사례 하나가 브랜드 정의를 크게 바꾸지 않도록 영향 제한·누적 반영 등 보정 정책이 필요하다. 구체적인 점수 산식과 보정 방식은 미확정이다.
- 생성·평가·피드백에 실행 시점 Pool 버전을 연결한다. 수정·삭제 이후에도 기존 판단의 근거를 보존할 정책이 필요하다.
- 평가 목표는 레퍼런스의 구도 복제가 아닌 브랜드 표현 범위와의 정합성이다. 채널 규격의 세부 분리 범위는 미확정이다.

### Fidelity

- 원본 가구의 형태·구조·색상·재질 등 객체 보존 정도를 평가한다. DINOv2 특징 추출과 작은 예측층을 결합하는 방향이며 정확한 점수 정의·학습 방식은 미확정이다.
- 원본·결과 제품 영역을 동일한 DINOv2로 인코딩하고 특징을 concat하는 구상이 있다. 절댓값 차이·원소별 곱 등의 비교 특징 추가는 실험 후보다.
- DINOv2 자체는 ITDA용 무결성 점수를 제공하지 않는다. 초기 검수 데이터로 예측층을 학습해야 한다. 연속 보존 점수 회귀와 이진 피드백 기반 허용 확률 분류는 서로 다른 목표다.
- 전체 연출 배경이 비교에 섞이지 않도록 의뢰 제품을 식별·분할하는 방향이다. rembg만으로 대상 제품 하나를 정확히 남길 수 있다고 가정하지 않는다. 분할 오류와 제품 가림을 평가 실패와 구분한다.
- 원본·결과는 동일한 중립 배경, 종횡비 유지, 일관된 크롭·여백·해상도 조건으로 처리한다. RGB를 기본으로 유지하고 grayscale은 보조 실험 후보로 둔다. 실제 제품 색상 변경 정보를 제거하지 않는다.
- 같은 제품도 시점·각도·앞뒤 관계가 달라질 수 있다. 전체 특징 concat만으로 정상 원근 변화와 실제 변형을 안정적으로 구분한다고 가정하지 않는다.
- 국소 부품 변형을 위한 패치·부위 비교, 공통 가시 부위 비교, 다중 시점 참조는 보완 후보다. 원본에서 보이지 않는 면은 충실도를 검증할 수 없다.
- Fidelity 점수와 비교 가능성(시점 차이·가림·해상도·분할 상태)을 분리한다. 확인 불가를 낮은 무결성으로 치환하지 않는다.
- 검증셋은 제품 단위로 분리하고, 시점은 달라도 정상인 컷과 시점은 비슷하지만 제품이 변형된 컷을 포함한다.

### TQ (Technical Quality)

- 기존 VMD 미감 평가는 사용하지 않는다. 얼마나 예쁜지가 아니라 과도한 이미지 특성으로 인한 기술적 결함만 CV로 진단한다. VLM 투입 없이 처리 가능한 범위를 목표로 한다.
- 허용 범위에서는 감점하지 않고 극단적인 경우에만 감점한다. TQ만으로 최종 제외를 결정하지 않는다.

| 진단 항목 | CV 측정 후보 | 주의점 |
| --- | --- | --- |
| 과도한 채도 | HSV 고채도 픽셀 비율·채도 분포 | 원래 선명한 제품·소품을 결함으로 오인하지 않음 |
| 과도한 밝음·어두움 | 휘도 분포·극단 밝기 영역 비율·국소 대비 | 흰 배경·검은 제품만으로 노출 결함을 단정하지 않음 |
| 과도한 흐림 | Laplacian 분산·경사도·고주파 성분 | 의도적 배경 흐림과 구분하고 주제품 중심 검사 |

- 전체 이미지와 주제품 영역을 구분해 측정하고, 원본 제품 특성과 측정 해상도를 고려한다. 구체적인 임계값·감점 곡선·결합 산식은 미확정이다.
- 하위 사유 피드백이 없으므로 TQ 제외 한 건으로 채도·밝기·흐림 중 원인을 확정하거나 특정 임계값을 즉시 수정하지 않는다.
- 초기에는 고정 진단 규칙으로 점수를 산출하고, 측정 벡터와 TQ 부정 사례가 쌓이면 부적합 가능성을 학습하는 방식을 검증하는 안이 제안되어 있다. Fidelity와 마찬가지로 초기 데이터·긍정 라벨 정책이 필요하다.

### 실행 환경 방향

- Next.js는 UI, 브랜드 Pool·검수 관리, 평가 작업 요청과 결과 표시를 유지한다.
- 제품 분할·DINOv2·OpenCV·모델 학습은 Python 작업자로 분리하는 구성이 제안되어 있다. 배치 평가는 비동기 작업으로 처리하고 모델을 메모리에 유지한다.
- DINOv2 가중치를 고정하고 특징을 저장한 뒤 작은 예측층만 학습하는 방식부터 검증한다. 원본 특징은 재사용한다.
- 16GB VRAM에서 DINOv2-S/B 기반 특징 추출·소형 예측층 학습은 현실적인 출발점이다. 생성 모델과 동시 GPU 점유, 해상도·배치 크기에 따른 실제 메모리 사용은 측정해야 한다. 전체 DINO 미세조정은 별도 판단한다.
