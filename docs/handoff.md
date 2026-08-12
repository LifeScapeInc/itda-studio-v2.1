# ITDA Studio v2.1 Handoff

## 프로젝트 기준

ITDA Studio v2.1은 `C:\Users\jusmi\Desktop\+\LifeScape\workspace\itda-studio_v2`를 기반 참고 프로젝트로 사용한다.

앞으로 v2.1의 기능을 구현하거나 구조를 변경할 때는 **반드시 `itda-studio_v2`를 먼저 참고한다.** 특히 다음 항목은 v2의 기존 방식을 우선 확인하고, 특별한 사유가 없는 한 같은 패턴을 유지한다.

- Next.js, React, TypeScript 및 스타일링 기술 구성
- `app`, `components`, `lib`, `public`, `docs` 등의 파일 및 디렉터리 구조
- `package.json`, TypeScript, ESLint, PostCSS, Next.js 설정
- 컴포넌트 분리 방식과 파일 명명 규칙
- 상태 관리, API route, 데이터 타입 및 유틸리티 구성 방식
- README와 개발 문서의 작성 형식

Figma 디자인 명세가 v2의 기존 UI와 충돌하는 경우에는 Figma의 시각적 요구사항을 반영하되, 코드 구조와 구현 방식은 가능한 한 `itda-studio_v2`의 관례를 따른다. 새로운 패턴이나 의존성을 도입해야 한다면 기존 방식으로 해결할 수 없는지 먼저 검토하고, 도입 이유를 관련 문서나 코드 주석에 남긴다.

## UI 확장 원칙

새 페이지나 컴포넌트를 확장할 때는 먼저 v2.1에 이미 구현된 화면을 확인하고 색상, 타이포그래피, spacing 및 interaction 관습을 그대로 재사용한다. 임의의 값을 추가하기 전에 `app/globals.css`의 디자인 토큰과 유사 컴포넌트의 구현을 우선 확인한다.

- item grid의 기본 간격은 기존 가져오기 및 프로젝트 페이지와 동일하게 `var(--space-lg)`, 즉 24px을 사용한다.
- scrollable item grid wrapper에는 위아래로 `var(--space-3xs)`, 즉 4px padding을 둔다. 카드 hover 시 이동, outline 또는 border가 scroll 경계에서 잘리지 않도록 하기 위한 필수 여백이다.
- scroll 영역은 `workspace-content` 내부의 남은 높이만 차지하게 하며, 문서 전체가 대신 scroll되지 않도록 `min-height: 0`, flex sizing 및 내부 overflow를 함께 설정한다.
- 새로운 색상, 글꼴 크기, 여백 값을 직접 만들기보다 기존 color, typography, spacing 토큰으로 표현할 수 있는지 먼저 검토한다.

새 grid 화면을 구현할 때는 `customer-grid-scroll`/`customer-grid`와 `project-grid-scroll`/`project-grid`를 기준 구현으로 참고한다.

## 프론트엔드 구조 및 스타일

컴포넌트 스타일은 `styled-components`로 해당 컴포넌트의 TSX 파일 안에 함께 둔다. 컴포넌트별 CSS Module 파일을 새로 만들거나 화면별 selector를 `app/globals.css`에 추가하지 않는다. `globals.css`는 color, typography, spacing token과 reset 같은 foundation만 담당한다.

- 공통 shell/navigation은 `components/layout/`, 재사용 UI는 `components/ui/`에 둔다.
- 페이지 전용 컴포넌트는 `components/<페이지>/`에 둔다.
- 화면과 분리 가능한 formatter, validation, data definition, hook은 `system/<페이지>/`에 둔다.
- TSX 파일 하나는 하나의 공개 컴포넌트를 중심으로 구성한다. 페이지 파일은 feature 컴포넌트를 조립하는 역할만 담당한다.
- Zustand store는 `stores/`에 유지하고, store 외부에서도 재사용 가능한 domain 함수는 feature/system으로 분리한다.

## 작업 경로 격리

v2.1의 실제 작업 루트는 `C:\Users\jusmi\Desktop\+\LifeScape\workspace\itda-studio-v2.1`이다. 모든 코드 수정, 생성 파일, 빌드 산출물, 로그 및 임시 검증 파일은 이 작업 루트 또는 운영체제의 임시 디렉터리 안에서만 관리한다.

