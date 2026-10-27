# MEDIA FINDER — 자동 최신화 + 정기 조사

한국 광고 매체 탐색용 정적 웹사이트 + 예약 실행형 공개자료 수집기입니다. **기존 34개 매체, 검색/필터, 광고소개서 링크, 문의 경로, 소개서 업로드·자동 분류, 개인 매체 저장/백업** 기능을 유지합니다.

## 한눈에 보기

| 구성 | 상태 | 범위 |
| --- | --- | --- |
| 웹사이트 코드 | 완성 | `index.html`과 `vendor/`, `data/` |
| 일일 수집 작업 | 설정 파일 완성, 배포 후 활성화 | GitHub Actions 매일 **09:15 KST**(`00:15 UTC`), 실제 실행은 GitHub 사정에 따라 지연 가능 |
| 기존 매체 링크 확인 | 코드 완성, 배포 후 실행 | 34개 초기 매체 소개서/상품 안내 URL 접속 확인, 페이지 응답 해시 변경 감지 |
| 신규 매체 검색 | 코드 완성, 배포 후 실행 | Bing RSS 기본 시도, 네이버 검색 OpenAPI/Google Programmable Search API 선택 연결 |
| 자동 검수 | 운영상 필수 | 검색 후보는 **자동으로 확정 자료로 채택하지 않음**. 공식 여부, 연락처, 광고 단가는 사람이 확인 |
| ChatGPT 주간 조사 | 2026-10-27 활성화 | 매주 월요일 오전 8시 전후 KST, ChatGPT로 별도 조사 알림 전송 |

> 주간 ChatGPT 조사 결과가 GitHub 저장소에 자동으로 쓰이는 것은 아닙니다. GitHub Actions가 수행하는 일일 수집과 독립적으로 동작합니다.

## 사이트 실제 자동 업데이트 활성화: GitHub Pages 배포

이 ZIP 안에는 이미 `.github/workflows/media-finder-daily.yml`이 포함되어 있습니다. GitHub 연결 없이 ZIP만 실행하면 HTML은 작동하지만 예약 자동 수집은 작동하지 않습니다.

1. GitHub에 새 **public** 저장소를 생성합니다(예: `media-finder`).
2. 압축 해제한 폴더의 **내부 파일 전체**를 저장소 루트에 올립니다. `.github` 숨김 폴더도 누락되지 않아야 합니다.
3. GitHub 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**를 선택합니다.
4. 저장소 **Actions** 탭에서 `MEDIA FINDER - daily update and deploy` 워크플로를 처음에 **Run workflow**로 실행합니다.
5. 처음 성공하면 Pages 주소에 사이트가 올라가고, 이후 매일 한국시간 약 09:15에 `data/scan.json`이 업데이트되어 Pages 사이트에 반영됩니다.
6. **Settings → Actions → General → Workflow permissions**에서 저장소 콘텐츠 쓰기 권한이 필요한 경우 **Read and write permissions**를 허용해야 합니다. 조직 정책에 따라 권한이 제한될 수 있습니다.
7. GitHub Actions `schedule`은 기본 브랜치에만 적용되므로 저장소 기본 브랜치를 `main`으로 유지하세요. 방치한 공개 저장소의 스케줄은 GitHub 정책상 중지될 수 있고 작업이 지연될 수도 있습니다.

공식 GitHub 설명: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 네이버·구글 검색도 자동으로 연결하기 (선택)

Bing RSS는 별도 API 키 없이 기본 시도합니다. 검색 RSS는 응답이 제한·변경될 수 있어 **신규 발견이 보장되지 않습니다**. 신뢰성과 검색 범위를 확장하려면 GitHub 저장소의 **Settings → Secrets and variables → Actions → New repository secret**에 다음 값을 입력하세요.

