# Ch.28 팀으로 쓰는 클로드

> **이 챕터를 마치면**: 팀 CLAUDE.md를 설계할 수 있고, 30/60/90일 도입 로드맵에 따라 팀 도입을 계획할 수 있다. GitHub Actions / GitLab CI / Agent SDK / Enterprise 배포(Bedrock·Vertex·Foundry) / Zero Data Retention 등 2026 팀 운영 도구를 구분할 수 있다.

---

## 배경: 혼자 쓰기에서 팀으로

Ch.27에서 개인 워크플로우를 설계했다. 그런데 팀에서 쓰려면 추가로 풀어야 할 문제가 있다.

- "팀원마다 CLAUDE.md가 다르면 결과도 다르다"
- "누가 어떤 명령을 실행했는지 추적할 수 있나?"
- "팀 전체 비용이 얼마나 나오는지 어떻게 관리하지?"

혼자 쓸 때는 자유가 장점이지만, 팀이 되면 **일관성·보안·비용**이 장점이 되어야 한다.

> **💭 생각의 흐름**
>
> **문제** — 팀원 5명이 각자 Claude Code를 쓰기 시작했다. 한 명은 bypassPermissions 모드, 다른 한 명은 CLAUDE.md도 없이 작업. 코드 스타일이 중구난방
> **질문** — "팀 전체가 같은 규칙으로 Claude Code를 쓰게 할 수 없나?"
> **시도** — 팀 CLAUDE.md를 만들어 git repo에 넣었다. 하지만 각자 로컬 설정이 달라서 결과가 달랐다
> **발견** — CLAUDE.md만으로는 부족하다. **규칙(rules/) + 설정(settings.json) + 스킬(skills/)** 전체를 공유해야 일관성이 생긴다
> **결론** — 팀 도입은 "도구 배포"가 아니라 **"작업 표준 수립"**이다

---

## 팀 CLAUDE.md — 최소화의 원칙

### 흔한 실수: 모든 것을 CLAUDE.md에 넣기

```
# ❌ 나쁜 팀 CLAUDE.md (300줄)
## 코딩 컨벤션
- 변수명은 camelCase...
- 함수는 20줄 이하...
- import 순서는...
## API 규칙
- 모든 요청에 인증 체크...
- 에러 응답은 { error: ... }...
## 테스트 규칙
- 커버리지 80% 이상...
## 프론트엔드 규칙
...
## 백엔드 규칙
...
```

문제:
- 길어질수록 클로드가 주의를 분산한다 (Ch.9 Attention Budget)
- 모든 작업에 모든 규칙이 로드된다 (토큰 낭비)
- 규칙이 충돌할 수 있다 (프론트 규칙이 백엔드 작업에 적용)

### 올바른 접근: CLAUDE.md는 최소, rules/로 분산

```
# ✅ 좋은 팀 CLAUDE.md (30줄)

## 이 프로젝트
- B2B SaaS 제품. Next.js + Python FastAPI.
- 모노레포: /frontend, /backend, /shared

## 필수 규칙
- PR 전에 반드시 테스트 통과
- 보안 관련 변경은 #security 채널에 알림
- 커밋 메시지: Conventional Commits 형식

## 참고
- 상세 규칙은 .claude/rules/ 참조
- API 명세: docs/api-spec.yaml
```

**규칙은 .claude/rules/에 분산:**

```
.claude/
├── CLAUDE.md                    ← 30줄, 핵심만
├── rules/
│   ├── api.md                   ← API 관련 규칙
│   ├── frontend.md              ← 프론트엔드 규칙
│   ├── backend.md               ← 백엔드 규칙
│   ├── testing.md               ← 테스트 규칙
│   └── security.md              ← 보안 규칙
├── settings.json                ← 팀 공통 설정
└── skills/
    └── code-review/             ← 팀 공유 스킬
```

**path-specific rules 활용:**

```yaml
# .claude/rules/api.md
---
paths:
  - "backend/api/**/*.py"
  - "backend/handlers/**/*.py"
---
# API 규칙
- 모든 요청 body는 Pydantic으로 검증
- 응답 형식: { "data": ..., "error": null }
- 내부 스택 트레이스 노출 금지
- rate limiting은 middleware에서 처리
```

