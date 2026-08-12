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
2. 설정 화면에서 직접 등록한 로컬 키

직접 등록한 키는 git에서 제외된 `workspace/metadata/settings.json`에 저장됩니다.