| Secret 이름 | 연결 용도 |
|---|---|
| `NAVER_CLIENT_ID` | 네이버 검색 OpenAPI 발급 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 검색 OpenAPI 발급 Client Secret |
| `GOOGLE_CSE_API_KEY` | Google Programmable Search 관련 API 키 |
| `GOOGLE_CSE_ID` | Programmable Search Engine 검색 엔진 ID (`cx`) |

API의 사용 가능 여부, 요금제, 호출 제한은 각 제공자의 공식 안내를 먼저 확인하세요. 아무 키도 넣지 않아도 **기존 매체 소개서 링크 점검은 계속 작동**하며, Bing RSS 검색은 가능한 범위에서 실행됩니다.

**절대 API 키를 `index.html` 또는 `data/*.json`에 넣지 마세요.** 필요한 환경변수는 GitHub Actions에서 서버 측 수집 작업에만 전달됩니다.

## 데이터 업데이트 정책

- `data/catalog_seed.json`: 기존 34개 매체의 최초 등록 정보. 소스 관리자가 최신 자료를 **검증 후 이 파일을 편집**할 수 있습니다. 현재 `index.html`에도 동일한 34개 기본 자료가 내장되어 있습니다. 새 공식 확정 매체를 전 사용자에게 제공하려면 두 파일 또는 향후 마스터 카탈로그 구조를 함께 갱신해야 합니다.
- `data/scan.json`: 일일 작업이 생성. 각 소개서/상품 안내 URL의 최근 점검, HTTP 오류·자동 접근 제한, 응답 변경, 신규 검색 후보를 보관합니다. **링크 접근 가능 여부 ≠ 광고상품 운영 가능 여부 ≠ 공식 최신본 증명**입니다.
- `data/scan_demo.json`: 로컬 오프라인 테스트용 *미검증 예시*. 사이트는 이 파일을 읽지 않습니다.
- 브라우저에서 저장한 개인 매체/파일·즐겨찾기: 해당 브라우저 로컬 저장소(IndexedDB/localStorage)에만 저장됩니다. GitHub 서버나 다른 브라우저로 자동 동기화되지 않습니다. 'ZIP 전체 백업'을 수시로 이용하세요.
- 신규 후보: 제목과 URL로만 간단 분류한 **검토 대상**입니다. 담당자 이메일·광고 단가를 자동 생성하지 않습니다.
- 기존 링크 응답 해시가 바뀌면 ‘변경 감지·검토 필요’로 표시합니다. 그 원인이 소개서 개정인지 페이지 구성·광고/배너 변경인지는 사람이 확인해야 합니다.

## 개발자 실행 / 테스트

```bash
# 프로젝트 루트에서 로컬 서버 실행 (python 3)
python -m http.server 8080
# 브라우저에서 http://localhost:8080/ 열기

# 단위 테스트 (인터넷 불필요)
python -m unittest tests -v

# 실시간 링크 확인 + 발견 후보 수집: 인터넷 가능한 환경에서
python scripts/update_catalog.py

# 인터넷 없이 동작 흐름 예시 생성 (scan.json을 덮어쓰지 않음)
python scripts/update_catalog.py --offline-demo
```

## GitHub Pages 외 운영환경

GitHub Pages가 아니더라도 **cron 지원 호스팅**에서 매일 `python scripts/update_catalog.py`을 실행하고 생성된 `data/scan.json`을 정적 사이트와 같은 디렉터리에서 서빙하면 작동합니다. 브라우저 보안상 `index.html`을 `file://`로 여는 경우 자동 동기화 데이터를 읽지 못할 수 있습니다.

## 한계 / 향후 옵션

스캔형 PDF OCR, 파일 전체 버전 비교, 최신 광고상품 가격과 담당자 연락처의 신뢰도 높은 파싱, AI 문맥 분류, 검색 결과의 공식 출처 자동 확인, 사용자 간 계정·권한·동기화 등은 현재 제공되지 않습니다. 이 기능은 별도 백엔드/DB, 모델 API 또는 사람이 검토하는 관리 콘솔을 추가해야 합니다.