이렇게 하면 API 파일을 수정할 때만 API 규칙이 로드된다. 프론트엔드 작업 시에는 보이지 않는다.

---

## 30/60/90일 도입 로드맵

팀 도입을 "한 번에" 하면 실패한다. 3단계로 나눠야 한다.

### 0~30일: 개인 탐색기

```
목표: 팀원 각자가 Claude Code에 익숙해지기

해야 할 일:
  □ 각자 글로벌 CLAUDE.md 작성 (Ch.5)
  □ 작은 자동화 3~5개 시도 (커밋 메시지 작성, 코드 설명, 테스트 생성)
  □ /cost로 비용 감각 익히기
  □ 한 주에 한 번 "이번 주 클로드로 뭘 했나" 공유

하지 말아야 할 일:
  × 팀 CLAUDE.md 강제
  × bypassPermissions 모드 사용
  × MCP 서버 마구 연결
  × "클로드로 전부 다 하자" 분위기

핵심 지표:
  · 팀원 중 80%가 매일 Claude Code 사용
  · 각자 자신만의 CLAUDE.md 보유
```

### 31~60일: 팀 표준기

```
목표: 공통 규칙과 도구 세팅

해야 할 일:
  □ 팀 CLAUDE.md 초안 → PR로 리뷰
  □ .claude/rules/에 경로별 규칙 추가
  □ 팀 공유 Skill 3~5개 (code-review, test-gen, doc-gen 등)
  □ settings.json 통일: permissions, allow/deny 목록
  □ Hook 추가: Edit 후 자동 lint, PR 전 테스트
  □ /team-onboarding 🆕 으로 팀 온보딩 가이드 초안 생성 (Ch.26)

하지 말아야 할 일:
  × 규칙을 너무 세밀하게 (초기에는 큰 틀만)
  × 모든 작업을 Skill로 만들기 (자주 반복하는 것만)
  × 개인 설정 금지 (settings.local.json은 개인 영역)

핵심 지표:
  · CLAUDE.md와 rules/가 git에 커밋
  · 팀 공유 Skill 3개 이상 작동
  · Hook으로 자동 검증 1개 이상 활성화
```

### 61~90일: 자동화 확장기

```
목표: 반복 작업 자동화, 거버넌스 수립

해야 할 일:
  □ Scheduled Task / Routines 🆕 / /loop으로 반복 자동화 2~3개
  □ 코드 리뷰 자동화 파이프라인 (GitHub Actions / GitLab CI / Code Review App)
  □ /autofix-pr 🆕 을 팀 린트 대응에 도입 (Ch.26)
  □ Plugin 도입 기준 수립
  □ MCP 서버 최소 연결 (필요한 것만)
  □ Channels 연동 (Slack 1급 연결 🆕, webhook 등 외부 이벤트 수신)
  □ 비용 리뷰: 주간/월간 /cost + console 대시보드 비교
  □ 보안 감사: Audit Logs로 누가 어떤 명령을 실행했는지 확인
  □ ZDR · Data usage · Server-managed settings 🆕 검토 (규제 필요 시)

핵심 지표:
  · 자동화된 반복 작업 3개 이상
  · 월간 팀 비용 추적 시작
  · 보안 사고 0건
```

### 로드맵 요약

```
           0일        30일        60일        90일
            │──────────│──────────│──────────│
개인 탐색   │▓▓▓▓▓▓▓▓▓▓│          │          │
팀 표준     │          │▓▓▓▓▓▓▓▓▓▓│          │
자동화 확장  │          │          │▓▓▓▓▓▓▓▓▓▓│
            │          │          │          │
CLAUDE.md   │  개인용   │  팀 공용  │  최적화   │
rules/      │   없음   │  3~5개   │  경로별   │
Skills      │   없음   │  3개~    │  5개~    │
Hooks       │   없음   │  1개~    │  3개~    │
자동화       │   없음   │   없음   │  3개~    │
```

---

## 보안과 거버넌스

### Permission 관리

