# 브랜드 임베딩과 최신 이미지 평가

2026-11-25. [컷 평가 인계 문서](cut-evaluation-handoff.md)의 대표 벡터·집중도 방식에 맞춘 최종 구조다.
[단순화 migration](../supabase/migrations/20261125030000_current_brand_embeddings.sql)이 이전 migration의 5개 BF 테이블을 제거한다. 이미 적용한 이전 migration은 변경하지 않는다.

## 이미지 평가

평가는 모두 image_evaluations 한 테이블에서 관리한다. (workspace_id, asset_id)가 UNIQUE이며 이미지별 현재 한 행만 존재한다. fidelity, bf, tq, overall은 각각 NULL 또는 0~100 numeric이다. evaluation_type은 없다.

각 항목의 *_status, *_reason, *_version으로 미평가(NULL), scored, unavailable, not_applicable을 구별한다. scored는 점수와 버전 필수·사유 NULL이고, 실패/미적용은 점수 NULL·사유 필수다. Fidelity scored는 original_asset_id, BF scored는 brand_id가 필요하다. evaluated_at은 마지막 평가 갱신 시각이다. 재평가는 해당 항목을 UPDATE/UPSERT하고 다른 항목을 덮어쓰지 않는다.

migration은 기존 Fidelity 중 이미지별 최신 행을 보존하고, 기존 BF가 있다면 이미지별 최신 값만 병합한다. 이전의 status/score/model_version/reason은 fidelity_status/fidelity/fidelity_version/fidelity_reason으로 변경한다. 과거 점수, 진단, 평가 당시 Pool revision과 사례 스냅샷은 저장하지 않는다.

기존 history 저장 RPC의 Fidelity 요청 형식은 유지하지만 내부에서는 이미지별 UPSERT로 처리한다. 같은 평가의 반복 저장은 시각을 갱신하지 않는다. 앱 조회도 새 Fidelity 컬럼을 사용하며, BF만 있는 행을 Fidelity 결과로 표시하지 않는다. BF/TQ/overall을 실제 산출하여 저장하는 평가기 연결은 별도다.

## 브랜드 집계

brand_embeddings는 (workspace_id, brand_id) PK로 브랜드별 현재 한 행만 유지한다.

| 컬럼 | 내용 |
| --- | --- |
| pool_revision | 집계한 원본 Pool 변경 카운터 |
| encoder_signature | 실제 모델·전처리 조합의 식별자 |
| encoder_config | model_name, resolved_revision(실제 commit), feature_version, preprocessing_version 및 상세 설정 |
| aggregation_version | 현재 mean-pairwise-cosine-v1 |
| color_dimension / design_dimension | 기본 512 / 384 |
| positive_count / negative_count | canonical 이미지 중복 제거 후 각 그룹 사례 수 |
| positive_color_sum / positive_design_sum | 긍정 사례 단위 벡터 합계 |
| negative_color_sum / negative_design_sum | 부정 사례 단위 벡터 합계 |
| updated_at | 마지막 집계 반영 시각 |

평균 벡터 m=S/N, 대표 방향 b=S/||S||, mean_norm=||S||/N을 복원한다. N>1의 집중도는 clip((||S||²-N)/(N(N-1)),0,1)이다. N=1은 집중도 1과 concentration_estimated=false, N=0/합계가 거의 0이면 방향 없음·집중도 0이다. 파생값은 중복 저장하지 않는다.

색상·디자인 가중치는 각각 0.5이며 낮은 집중도의 가중치를 다른 축으로 넘기지 않는다. 점수는 clip(50+50E+-50E−,0,100), 점수식 버전은 prototype-concentration-v2다. 이전 top-k 점수와 호환되지 않는다. 예측은 사례 목록 없이 현재 집계 한 행만 읽는다(O(d)).

## 동기화와 접근

brands.pool_revision, brand_assets의 source/feedback_reasons와 기존 feedback RPC는 유지한다. 사례 추가·제거·라벨·출처 변경과 연결 자산의 checksum/status/deleted_at 변경 시 revision이 증가한다. 브랜드 이름·순서 변경은 증가시키지 않는다. NULL 라벨은 자동 분류하지 않고, negative feedback은 bf 사유가 있을 때만 반영한다.

Python 작업자가 사례별 벡터를 SQLite 캐시에 보관하고, 변경 사례의 기존 벡터를 차감하고 새 벡터를 합산한다. 동일 정규화 PNG SHA-256은 한 사례로 계산한다. 삭제·라벨 변경도 같은 캐시 트랜잭션에서 처리한다. 이 사례별 캐시는 Supabase에 저장하지 않는다. 로컬 캐시가 없거나 signature가 바뀌면 원격 원본과 라벨로 전체 재집계한다.

동기화 작업은 시작 시 브랜드 revision과 사례 목록을 읽고, 완료 후 같은 revision으로 brand_embeddings를 UPSERT한다. DB 트리거가 브랜드 행을 잠그고 현재 revision을 검사하므로 중간 변경은 SQLSTATE 40001로 거부된다. 합계 배열의 차원, 유한 값, 범위, 개수 대비 norm도 검증한다. signature 변경 시 기존 통계와 합산하지 않고 네 합계 전체를 교체한다. encoder_config는 별도 appearance_encoders 테이블 없이 집계 행에 저장한다.

평가기는 현재 브랜드 revision과 집계 revision, 활성 encoder_signature를 확인한다. 다르면 동기화 완료까지 평가를 보류한다. API 반환 전에 재확인하여 변경 중인 Pool의 결과는 재시도한다. pool_revision은 현재 최신성 검사용이며 과거 Pool을 복원하는 기능은 없다.

새 집계 테이블은 service_role 서버만 쓸 수 있고 인증 사용자 읽기는 workspace RLS를 따른다. service key는 서버에서만 사용하며 workspace/owner와 브랜드 접근 권한은 신뢰 가능한 서버 문맥에서 결정한다. R2 접근은 저장된 bucket/object_key를 사용하고 브라우저 세션 스트리밍 API를 Python에서 사용할 수 있다고 가정하지 않는다.

## 구현 범위와 검증

2026-11-25에 연결된 Supabase ITDA-Studio에 migration을 적용했다. REST 조회로 새 4항목 점수 컬럼과 brand_embeddings, 이전 BF 테이블 5개 제거를 확인했다. 기존 평가 14행이 현재 구조에서 조회되며 브랜드 집계는 아직 0행이다.

DB 구조, 기존 앱 Fidelity 조회·저장 호환성과 SQL 검증을 변경한다. Python SQLite API의 원격 동기화와 실제 모델 추출·적재는 아직 연결하지 않았으며 migration은 임의 벡터를 채우지 않는다.

최종 스키마 검증: initial_studio.sql, cloud_persistence.sql, current_brand_embeddings.sql. brand_appearance_embeddings.sql은 세 번째 migration까지만 적용한 과거 구조를 검증하는 테스트다.

빈 PostgreSQL DB에 migration 4개를 순서대로 적용하고, 기존 중복 Fidelity의 최신값 유지 및 BF 병합 fixture를 확인했다. SQL 검증 3종, TypeScript 검사, 변경 파일 ESLint, test:cloud 5개가 통과했다.
