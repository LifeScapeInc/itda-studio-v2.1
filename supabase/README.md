# Studio database

## 적용

저장소 루트에서 실행합니다. `npx push`가 아니라 Supabase CLI의 `db push` 명령입니다.

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --remote --dry-run
npx supabase db push --remote
```

이미 연결된 프로젝트에서는 마지막 두 명령만 필요합니다. 기존 원격 DB에 같은 이름의
테이블이 있다면 먼저 migration 이력을 맞춰야 합니다. 이 초기 migration은 빈 앱 스키마를
대상으로 하며, 기존 테이블을 덮어쓰거나 삭제하지 않습니다.

## 서버 환경변수

`.env.local` 및 배포 서버에 다음 값을 설정합니다.

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
STUDIO_WORKSPACE_ID=YOUR_WORKSPACE_UUID
STUDIO_OWNER_USER_ID=YOUR_OWNER_UUID
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
R2_BUCKET_NAME=YOUR_BUCKET
R2_REGION=auto
```

Supabase Dashboard의 Settings → API Keys에서 `sb_secret_...` 키를 확인합니다.
기존 legacy `service_role` 키도 서버 키로 사용할 수 있습니다. 이 변수는 서버 전용이며
`NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 변경 후 서버를 재시작합니다.
API 방식 연결에는 DB 비밀번호/접속 문자열이 필요하지 않습니다.

현재 공용 비밀번호 로그인은 위 두 UUID로 고정된 워크스페이스/소유자에 연결됩니다.
API는 세션과 변경 요청의 Origin을 검증하며, 브라우저가 소유자나 워크스페이스를 지정할 수 없습니다.
개별 사용자 로그인으로 전환할 때는 인증된 사용자별 멤버십으로 이 범위를 결정해야 합니다.

## 앱 저장 경로

- `/api/studio/*`: 프로젝트, 생성 히스토리, 브랜드, 북마크, 편집 초안, 사용량, 저장된 의뢰를 조회·저장합니다.
- `/api/assets`: 이미지/의뢰서를 R2에 올리고 `assets`에 등록합니다. 업로드 확인 후에만 ready가 됩니다.
- `/api/assets/[id]`: 세션과 워크스페이스를 확인하고 비공개 R2 파일을 제공합니다.
- 생성 결과 이미지는 서버에서 R2에 저장한 다음 앱에 자산 URL을 반환합니다.
- 작업 초안은 입력 후 600ms, 생성 히스토리 변경은 400ms 지연하여 저장합니다.
  프로젝트 전환과 탭이 숨겨질 때도 저장을 시도합니다. 실패는 화면 알림과 재시도로 처리합니다.
- 저장 충돌은 버전 번호로 감지합니다. 다른 화면에서 수정한 데이터가 있으면 새로고침 후 이어서 작업합니다.
- 무드보드·가구·재료 탐색기는 Supabase 목록과 R2 이미지를 사용하며 public 파일 목록을 읽지 않습니다.
- 이전에 별도 보관한 사용량은 비공개 R2의 `browser-local-state.json`에서 읽어 DB 기록과 ID 기준으로 합칩니다.
  새 사용량은 `usage_records`에 직접 저장합니다. 과거 호출과 연결할 수 없는 기록에 가짜 AI 실행을 만들지 않습니다.
- IndexedDB/localStorage의 업무 데이터를 더 이상 읽거나 쓰지 않습니다. 테마·목업 모드·화면 배치 같은
  브라우저 개인 설정은 유지합니다. 열린 프로젝트 탭의 ID 목록만 별도 개인 설정으로 보관합니다.
  기존 로컬 데이터는 자동 삭제하지 않습니다.
- ITDA NEO 원본을 자동 조회하지 않습니다. 가져오기 화면은 Supabase에 저장된 의뢰를 조회합니다.

## 저장 규칙

- `public`에 앱 테이블 25개, `studio_private`에 검증·권한 함수가 생성됩니다.
- 브랜드 버전 및 generation_attempts 테이블은 없습니다. 가구 이미지는 furniture_items.images에 저장합니다.
- Supabase Auth 사용자를 public.users에 자동 등록합니다. 기존 앱의 비밀번호 로그인은
  Supabase Auth로 자동 전환되지 않습니다.
- 모든 테이블에 RLS를 적용합니다. authenticated는 소속 workspace를 읽을 수 있으며,
  bookmarks/editor_sessions만 본인 행을 직접 수정할 수 있습니다. 다른 쓰기는 서버의
  service_role로 수행하고, 서버에서 사용자·멤버십·역할을 검증합니다.
- workspace와 최초 owner 멤버는 서버에서 하나의 transaction으로 생성합니다.
  기본 사용자·조직·샘플 데이터는 migration에 넣지 않습니다.
- 프로젝트 없는 작업도 project_works를 만들고 project_id를 NULL로 둡니다.
  하단 히스토리는 반드시 work_id를 가지며 그 작업과 동일한 project_id를 사용합니다.
  조회는 `.is('project_id', null)` 또는 `.eq('project_id', projectId)`로 분리합니다.
- 작업 재개에 필요한 내용은 work_revisions.state에 저장합니다. schema_version을 올려
  문서 포맷 변경을 관리합니다. File 객체, blob URL, isGenerating 같은 일시 상태는 저장하지 않습니다.
- 작업당 초안은 하나이며 확정된 revision은 수정할 수 없습니다. 새 버전을 만들 때
  기존 초안을 확정한 후 다음 revision_number로 삽입합니다.
- 초안 수정은 반드시 `WHERE id = :id AND lock_version = :expected` 조건으로 UPDATE하고
  변경 행이 0개이면 충돌로 처리합니다. 트리거가 lock_version을 증가시킵니다.
- 컷 재생성은 generation_shots.asset_id를 새 자산으로 교체합니다. 과거 결과는 자동으로
  컷 버전으로 보관하지 않습니다. 북마크와 저장 버전이 참조하는 자산은 유지합니다.
- 평가는 asset_id + original_asset_id에 연결합니다. 재평가는 새 행을 추가하며,
  현재 결과 asset_id의 최신 평가를 표시합니다. 이전 결과의 점수를 재사용하지 않습니다.
- 생성 결과와 ai_runs 성공 전환은 같은 transaction에서 결과 자산을 먼저 연결합니다.
  호출마다 새 idempotency_key를 사용하며 같은 요청 재전송에는 같은 키를 사용합니다.
- generation_shot_inputs는 현재 결과의 입력입니다. 과거 작업 복원용 입력은
  work_revision_assets와 revision state에 따로 보존합니다.
- 브랜드 선택 당시 이름/가이드 등 필요한 값은 revision state 또는 shot settings에
  스냅샷으로 저장합니다. 브랜드 이미지 파일은 generation_shot_inputs로 보존합니다.
- 파일은 R2에 저장하고 assets에는 bucket/object_key를 기록합니다. 업로드 확인 후 ready로
  전환합니다. R2 버킷 생성, 접근 키, 서명 URL API, 프런트엔드 연결은 이 migration의 범위 밖입니다.
- 프로젝트·작업·히스토리는 deleted_at으로 논리 삭제합니다. 프로젝트를 삭제하며
  project_id를 NULL로 바꾸지 않습니다. 목록 API는 삭제된 조상도 검사해야 합니다.
- 자산의 논리 삭제/R2 실제 삭제는 서버에서 모든 참조(가구 JSON 포함)를 검사하고 수행합니다.
  work_revisions.state 같은 JSON 안의 파일은 반드시 work_revision_assets에도 등록합니다.
- 공용 라이브러리도 workspace 단위입니다. 익명 공개 읽기는 허용하지 않습니다.

## 검증

연결된 개발용 Supabase DB에서 migration을 적용한 뒤 다음 SQL을 실행할 수 있습니다.
검증 데이터는 transaction rollback으로 남기지 않습니다.

```powershell
psql "$env:TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/initial_studio.sql
psql "$env:TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/cloud_persistence.sql
npm run test:cloud
```

기존 localStorage/IndexedDB 데이터가 migration 실행만으로 이전되지는 않습니다.
로컬에서 보유한 데이터의 최초 이전과 별개로, 앱은 위 API를 통해 영구 저장합니다.