```
팀에서 권장하는 permission 설정:

settings.json (팀 공유):
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(curl * | bash)"
    ]
  }
}

settings.local.json (개인):
  · 추가 allow 가능
  · deny는 팀 설정을 오버라이드 불가
```

**bypassPermissions 주의사항:**

```
bypassPermissions 모드:
  · 모든 도구를 승인 없이 실행
  · 보호된 경로(.env, credentials 등)만 제외
  · 개인 작업에서는 편리하지만, 팀에서는 위험

팀 권장:
  · 기본 모드: default 또는 acceptEdits
  · bypassPermissions는 신뢰할 수 있는 자동화에만
  · 신입 팀원은 반드시 default 모드로 시작
```

### 감사 로그와 데이터 관리

Enterprise 플랜에서 사용 가능한 거버넌스 도구:

```
Audit Logs:
  · 누가 언제 어떤 도구를 실행했는지 기록
  · Enterprise 조직의 관리자가 확인 가능
  · 보안 사고 조사, 규정 준수 감사에 사용

Compliance API:
  · Audit Logs에 프로그래밍 방식으로 접근하는 API
  · 자동화된 규정 준수 모니터링에 사용
  · Enterprise 전용, NDA 기반 접근

Data Exports:
  · 대화 입력/출력을 내보내기
  · 조직의 Primary Owner가 실행 가능
  · 규정 준수(compliance) 요구사항 충족

Regulated Workload 제한:
  · 의료, 금융 등 규제 산업에서는 추가 제약이 적용될 수 있음
  · Claude의 출력을 최종 의사결정에 단독 사용하지 말 것
  · 민감 데이터 처리 시 조직의 보안 정책을 반드시 확인
```

### CI/CD 연동 🆕 — 세 가지 공식 경로

2026에 팀 CI 연동이 **공식 제품군**으로 정리됐다. 세 경로의 용도가 다르니 먼저 구분하자.

| | **GitHub Actions** | **GitLab CI/CD** | **GitHub Code Review** 🆕 |
|---|---|---|---|
| **형태** | Action 마켓플레이스에 공식 액션 | GitLab 내장 integration | GitHub App (설치형) |
| **트리거** | 워크플로우 정의에 따라 | .gitlab-ci.yml | PR 열림 / push / 코멘트 멘션 |
| **설정 난이도** | 중간 (.yml 작성) | 중간 | 낮음 (App 설치만) |
| **주요 용도** | PR 자동 리뷰, 자동 테스트 생성, 빌드 실패 디버그 | 동일 (GitLab 조직용) | 리뷰 전용 (빠른 시작) |
| **비용 제어** | 러너 시간 + 토큰 | 러너 시간 + 토큰 | 토큰 (App이 관리) |

### GitHub Actions 예시

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          mode: review
          token: ${{ secrets.ANTHROPIC_API_KEY }}
```

핵심 포인트:
- **`--print` 모드**가 내부적으로 쓰임 (비대화형)
- **secrets**에 API 키 보관, 절대 레포에 커밋 금지
- **토큰 상한**을 워크플로우에 명시 (`max-tokens` 옵션)

### GitHub Code Review App 🆕

가장 빠른 시작 경로다. `.yml`을 쓸 필요 없이 **GitHub App을 레포에 설치**하면 끝.

```
✅ 적합:
- "복잡한 설정 없이 PR 리뷰부터 시작"하고 싶을 때
- `.yml` 경험 없는 팀

