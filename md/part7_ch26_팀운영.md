# Ch.26 팀으로 쓰는 클로드

> **이 챕터를 마치면**: 팀 CLAUDE.md를 설계할 수 있고, 30/60/90일 도입 로드맵에 따라 팀 도입을 계획할 수 있다. 보안·거버넌스·비용 관리의 핵심을 이해한다.

---

## 배경: 혼자 쓰기에서 팀으로

Ch.25에서 개인 워크플로우를 설계했다. 그런데 팀에서 쓰려면 추가로 풀어야 할 문제가 있다.

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
  □ Scheduled Task / /loop으로 반복 자동화 2~3개
  □ 코드 리뷰 자동화 파이프라인
  □ Plugin 도입 기준 수립
  □ MCP 서버 최소 연결 (필요한 것만)
  □ Channels 연동 (Slack, webhook 등 외부 이벤트 수신)
  □ 비용 리뷰: 주간/월간 /cost 비교
  □ 보안 감사: Audit Logs로 누가 어떤 명령을 실행했는지 확인

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

### CI 연동 검토

```
자동 코드 리뷰 파이프라인:

GitHub Actions / GitLab CI에서:
  1. PR이 열리면 Claude Code를 트리거
  2. 변경된 파일을 리뷰
  3. 보안 이슈, 스타일 위반 체크
  4. 결과를 PR 코멘트로 작성

주의사항:
  · CI 환경에서는 --print 모드 사용 (비대화형)
  · API 키 관리: 환경 변수로 주입, 레포에 커밋 금지
  · 비용 제어: 토큰 상한 설정
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

팀 운영의 큰 그림을 그렸다. Ch.27에서는 이 책에서 배운 **모든 것을 합쳐** 하나의 종합 프로젝트를 만든다. CLAUDE.md + settings.json + Skill + MCP + SubAgent + Scheduled Task + Channel — 전부 연결하는 실전.

---

## 이 챕터 핵심 3줄
- **팀 CLAUDE.md는 최소화**: 30줄 이하, 핵심만. 상세 규칙은 .claude/rules/에 분산하고 path-specific으로 필요한 때만 로드
- **30/60/90일 로드맵**: 개인 탐색(30일) → 팀 표준(60일) → 자동화 확장(90일). 점진적으로, 실제 필요에서 나온 규칙만 표준화
- **보안과 비용**: default 모드로 시작, bypassPermissions는 신뢰된 자동화만. Enterprise는 Audit Logs로 추적. 비용은 CLAUDE.md 최소화 + Skill 공유 + 세션 분리로 구조적 절약
