# ITDA Studio (잇다 스튜디오)

ITDA Studio는 인테리어, 건축, 브랜딩 등 공간 디자인 및 기획을 위한 올인원 스튜디오 매니지먼트 플랫폼입니다. 프로젝트의 시작부터 완성까지, 그리고 고객 관리부터 리소스 수집까지 디자이너와 기획자가 필요로 하는 모든 기능을 하나의 웹 애플리케이션 안에서 제공합니다.

## 핵심 기능 (Core Features)

* **프로젝트 관리 (Projects & Space)**: 공간 기획 및 디자인 프로젝트를 체계적으로 관리할 수 있습니다. 각 공간별 세부 정보와 진행 상황을 한눈에 파악합니다.
* **무드보드 (Moodboard)**: 영감을 주는 이미지와 아이디어를 시각적으로 모아 레퍼런스로 활용할 수 있는 무드보드 기능을 제공합니다.
* **라이브러리 및 제품 관리 (Library & Products)**: 디자인에 필요한 가구, 조명, 자재 등의 제품 정보를 관리하고, 내외부 라이브러리를 통해 빠르게 검색 및 적용할 수 있습니다.
* **고객 관리 (Clients)**: 클라이언트 정보를 등록하고, 프로젝트와 연동하여 효율적인 커뮤니케이션 및 히스토리 관리를 지원합니다.

## 기술 스택 (Tech Stack)

* **Framework**: Next.js (React 19)
* **Styling**: Tailwind CSS, PostCSS
* **Icons**: Lucide React
* **AI Integration**: OpenAI API 연동
* **Crawler**: Puppeteer (Node.js 기반)
* **Language**: TypeScript

## 시작하기 (Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

서버가 실행되면 [http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## OpenAI API 키 우선순위

이미지 생성 API 키는 다음 순서로 확인합니다.

1. 로컬 환경변수 `OPENAI_API_KEY`
2. 설정 화면에서 직접 등록한 키

직접 등록한 키는 `STUDIO_AUTH_SECRET`으로 암호화된 HttpOnly 쿠키에
브라우저별로 저장되며 서버에서만 복호화됩니다.

## OpenAI Platform 사용량 연결

계정 화면은 OpenAI의 Costs / Usage API에서 조직의 월별 비용(USD), 처리 이미지 수,
이미지 API 호출 수와 모델 응답 호출 수를 조회합니다. 로컬 토큰 기록으로 비용을 추산하지 않습니다.

1. OpenAI 조직 관리자가 [Admin API 키](https://developers.openai.com/api/docs/guides/admin-apis)를 발급합니다.
2. 로컬 서버의 `.env.local`에 `OPENAI_ADMIN_KEY=발급받은_관리_키`를 추가하고 서버를 다시 시작합니다.
3. 특정 OpenAI 프로젝트만 조회하려면 `OPENAI_USAGE_PROJECT_IDS=proj_첫번째,proj_두번째`를 추가합니다.
   비워 두면 모든 기기와 앱에서 발생한 조직 전체 사용량을 보여줍니다. ITDA의 로컬 프로젝트와 OpenAI 프로젝트는 서로 다릅니다.

관리 키는 이미지 생성용 `OPENAI_API_KEY`와 별개이며 브라우저, 일반 설정 입력란 또는
`NEXT_PUBLIC_*` 환경변수에 저장하면 안 됩니다. `/api/usage`는 기존 Studio 로그인을 요구하며,
로그인한 사용자는 서버에 설정한 조직/프로젝트의 사용량을 볼 수 있습니다.

조회 기간은 UTC 달력 기준이며 서버는 결과를 60초간 캐시합니다. OpenAI 집계 반영이 지연될 수 있습니다.
총 비용은 [Costs API](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs)의
모든 비용 항목을 포함합니다. 이미지/모델 응답 호출 수는 각 Usage API 항목이므로 전체 API 호출 수 또는 최종 청구서와 동일하지 않습니다.
키 미설정, 권한 오류 또는 API 장애는 0으로 표시하지 않고 연결/오류 상태로 안내합니다.