❌ 한계:
- 커스터마이즈 여지가 좁음 (정해진 리뷰 모드)
- 자동 테스트 생성 같은 확장은 안 됨 → 그때는 Actions로
```

### GitLab CI/CD

GitLab을 쓰는 조직을 위한 1급 통합. `.gitlab-ci.yml`에 Claude 단계를 추가하는 방식. **온프레미스 GitLab Self-Managed**에서도 동작한다는 점이 GitHub Actions와의 큰 차이.

### 공통 주의사항

```
· CI 환경에서는 --print 모드 (비대화형)
· API 키: 환경 변수 / Secrets로 주입, 레포 커밋 금지
· 토큰 상한: 폭주 방지를 위해 max-tokens 설정 필수
· 권한: CI용 계정/토큰 권한을 최소화 (PR 커밋, 코멘트만)
· Audit Logs: CI 세션도 조직 감사 로그에 남는다는 점 공지
```

---

## Agent SDK 🆕 — 클로드를 내 제품에 내장하기

CI 연동은 "CI가 클로드를 호출"한다. **Agent SDK**는 반대 방향이다 — **내 코드가 클로드 에이전트를 만들어서** 내 서비스 안에 집어넣는다.

### 두 가지 SDK

```
@anthropic-ai/agent-sdk (TypeScript)
anthropic.agent.sdk       (Python)
```

각각 같은 기능을 두 언어로 제공한다. 핵심 능력:
- 에이전트 정의 (프롬프트 + 도구 목록)
- 세션 관리
- 도구 실행 루프
- 스트리밍 응답

### Agent SDK vs Claude Code CLI vs API

| | Claude Code CLI | **Agent SDK** 🆕 | Anthropic API |
|---|---|---|---|
| **누가 쓰나** | 개발자 본인 (터미널에서) | 개발자 제품 (서비스 코드 안) | 개발자 제품 (저수준) |
| **추상 수준** | 높음 (슬래시 명령) | 중간 (에이전트 객체) | 낮음 (messages.create) |
| **도구 루프** | 자동 | 자동 (SDK가 처리) | 수동 (직접 구현) |
| **파일 시스템** | 로컬 파일 접근 | 제공 도구에 따라 | 직접 구현 |

### 적합한 사용 사례

```
✅ Agent SDK가 맞는 경우:
- 내 SaaS에 "AI 도우미" 기능을 붙임
- 커스텀 에이전트 (내부 DB 조회 + 답변 + 수정 제안)
- CI가 아닌 서비스에서 클로드 세션을 운영

❌ 불필요:
- 내가 쓰는 개인 작업 (CLI로 충분)
- 간단한 프롬프트 한두 번 (API 직접 호출이 가볍다)
```

### 이 교재에서의 위치

Agent SDK는 **이 교재의 범위를 벗어난다**. 클래스/모듈 설계가 필요하고, 프로덕션 코드가 대상이기 때문. 다만 "이런 것이 있다"는 **존재 인지**는 필요하다 — 내가 만드는 제품에 클로드가 들어갈 가능성이 있으면 가장 먼저 찾아볼 도구다.

**한 줄**: CLI = 내가 쓴다. SDK = 내 서비스가 쓴다. API = 서비스가 더 섬세하게 쓴다.

---

## Enterprise 배포 🆕 — 클라우드 공급자 위에서 돌리기

규제 산업(금융·의료·공공)은 **데이터를 Anthropic 서버가 아닌 우리 조직의 클라우드 테넌트 안에서** 처리해야 할 때가 있다. 2026에 세 가지 공식 배포 경로가 정리됐다.

### 세 배포 경로

| | **Amazon Bedrock** | **Google Vertex AI** | **Microsoft Foundry** |
|---|---|---|---|
| **호스트** | AWS 계정의 Bedrock | GCP 프로젝트의 Vertex | Azure 테넌트의 Foundry |
| **적합 대상** | AWS 생태계 기업 | GCP 생태계 기업 | Azure 생태계 기업 |
| **데이터 경로** | AWS 리전 내 | GCP 리전 내 | Azure 리전 내 |
| **인증** | AWS IAM | GCP IAM | Azure AD |
| **기존 컴플라이언스** | AWS의 HIPAA/SOC2 재사용 | GCP의 컴플라이언스 재사용 | Azure의 컴플라이언스 재사용 |

### 왜 이런 옵션이 필요한가

```
기본 API 경로:
  내 서버 → Anthropic API → 모델 실행 → 응답
  (데이터가 Anthropic 쪽으로 이동)

Enterprise 배포:
  내 서버 → 내 클라우드 안의 Claude → 응답
  (데이터가 내 조직 경계를 벗어나지 않음)
