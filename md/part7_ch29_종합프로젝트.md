# Ch.29 종합 프로젝트 — 개인 코드 리뷰 자동화 시스템

> **이 챕터를 마치면**: 이 책에서 배운 CLAUDE.md, settings.json, Skill, MCP, SubAgent, Scheduled Task, Channel을 모두 연결한 코드 리뷰 자동화 시스템을 설계할 수 있다. 각 저장점에서 중간 결과를 확인하며 단계적으로 구축하는 방법을 이해한다.

---

## 배경: 모든 것을 연결하기

Part 1~6에서 배운 개념들:

```
Part 1: 설치, 첫 대화, 에러 대응
Part 2: 기억(CLAUDE.md), 설정(settings.json), 규칙(rules/), 습관(hooks)
Part 3: Context Engineering, Prompt Engineering, Harness Engineering
Part 4: Skill, MCP, Plugin
Part 5: 세션, 계획, SubAgent, 토큰
Part 6: 위임, Cowork, Channels, Scheduled Tasks, Remote Control
```

이 챕터에서는 이 모든 것을 **하나의 프로젝트**로 합친다. 개별 개념을 아는 것과, 그것들을 조합해서 작동하는 시스템을 만드는 것은 다르다.

> **💭 생각의 흐름**
>
> **문제** — 개인 프로젝트에서 코드를 짜고 PR을 올리는데, 매번 리뷰를 직접 한다. 보안 체크, 스타일 확인, 테스트 커버리지 — 같은 항목을 매번 반복
> **질문** — "이 반복을 시스템으로 만들 수 없나?"
> **시도** — CLAUDE.md에 리뷰 규칙을 써봤지만, 매번 수동으로 프롬프트를 쳐야 했다
> **발견** — Skill + Hook + Scheduled Task를 조합하면, **코드를 push하면 자동으로 리뷰가 실행**되는 시스템을 만들 수 있다
> **결론** — 개별 기능은 부품이고, **시스템은 부품의 조합**이다

---

## 프로젝트 개요

### 만들 것

```
개인 코드 리뷰 자동화 시스템

입력: git push (코드 변경)
처리:
  1. 변경된 파일 목록 추출
  2. 보안 검토 (SubAgent A)
  3. 스타일 검토 (SubAgent B)
  4. 결과 통합
출력: 리뷰 보고서 (마크다운 파일)
```

### 사용하는 기능

| 기능 | 역할 | 배운 챕터 |
|---|---|---|
| CLAUDE.md | 프로젝트 규칙 정의 | Ch.5 |
| settings.json | 권한과 허용 범위 | Ch.6 |
| rules/ | 경로별 세부 규칙 | Ch.7 |
| Skill | 리뷰 작업 패키지 | Ch.12 |
| MCP | git 정보 연결 | Ch.13 |
| SubAgent | 보안/스타일 병렬 검토 | Ch.18 |
| Scheduled Task | 정기 자동 실행 | Ch.23 |

### 저장점 구조

프로젝트를 3개 저장점으로 나눈다. 각 저장점에서 중간 결과를 확인한다.

```
저장점 1: 기반 설정 (CLAUDE.md + settings.json + Skill)
  → 확인: 규칙이 제대로 로드되고 Skill이 실행되는가

저장점 2: MCP 연결 + SubAgent 분업 (보안검토 + 스타일검토)
  → 확인: MCP로 git 정보를 읽고, SubAgent가 병렬 리뷰하는가

저장점 3: Scheduled Task + 알림 연결
  → 확인: 정기적으로 자동 리뷰가 실행되고 결과가 알림되는가
```

---

## 저장점 1: 기반 설정

### 폴더 구조 만들기

```
my-project/
├── .claude/
│   ├── CLAUDE.md
│   ├── settings.json
│   ├── rules/
│   │   ├── security.md
│   │   └── style.md
│   └── skills/
│       └── code-review/
│           └── SKILL.md
├── src/
│   └── (프로젝트 코드)
├── reviews/
│   └── (리뷰 결과가 저장될 곳)
└── .gitignore
```

