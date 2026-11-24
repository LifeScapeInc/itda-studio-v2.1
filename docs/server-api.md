# 클라이언트 API

현재 `server.main:app`에 등록된 API 명세다. 아래 예시는 서버가 `http://127.0.0.1:8000`에서 실행되는 경우이며, 클라이언트는 실제 서버 주소로 변경한다.

```bash
uvicorn server.main:app --host 127.0.0.1 --port 8000
```

대화형 명세는 `/docs`, OpenAPI JSON은 `/openapi.json`에서 확인할 수 있다. 현재 애플리케이션 코드에는 인증 처리가 구현되어 있지 않다.

| 메서드 | 경로 | 용도 |
| --- | --- | --- |
| GET | `/health` | 서버 상태 확인 |
| POST | `/api/v1/adarefsr/inference` | 참조 이미지 기반 초해상도 복원 |
| POST | `/api/v1/cut-evaluation/fidelity/predict` | 원본·결과 이미지의 Fidelity 점수 추론 |
| POST | `/api/v1/cut-evaluation/fidelity/feedback` | 사용자 피드백 저장 |
| POST | `/api/v1/cut-evaluation/predict` | 항목별 점수로 종합 점수와 분류 추론 |

## 공통 응답

성공은 `200 OK`다. 이미지 파일 업로드에는 `multipart/form-data`, 종합 점수에는 `application/json`을 사용한다. 파일은 서버에서 이미지로 읽을 수 있어야 한다.

| 상태 | 의미 |
| --- | --- |
| `422 Unprocessable Entity` | 필수값 누락, 허용되지 않는 값 또는 잘못된 이미지 |
| `409 Conflict` | 피드백의 원본 이미지가 이미 다른 제품 ID와 연결됨 |
| `503 Service Unavailable` | 요청한 추론 모델이나 피드백 데이터셋을 사용할 수 없음 |

명시적인 오류 응답 예시는 아래와 같다. 필드 검증 오류의 `detail`은 문자열이 아닌 오류 배열일 수 있다.

```json
{"detail":"Invalid image"}
```

## 서버 상태

### `GET /health`

별도 요청 본문은 없다. 모델 가중치가 로드되었거나 추론 가능한지는 확인하지 않는다.

**응답 — `application/json`**

```json
{"status":"ok"}
```

## AdaRefSR 이미지 복원

### `POST /api/v1/adarefsr/inference`

**요청 — `multipart/form-data`**

| 필드 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `lq_image` | 파일 | 예 | — | 저화질 입력 이미지 |
| `ref_image` | 파일 | 예 | — | 참조 이미지 |
| `lq_mask` | 파일 | 아니요 | 없음 | 입력 이미지 마스크 |
| `ref_mask` | 파일 | 아니요 | 없음 | 참조 이미지 마스크 |
| `scale` | 정수 | 아니요 | `4` | 확대 배율, 1 이상 |
| `tile_size` | 정수 | 아니요 | `0` | 타일 크기. 0이면 타일링을 사용하지 않음 |
| `tile_overlap` | 정수 | 아니요 | `64` | 타일 겹침 크기, 0 이상 |
| `ref_max_size` | 정수 | 아니요 | `0` | 타일 추론 시 참조 이미지 크기 제한. 0이면 `tile_size` 사용 |
| `op1` | 불리언 | 아니요 | `false` | 마스크 기반 참조 attention/출력 처리 활성화 |
| `op2` | 불리언 | 아니요 | `false` | 참조 마스크 기반 AICG 요약 활성화 |
| `op3` | 불리언 | 아니요 | `false` | 입력 이미지 저역통과 전처리 활성화 |
| `op3_t` | 숫자 | 아니요 | `0.5` | OP3 강도 조절값, 0~1. 1은 원본 입력 유지 |

타일링을 사용할 때 `tile_size`는 8 이상이면서 8의 배수여야 한다. `tile_overlap`도 8의 배수여야 하며 `tile_size`보다 작아야 한다. 타일링 사용 중 `ref_max_size`가 0이 아니면 8 이상이어야 한다. 마스크를 제공하면 각각 원본 입력·참조 이미지의 크기와 일치해야 한다.

```bash
curl -X POST http://127.0.0.1:8000/api/v1/adarefsr/inference \
  -F 'lq_image=@input.png' -F 'ref_image=@reference.png' \
  -F 'scale=4' -o result.png
```

**응답 — `image/png`**

복원 결과 PNG 파일의 바이너리를 반환한다. JSON으로 감싸지 않는다. 첫 요청에서 모델을 로드한다.

## Fidelity 점수

Studio의 컷 연출 `/api/generate`는 실제 생성된 이미지마다 아래 API를 호출하고 결과를 `fidelityEvaluations` 배열로 반환한다. 서버 주소는 `CUT_EVALUATION_BASE_URL`로 지정하며 기본값은 `http://localhost:8000`이다. 브라우저는 Studio 서버를 통해 평가 결과를 받는다. 각 컷의 점수·모델 버전 또는 평가 실패 상태는 생성 히스토리에 저장한다. 평가 실패 시에도 생성 이미지는 유지하며, 목업 이미지는 평가하지 않는다. BF·TQ 도입 전까지 평가 탭의 종합 점수는 Fidelity 점수를 사용한다.

### `POST /api/v1/cut-evaluation/fidelity/predict`

**요청 — `multipart/form-data`**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `original_image` | 파일 | 예 | 원본 이미지 |
| `generated_image` | 파일 | 예 | 생성 결과 이미지 |

```bash
curl -X POST http://127.0.0.1:8000/api/v1/cut-evaluation/fidelity/predict \
  -F 'original_image=@original.png' -F 'generated_image=@result.png'
```