```

이 차이가 **규제 준수와 계약**에서 결정적이다. 특히 **HIPAA, PCI, 공공기관 보안인증**이 필요한 곳.

### 이 교재에서의 위치

실제 배포는 DevOps·클라우드 팀의 일이라 여기서 상세 절차를 다루지 않는다. 다만 팀장/PM이라면 **"우리 데이터 정책상 일반 API를 못 쓸 수 있다"**는 가능성을 알고 시작해야 한다. 그때 찾아볼 키워드가 이 3개다.

---

## 🆕 인증 우선순위 체인

팀 환경에서 "내 로컬에서는 잘 되는데 CI에서는 안 돼요" 같은 문제 대부분은 **여러 인증 수단이 섞여서** 생긴다. Claude Code는 여러 인증 방식을 **정해진 순서대로 탐색**한다. 이 순서를 알면 트러블슈팅이 쉽다.

```
인증 탐색 우선순위 (위에서 아래로)

1. Enterprise 클라우드 공급자 (Bedrock / Vertex / Foundry)
   └── 환경변수: CLAUDE_CODE_USE_BEDROCK=1 등
       → 설정되면 여기서 종료, 아래 단계는 건너뜀

2. ANTHROPIC_AUTH_TOKEN
   └── 자체 LLM gateway / 프록시가 발급한 bearer 토큰

3. ANTHROPIC_API_KEY
   └── 기본 API 키 (가장 흔함)

4. apiKeyHelper
   └── settings.json의 "apiKeyHelper" 스크립트 실행 결과
       → 동적으로 키를 받아와야 할 때 (금고에서 읽기 등)

5. CLAUDE_CODE_OAUTH_TOKEN
   └── 장기 OAuth 토큰 (CI용 특수 케이스)

6. OAuth 세션 (대화형 로그인)
   └── claude login — 브라우저 플로우
```

### 자주 틀리는 패턴

```
❌ 문제: "로컬은 되는데 GitHub Actions에서 401"
원인: 로컬에는 OAuth 세션(6번)이, CI에는 API_KEY(3번)가 있는데 Actions에 secret 주입이 빠졌다

❌ 문제: "Bedrock 쓰기로 했는데 계속 Anthropic으로 요청이 감"
원인: CLAUDE_CODE_USE_BEDROCK이 세팅 안 된 상태 → 1번이 건너뛰어지고 3번으로 넘어감

❌ 문제: "gateway를 거쳐야 하는데 직접 anthropic.com으로 감"
원인: ANTHROPIC_AUTH_TOKEN이 아니라 ANTHROPIC_API_KEY로 세팅 → 3번이 먼저 잡힘
```

**팁**: 팀 표준으로 "CI는 `ANTHROPIC_API_KEY`, 개인은 OAuth, 규제는 Bedrock env" 같은 규칙을 쓰기 시작하기 전에 정해둔다.

---

## 🆕 Console 롤 시스템 — 누가 뭘 할 수 있나

Console(console.anthropic.com)은 조직 관리용 웹 콘솔이다. 2026년 기준 **네 가지 기본 롤**이 있다:

| 롤 | 할 수 있는 일 | 적합 대상 |
|----|-------------|-----------|
| **Primary Owner** | 모든 권한 + 조직 소유권 이전, 청구 계정 해지, Data Exports 실행 | 창업자/CTO |
| **Owner** | 조직 설정, 멤버 초대, Spend Limits 조정, **Server-managed settings** 수정 | 엔지니어링 리드 |
| **Claude Code** | Claude Code 전용 관리 (팀 CLAUDE.md, Skill 배포, 플러그인 승인) | DevRel·플랫폼 엔지니어 |
| **Developer** | API 키 발급·자기 사용량 확인, 워크스페이스 내 기본 작업 | 일반 개발자 |
| **UsageView** | 읽기 전용 — 사용량·비용 대시보드 열람만 | 재무·PM |

### 실무 권장 매핑

```
창업자 1명: Primary Owner
엔지니어링 리드 1~2명: Owner
플랫폼 팀 (ops/devrel): Claude Code
개발자 전원: Developer
재무·PM: UsageView
```

**주의**: Primary Owner는 조직당 **1명**. 양도는 가능하지만 "팀에 2명 두기"는 불가.

### Server-managed settings 변경 권한

앞서 Server-managed settings가 조직 레벨 설정이라고 했는데, **누가 고칠 수 있는지**는 다음과 같다:

| 설정 항목 | 수정 가능 롤 |
|----------|-------------|
| permissions.deny (조직 금지 도구) | Primary Owner, Owner |
| 기본 model, API endpoint | Primary Owner, Owner |
| ZDR 토글 | **Primary Owner 전용** |
| Data Exports 실행 | **Primary Owner 전용** |
| 팀 CLAUDE.md / 공유 Skill 배포 | Primary Owner, Owner, Claude Code |
| Spend Limits | Primary Owner, Owner |

가장 민감한 두 항목(ZDR 토글, Data Exports)은 Primary Owner 전용이다. 규제 대응이 필요하면 Primary Owner를 **법무/컴플라이언스와 협업 가능한 사람**에게 둬야 한다.

---

## 2026 보안·데이터 정책 확장

### Zero Data Retention (ZDR) 🆕

기본 API 경로에서도 **"우리 데이터를 Anthropic이 학습에 쓰지 마라 / 30일 이상 보관하지 마라"**를 공식 옵션으로 설정할 수 있다.

```
Zero Data Retention 설정 시:
  ✅ 대화 입력/출력이 모델 학습에 사용되지 않음
  ✅ 로그 보관 기간 최소화 (조직 정책에 따라 설정)
  ✅ 계약서/약관에 명시 가능 (규제 대응)