### CLAUDE.md 작성

```markdown
# 프로젝트 규칙

## 이 프로젝트
- 개인 웹 프로젝트. Python FastAPI + React.
- 코드 리뷰 자동화 시스템 구축 중.

## 리뷰 규칙
- 변경된 파일만 리뷰 (전체 코드베이스 X)
- 리뷰 결과는 reviews/ 폴더에 YYYY-MM-DD_review.md 형식으로 저장
- 심각도: CRITICAL / WARNING / INFO 3단계

## 금지
- 프로덕션 코드를 직접 수정하지 말 것 (리뷰만)
- .env 파일 내용을 리뷰 보고서에 포함하지 말 것
```

### settings.json 작성

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit(reviews/**)"
    ],
    "deny": [
      "Edit(src/**)",
      "Bash(rm *)",
      "Bash(sudo *)"
    ]
  }
}
```

핵심: 리뷰 시스템은 **읽기 전용**이다. `src/`를 수정할 권한이 없다. `reviews/`에만 쓸 수 있다.

### 경로별 규칙

```yaml
# .claude/rules/security.md
---
paths:
  - "src/**/*.py"
  - "src/**/*.ts"
---
# 보안 검토 규칙
- SQL 쿼리에서 문자열 포맷팅 사용 여부 체크 (SQL injection)
- 사용자 입력을 직접 HTML에 삽입하는지 체크 (XSS)
- 하드코딩된 비밀번호나 API 키 체크
- eval(), exec() 사용 여부 체크
- subprocess에 shell=True 사용 여부 체크
```

```yaml
# .claude/rules/style.md
---
paths:
  - "src/**/*.py"
---
# 스타일 검토 규칙
- 함수 길이 30줄 초과 여부
- docstring 존재 여부 (public 함수)
- 변수명 명확성 (x, temp, data 같은 모호한 이름)
- import 정리 (미사용 import)
- 타입 힌트 존재 여부
```

### 저장점 1 확인

```bash
# Claude Code에서 규칙이 로드되는지 확인
claude

# 세션에서:
/memory
# → CLAUDE.md와 규칙 파일이 로드되었는지 확인

# 테스트: src/ 파일을 열면 security.md 규칙이 적용되는가
# src/main.py를 읽어줘. 보안 규칙에 위반되는 부분이 있어?
```

---

## 저장점 2: MCP 연결 + SubAgent 분업

### MCP로 git 정보 연결

리뷰 시스템이 git 변경사항을 체계적으로 읽으려면, MCP 서버를 활용할 수 있다.

```bash
# Git MCP 서버 추가 (파일시스템 기반)
claude mcp add filesystem -- npx -y @anthropic-ai/mcp-filesystem \
  --allowed-directories /path/to/my-project
```

MCP를 쓰면 `git diff`, `git log` 결과를 구조화된 형태로 받을 수 있어 Skill이 더 정확하게 변경사항을 파악한다. MCP 없이도 `Bash(git diff)`로 가능하지만, MCP를 연결하면 파일 내용을 안전하게 읽을 수 있다.

### Skill 만들기

```yaml
# .claude/skills/code-review/SKILL.md
---
name: code-review
description: 변경된 코드를 보안과 스타일 관점에서 리뷰합니다
trigger: /review
---

# 코드 리뷰 Skill

## 실행 단계

1. `git diff --name-only HEAD~1`로 변경된 파일 목록을 가져온다
2. 변경된 파일 중 소스 코드(.py, .ts, .tsx, .js)만 필터링
3. 보안 검토와 스타일 검토를 **SubAgent로 병렬 실행**:
   - SubAgent A: 보안 검토 (.claude/rules/security.md 기준)
   - SubAgent B: 스타일 검토 (.claude/rules/style.md 기준)
4. 두 결과를 통합하여 리뷰 보고서 생성
5. reviews/YYYY-MM-DD_review.md에 저장

## 출력 형식

```markdown
# 코드 리뷰 — {{날짜}}

## 변경 파일
- file1.py (수정)
- file2.ts (추가)

## 보안 검토
| 파일 | 심각도 | 내용 |
|---|---|---|
| file1.py:23 | CRITICAL | SQL injection 위험 |

## 스타일 검토
| 파일 | 심각도 | 내용 |
|---|---|---|
| file1.py:45 | WARNING | 함수 35줄 초과 |

## 요약
- CRITICAL: N건
- WARNING: N건
- INFO: N건
```

## 주의사항
- 리뷰만 수행. 코드를 직접 수정하지 말 것
- .env, credentials 파일은 리뷰 보고서에 내용 포함 금지
- 불확실한 판단은 INFO로 분류하고 "확인 필요" 표시
```

### SubAgent 분업 설계

```
메인 Agent: 전체 조율
  │
  ├─ SubAgent A: 보안 검토
  │   · security.md 규칙 기준
  │   · 각 파일의 보안 이슈 목록 반환
  │   · 독립 컨텍스트 (스타일 규칙 로드 불필요)
  │
  └─ SubAgent B: 스타일 검토
      · style.md 규칙 기준
      · 각 파일의 스타일 이슈 목록 반환
      · 독립 컨텍스트 (보안 규칙 로드 불필요)

병렬 실행의 장점:
  · 각 SubAgent가 필요한 규칙만 로드 → 토큰 절약
  · 동시에 실행 → 시간 단축
  · 컨텍스트 오염 없음 → 정확도 향상
```

왜 SubAgent로 분리하는가? (Ch.18 복습)

```
1. 컨텍스트 격리
   보안 검토와 스타일 검토는 다른 관점이다.
   같은 컨텍스트에서 두 가지를 동시에 하면
   "보안적으로는 괜찮지만 스타일이..." 같은 혼선이 생긴다.

2. 병렬 실행
   파일 10개를 순차적으로 리뷰하면 시간이 오래 걸린다.
   SubAgent 2개가 동시에 작업하면 절반으로 줄어든다.

3. 실패 격리
   보안 검토가 에러 나도 스타일 검토는 정상 완료된다.
   메인 Agent가 실패한 부분만 재시도할 수 있다.
```

### 저장점 2 확인

```bash
# 수동으로 Skill 실행
claude

# 세션에서:
/review
# → 변경된 파일을 리뷰하고 reviews/ 폴더에 보고서가 생성되는가?

# 확인 항목:
# □ 변경된 파일 목록이 정확한가
# □ 보안 검토와 스타일 검토가 각각 실행되었는가
# □ 심각도 분류가 적절한가
# □ reviews/YYYY-MM-DD_review.md가 생성되었는가
# □ .env 내용이 보고서에 포함되지 않았는가
```

---

## 저장점 3: Scheduled Task + 알림 연결

### Scheduled Task로 정기 리뷰

저장점 2에서 수동 실행(`/review`)이 잘 작동한다면, 이제 자동화한다.

**방법 1: Claude Code /loop**

```bash
# 터미널에서 30분마다 리뷰 실행
claude --print "/review" 
```

`--print` 모드를 사용하면 비대화형으로 실행되어 자동화에 적합하다.

**방법 2: Cloud Scheduled Task**

```
claude.ai/code/scheduled에서:
  1. New Task 생성
  2. GitHub 레포 연결
  3. 프롬프트: "최근 커밋을 리뷰하고 결과를 reviews/ 폴더에 저장해.
     보안 검토와 스타일 검토를 SubAgent로 병렬 실행해."
  4. 빈도: Hourly 또는 Every 6 hours
```

Cloud 방식은 로컬 터미널을 켜놓지 않아도 된다. 매 실행마다 GitHub에서 레포를 fresh clone하므로, 프롬프트가 self-contained여야 한다 (Ch.23).

### 알림 연결 (Slack)

리뷰 결과를 파일로만 저장하면 확인하기 어렵다. 알림을 연결하자.

**방법 A: Cloud Scheduled Task + Slack 커넥터**

```
claude.ai/code/scheduled에서:
  1. 기존 Scheduled Task에 Connectors → Slack MCP 추가
  2. 프롬프트에 추가: "리뷰 완료 후 결과 요약을
     Slack #eng-reviews 채널에 포스팅해"
  3. Slack 연결 시 채널 접근 권한 승인
```

**방법 B: Hook + Slack webhook (Claude Code 방식)**

```bash
# .claude/settings.json의 hooks 섹션에 추가
# PostToolUse로 리뷰 완료 후 Slack webhook 호출

# 또는 셸 스크립트:
#!/bin/bash
REVIEW_FILE=$(ls -t reviews/*.md | head -1)
SUMMARY=$(head -5 "$REVIEW_FILE")
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"코드 리뷰 완료:\\n$SUMMARY\"}" \
  "$SLACK_WEBHOOK_URL"
```

**방법 C: Channel 수신 (역방향 — Slack → Claude)**

```
Channel 설정 (Research Preview):
  1. Claude Code 세션에서 Channel을 활성화
  2. Slack 앱 연동 → 특정 채널의 메시지를 Claude에 전달
  3. Slack에서 "/리뷰해줘" → Channel이 메시지를 세션에 push
  4. Claude가 리뷰 실행 → 결과를 Slack으로 응답

주의: Channels는 Research Preview. 설정 방법이 변경될 수 있음.
```

### 전체 시스템 흐름

```
트리거 (Scheduled Task / git push)
  │
  ▼
Claude Code 실행
  │
  ├─ CLAUDE.md 읽기 (리뷰 규칙)
  ├─ MCP / git diff로 변경 파일 추출
  │
  ├─ SubAgent A: 보안 검토
  │   └─ security.md 규칙 적용
  │
  ├─ SubAgent B: 스타일 검토
  │   └─ style.md 규칙 적용
  │
  ├─ 결과 통합
  │
  ▼
reviews/YYYY-MM-DD_review.md 저장
  │
  ▼
알림: Slack #eng-reviews에 요약 포스팅
```

### 저장점 3 확인

```bash
# Scheduled Task 테스트: "Run now"로 즉시 실행
# 또는 로컬에서:
claude --print "/review"

# 확인:
# □ 리뷰가 자동으로 실행되었는가
# □ reviews/ 폴더에 새 리뷰 파일이 생겼는가
# □ 알림이 Slack에 도착했는가 (연결한 경우)
# □ 에러 없이 완료되었는가
```

---

## 완성 후 회고

### 무엇이 잘 됐나

```
1. 규칙 분리 (CLAUDE.md + rules/)
   · CLAUDE.md는 짧게, 상세 규칙은 경로별로
   · 보안/스타일 규칙이 섞이지 않았다

2. SubAgent 분업
   · 보안과 스타일이 독립적으로 실행
   · 한쪽이 실패해도 다른 쪽은 정상

3. 읽기 전용 설계
   · settings.json에서 src/ 수정을 차단
   · 리뷰 시스템이 실수로 코드를 바꾸는 사고 방지
```

### 무엇을 바꿀 것인가

```
1. 리뷰 규칙 고도화
   · 프로젝트가 커지면 rules/ 파일도 늘어난다
   · 정기적으로 규칙을 리뷰하고 불필요한 것 정리

2. 리뷰 결과 알림
   · 현재는 파일로만 저장
   · Slack 연동이나 이메일 알림 추가 가능

3. 과거 리뷰와 비교
   · "지난주 대비 CRITICAL이 줄었는가?"
   · 트렌드 분석 기능 추가 가능
```

---

## 대안 프로젝트 2개

이 프로젝트가 자신의 업무와 맞지 않는다면, 같은 구조로 다른 것을 만들 수 있다.

### 대안 1: 주간 지식 브리핑 생성기

```
목적: 매주 관심 분야의 새 자료를 수집·요약·정리

구조:
  저장점 1: CLAUDE.md + rules/ + brief.md (관심 분야, 소스 목록)
  저장점 2: Skill (자료 수집 → 분류 → 요약) + template.md
  저장점 3: Scheduled Task (매주 월요일 자동 실행)

사용 기능: CLAUDE.md, rules/, Skill, Scheduled Task, template
과업 모양: 분석형 (Ch.27)
```

### 대안 2: CLI 기반 프로젝트 관리 도우미

```
목적: 터미널에서 프로젝트 상태를 확인하고 작업을 관리

구조:
  저장점 1: CLAUDE.md + plan.md + handoff.md 템플릿
  저장점 2: Skill (상태 확인 / 작업 추가 / 완료 기록)
  저장점 3: Hook (세션 시작 시 자동으로 오늘 할 일 표시)

사용 기능: CLAUDE.md, plan.md, handoff.md, Skill, Hook
과업 모양: 정리형 (Ch.27)
```

---

## 왜 이렇게 동작하는가

종합 프로젝트의 핵심 원리는 **관심사의 분리(Separation of Concerns)**다.

```
각 부분이 자기 역할만 한다:

CLAUDE.md     → "무엇을" (목표와 제약)
rules/        → "어떻게" (구체적 기준)
settings.json → "어디까지" (권한과 경계)
Skill         → "실행" (작업 패키지)
SubAgent      → "분업" (병렬 처리)
Hook          → "언제" (자동 트리거)

이 부품들은 인터페이스로 연결된다:
  · CLAUDE.md가 Skill에게 규칙을 전달
  · rules/가 SubAgent에게 기준을 전달
  · Hook이 Skill을 트리거
  · Skill이 SubAgent를 생성
  · SubAgent가 결과를 Skill에게 반환
```

이것이 Ch.11 Harness Engineering의 완성형이다. 하네스가 잘 설계되면, 프롬프트 한 줄로 복잡한 시스템이 작동한다.

---

## 변형해보기

1. **쉬운 과제**: 저장점 1만 따라해보자. CLAUDE.md, settings.json, rules/ 2개를 만들고, Claude Code에서 `/memory`로 규칙이 로드되는지 확인
2. **어려운 과제**: 저장점 3까지 완성하고, 실제로 git push 후 리뷰 보고서가 생성되는지 테스트. 보고서의 품질이 마음에 들 때까지 rules/를 다듬어보자

---

## 다음 챕터로

종합 프로젝트를 완성했다 — 또는 적어도 설계도를 그렸다. 이제 마지막 챕터다. 이 책을 넘어서 어떻게 계속 성장할 것인가? 공식 문서, 커뮤니티, 그리고 끊임없이 변하는 도구를 따라가는 방법 — Ch.30에서 다룬다.

---

## 이 챕터 핵심 3줄
- **저장점으로 나눠 만들기**: 기반 설정(CLAUDE.md + settings.json + Skill) → MCP 연결 + SubAgent 분업 → Scheduled Task + 알림. 각 저장점에서 중간 확인 후 다음 단계
- **SubAgent 분업**: 보안 검토와 스타일 검토를 별도 SubAgent로 분리. 컨텍스트 격리·병렬 실행·실패 격리 3가지 이점. MCP로 git 정보를 구조화
- **읽기 전용 + 자동 알림**: 리뷰 시스템은 src/를 수정하지 않는다(deny). Scheduled Task로 정기 실행, Slack으로 결과 알림. 안전한 자동화의 핵심은 권한 제한