**응답 — `application/json`**

```json
{"score":72.6,"model_version":"fidelity-v1.npz"}
```

- `score`: Fidelity 모델의 0~100 추정 점수.
- `model_version`: 실제 추론에 사용된 모델 파일명. 온라인 학습 후 변경될 수 있다.

이 API는 제품 영역 분할이나 평가 가능 여부 판정을 수행하지 않는다. 점수는 학습 라벨을 바탕으로 한 추정치이며, 사람의 합격 확률로 검증된 값은 아니다. 기본 모델은 `evaluator/models/fidelity-v1.npz`이며, 사용 불가 또는 호환되지 않으면 `503`을 반환한다.

## 사용자 피드백

### `POST /api/v1/cut-evaluation/fidelity/feedback`

**요청 — `multipart/form-data`**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `original_image` | 파일 | 예 | 원본 이미지 |
| `generated_image` | 파일 | 예 | 생성 결과 이미지 |
| `feedback` | 문자열 | 예 | `positive` 또는 `negative` |
| `reasons` | 문자열 목록 | 아니요 | `fidelity`, `bf`, `tq` 중 선택. 여러 개면 같은 필드명을 반복 |
| `product_id` | 문자열 | 아니요 | 동일 제품을 식별하는 ID. 지정 시 공백 문자열은 불가 |

- `positive`는 종합 긍정이며 Fidelity 긍정 라벨 `1`로 저장한다. `reasons`를 함께 보내면 `422`다.
- `negative`이면서 `reasons`에 `fidelity`가 있으면 Fidelity 부정 라벨 `0`으로 저장한다. 다른 사유를 함께 보낼 수 있다.
- `negative`이면서 `fidelity` 사유가 없으면 저장하지 않는다. 사유 목록이 비어 있어도 이 경우에 해당한다.
- `product_id`를 생략하면 동일한 원본 이미지에 연결된 기존 제품 ID를 재사용하고, 없으면 원본 이미지 해시로 식별한다. 동일 제품의 여러 원본 사진을 하나의 제품으로 다루려면 동일한 `product_id`를 전달해야 한다. 동일 원본에 기존과 다른 ID를 지정하면 `409`다.

**Fidelity 부정 요청 예시**

```bash
curl -X POST http://127.0.0.1:8000/api/v1/cut-evaluation/fidelity/feedback \
  -F 'original_image=@original.png' -F 'generated_image=@result.png' \
  -F 'feedback=negative' -F 'reasons=fidelity' -F 'reasons=bf' \
  -F 'product_id=chair-001'
```

**저장된 경우 응답 — `application/json`**

```json
{
  "stored": true,
  "sample_id": "0123456789abcdef0123456789abcdef",
  "product_id": "chair-001",
  "signal": "fidelity_negative_explicit"
}
```

긍정 피드백의 `signal`은 `overall_positive`다.

**Fidelity 사유가 없는 부정 피드백 응답**

```json
{"stored":false,"reason":"not_fidelity_related"}
```

저장된 피드백은 기본 데이터셋 `fidelity-v1`에 추가된다. 저장 후 백그라운드에서 온라인 학습 조건을 확인하며, 기본적으로 학습용 피드백 8건마다 후보를 학습하고 자동 적용한다. 응답은 학습 완료를 기다리지 않는다. 검증·시험용 제품에 배정된 피드백은 저장되지만 학습 배치에는 포함되지 않는다. 서버 측 `FIDELITY_FEEDBACK_DATASET`과 `FIDELITY_ONLINE_BATCH_SIZE`로 설정할 수 있다.

## 종합 점수

### `POST /api/v1/cut-evaluation/predict`

이미지 대신 이미 산출된 Fidelity, BF, TQ 점수와 상태를 전달한다. BF·TQ 점수 산출 API는 현재 등록되어 있지 않다.

**요청 — `application/json`**

최상위 `fidelity`, `bf`, `tq` 세 객체가 모두 필요하다. 각 객체의 필드는 다음과 같다.

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `status` | 문자열 | 예 | `scored`, `not_applicable`, `unavailable` |
| `score` | 숫자 또는 null | 조건부 | `scored`일 때 필수. 0~100. 다른 상태에서는 생략 또는 null |
| `reason` | 문자열 또는 null | 조건부 | `unavailable`일 때 공백이 아닌 문자열 필수 |

```json
{
  "fidelity": {"status":"scored","score":85},
  "bf": {"status":"not_applicable"},
  "tq": {"status":"scored","score":90}
}
```

예를 들어 평가 실패는 `{"status":"unavailable","reason":"segmentation_failed"}`로 전달한다. BF 미적용을 0점으로 전달하지 않는다.

```bash
curl -X POST http://127.0.0.1:8000/api/v1/cut-evaluation/predict \
  -H 'Content-Type: application/json' \
  -d '{"fidelity":{"status":"scored","score":85},"bf":{"status":"not_applicable"},"tq":{"status":"scored","score":90}}'
```

**응답 — `application/json`**

```json
{"score":75.2,"decision":"review","model_version":"v1"}
```

- `score`: 종합 모델의 사용자 채택 가능성 추정치에 100을 곱한 값.
- `decision`: `reject`, `review`, `accept` 중 하나. 점수가 모델의 낮은 임계값 미만이면 `reject`, 높은 임계값 이상이면 `accept`, 그 사이는 `review`.
- `model_version`: 사용된 종합 모델 버전.

종합 모델은 기본 제공되지 않는다. 서버에 `CUT_EVALUATION_MODEL`이 설정되지 않았거나 모델이 유효하지 않으면 `503`이다. 위 응답 값은 형식 예시이며 특정 점수나 임계값을 보장하지 않는다.