제약:
  ⚠️ 일부 디버깅 기능 제한 (로그가 없으니 문제 조사 어려움)
  ⚠️ 특정 모델/기능에서 제한될 수 있음 (사전 확인 필요)
```

**ZDR vs Enterprise 배포**:
- ZDR: Anthropic API를 쓰되 데이터 정책만 강화
- Enterprise 배포: API 자체를 내 클라우드 안에서 실행 → ZDR보다 더 강한 경계

### Data usage 정책 🆕

"내 조직이 보낸 대화가 어떻게 쓰이는지"를 **설정 가능한 항목**으로 드러냈다:

```
선택 가능한 정책:
  · 학습 사용 여부 (기본: 사용 안 함)
  · 저장 기간
  · 공유 범위 (개인 / 워크스페이스 / 조직)
```

조직 관리자가 console에서 한 번 설정 → 모든 팀원에게 자동 적용.

### Server-managed settings / LLM gateway 🆕

개인별 settings.json이 있지만, 조직 규모가 커지면 **중앙에서 관리**해야 할 필요가 생긴다.

```
Server-managed settings:
  · 조직 관리자가 settings.json 핵심 항목을 중앙에서 지정
  · 개인 settings.local.json으로 오버라이드할 수 있는 범위 제한
  · 예: permissions.deny, model 선택, API endpoint

LLM gateway:
  · 모든 요청을 거쳐가는 조직 프록시
  · 로깅, 감사, 비용 집계를 한 곳에서
  · 민감 키워드 필터링 가능
```

이 둘은 팀 20명 이상/규제 산업에서 거의 필수. 개인/소규모 팀에서는 과한 설정이다.

### Regulated workload 재강조

```
의료·금융·공공 등 규제 산업에서:
  · Claude의 출력을 최종 의사결정에 단독 사용 금지
  · 민감 데이터 식별 → 마스킹 후 전송
  · 감사 로그·데이터 내보내기 기능 반드시 켜기
  · 법무/컴플라이언스 검토 후 도입
```

---

## 팀 비용 관리

### Token Budget — 팀 비용 한도

```
Token Budget 개념:
  · 팀 전체 또는 팀원별 토큰 사용 한도를 설정
  · API console(console.anthropic.com)에서 조직 단위로 설정 가능
  · 한도 초과 시 알림 또는 차단
  · 월별/일별 한도를 나누어 급격한 비용 증가를 방지
```

### 비용 가시성과 팀원별 비교

```
비용 추적 방법:

1. 개인별 /cost 확인
   · 각 팀원이 세션마다 /cost 실행
   · 주간 비용을 팀 채널에 공유

2. API 사용량 대시보드
   · console.anthropic.com에서 조직 전체 사용량 확인
   · 일별/주별/월별 추이 확인
   · 팀원별 사용량 비교 → 비정상 패턴 감지