기준 참고 프로젝트인 `C:\Users\jusmi\Desktop\+\LifeScape\workspace\itda-studio_v2`는 **읽기 전용 참고 자료로 취급한다.** 사용자가 v2 자체의 변경을 명시적으로 요청하지 않는 한 이 경로에는 파일이나 디렉터리를 생성·수정·삭제하지 않는다. 특히 `.v21-*` 같은 기능별 스냅샷, 임시 빌드, 테스트 서버 로그 또는 v2.1 작업 산출물을 `itda-studio_v2` 안에 만들지 않는다.

명령이나 개발 서버를 실행하기 전에는 작업 디렉터리가 v2.1 루트인지 확인한다. 일시적인 복사본이 필요하면 운영체제의 임시 디렉터리를 사용하고, 검증이 끝나면 해당 산출물을 정리한다. 인접한 다른 workspace 디렉터리를 임시 저장소로 사용하지 않는다.

## 프론트엔드 상태 관리

프론트엔드의 전역 또는 여러 컴포넌트가 공유하는 상태에는 **가능한 한 Zustand를 사용한다.** 단순한 컴포넌트 내부 UI 상태처럼 공유할 필요가 없는 값은 React의 로컬 상태로 유지하며, 모든 상태를 불필요하게 전역화하지 않는다.

Zustand store는 프로젝트 루트의 `stores/` 경로에 모아 관리한다. 하나의 거대한 store에 모든 상태를 넣지 않고, 상태의 도메인과 용도에 따라 서로 다른 store로 분리한다. 예를 들면 계정, 고객 가져오기, 프로젝트 편집, UI 상태는 각각 별도의 store가 되어야 한다.

store hook의 이름은 관습에 따라 `use***Store` 형식을 사용한다.

- `stores/useAccountStore.ts`
- `stores/useImportStore.ts`
- `stores/useProjectStore.ts`
- `stores/useUIStore.ts`

각 store는 자신이 담당하는 상태, 해당 상태를 변경하는 action, 필요한 selector만 제공한다. 다른 도메인의 상태를 직접 포함하거나 서로 강하게 결합하지 않으며, 서버에서 가져온 데이터의 캐시와 일시적인 화면 상태도 용도에 맞게 구분한다.

## 현재 구현 범위

첫 화면은 Figma의 `파일-가져오기` 프레임을 기준으로 구현되어 있으며 다음 컴포넌트로 구성되어 있다.

- `NavigationTop`
- `NavigationLeft`
- `LabelTitle`
- `ItemCustomer`
- `Account`

색상, 타이포그래피, spacing 토큰은 `app/globals.css`에서 관리한다. Figma에서 내보낸 정식 SVG 에셋은 `public/assets/`에서 관리한다.

## ITDA NEO case 연동

가져오기 페이지의 고객 카드는 정적 placeholder가 아니다. v2.1의 서버 route인 `GET /api/integrations/cases`가 ITDA NEO의 `http://localhost:3002/api/integrations/cases`를 서버 간 인증으로 호출한다. 연동 secret은 `INTEGRATION_API_SECRET` 환경 변수에서만 읽으며 클라이언트에 노출하지 않는다.

클라이언트의 `useImportStore`는 v2.1 서버 route의 응답을 가져와 case를 이메일 주소별로 그룹화한다. 각 그룹은 `ItemCustomer` 하나로 렌더링하며 `name`은 담당자명, 그룹에 포함된 case의 수는 `n건`으로 표시한다. 원본 case 배열도 각 그룹에 유지하여 이후 case 선택 화면에서 사용할 수 있도록 한다.

고객과 case 선택 상태 역시 `useImportStore`에서 관리한다. `ItemCustomer` 선택 시 별도 route로 이동하지 않고 `workspace-content`만 해당 이메일의 case 목록으로 전환한다.

case 응답에 `project_exists: true` 또는 유효한 `project_id`가 있으면 이미 프로젝트가 존재하는 case로 분류하고 `ItemCase`의 disabled 상태로 표시한다. 현재 기본 응답 계약에는 이 값이 없으므로 서버가 이 신호를 제공하지 않으면 해당 영역은 비어 있다. `ButtonCreateProject`는 일반 case가 선택됐을 때만 표시하지만, 실제 프로젝트 생성 동작은 다음 구현 단계까지 연결하지 않는다.