3. 팀 미팅에서 비용 리뷰
   · 월 1회 "이 달 비용 리뷰"
   · 팀원 간 사용량 비교: 같은 작업인데 비용 차이가 크면
     세션 길이, MCP 설정, CLAUDE.md 크기 등을 점검
   · 비정상적으로 높은 사용량 원인 분석
```

### 구조로 비용 줄이기

Ch.19에서 배운 토큰 절약 원칙을 팀 차원으로 확장:

```
1. CLAUDE.md 최소화
   · 팀 CLAUDE.md 30줄 이하 유지
   · 상세 규칙은 rules/로 분산 (path-specific)
   → 매 세션 로드되는 input token 감소

2. Skill 공유
   · 자주 반복하는 작업은 Skill로 표준화
   · 각자 만들면 중복 토큰 소비
   → 같은 Skill로 같은 품질, 같은 비용

3. SubAgent 전략
   · 큰 작업을 SubAgent로 분할 (Ch.18)
   · 각 SubAgent는 필요한 컨텍스트만
   → 메인 세션의 컨텍스트 비대화 방지

4. 세션 분리
   · 한 세션에 무관한 작업 섞지 않기
   · 작업 완료 후 새 세션
   → 컨텍스트 누적 비용 감소

5. diff 확인 습관
   · 파일 전체 읽지 않기
   · grep/glob으로 타겟팅 후 필요한 부분만
   → tool output 토큰 절약
```

---

## 왜 이렇게 동작하는가

팀 도입의 핵심 원리는 **점진적 표준화(gradual standardization)**다.

```
처음부터 완벽한 표준을 만들면:
  · 팀원이 "왜 이 규칙인지" 이해하지 못한다
  · 실제 업무와 맞지 않는 규칙이 생긴다
  · 저항이 생긴다 — "그냥 내 방식이 더 편한데"

점진적으로 표준화하면:
  · 각자 경험 → 공통 패턴 발견 → 표준으로 승격
  · "이렇게 하니까 좋았다"가 규칙이 된다
  · 채택률이 높다 — 실제 필요에서 나온 규칙이니까
```

이것은 소프트웨어 개발에서 말하는 **Convention over Configuration**과 같다. 합의된 관례가 있으면 설정이 줄고, 일관성이 올라간다.

---

## 변형해보기

1. **쉬운 과제**: 현재 팀에서 Claude Code를 쓰고 있다면, 30일차 체크리스트 항목 중 몇 개를 달성했는지 확인해보자. 안 쓰고 있다면, "개인 탐색기"의 첫 과제를 혼자 시도해보자
2. **어려운 과제**: 팀 CLAUDE.md 초안을 30줄 이내로 작성하고, .claude/rules/에 경로별 규칙 2개를 만들어보자. PR을 올려 팀원의 피드백을 받자

---

## 다음 챕터로

팀 운영의 큰 그림을 그렸다. Ch.29에서는 이 책에서 배운 **모든 것을 합쳐** 하나의 종합 프로젝트를 만든다. CLAUDE.md + settings.json + Skill + MCP + SubAgent + Scheduled Task + Channel — 전부 연결하는 실전.

---

## 이 챕터 핵심 3줄
- **팀 CLAUDE.md는 최소화**(30줄) + **rules/ 분산** + **30/60/90일 로드맵**으로 점진적 표준화. 실제 필요에서 나온 규칙만 승격
- **2026 CI/배포 3종** 🆕: GitHub Actions / GitLab CI / GitHub Code Review App. 서비스에 내장하려면 **Agent SDK**, 규제 필요하면 **Bedrock / Vertex / Foundry** 중 선택
- **보안·데이터 정책 🆕**: ZDR, Data usage, Server-managed settings, LLM gateway — 팀 20명 이상이면 도입 검토. 출발은 default 모드 + Audit Logs, 비용은 Skill 공유·세션 분리로 구조적 절약
- **인증·롤 🆕**: 인증은 Bedrock env → AUTH_TOKEN → API_KEY → apiKeyHelper → OAuth 순서로 탐색. Console 롤은 Primary Owner / Owner / Claude Code / Developer / UsageView 5종 — ZDR 토글과 Data Exports는 Primary Owner 전용
