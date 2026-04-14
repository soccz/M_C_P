# Ch.20 위임이라는 개념

> **이 챕터를 마치면**: Cowork이 무엇인지 설명할 수 있고, Chat·Projects·Cowork·Claude Code 네 가지 경로 중 언제 어떤 것을 선택하는지 결정 트리를 그릴 수 있다. Cowork 폴더 구조를 이해하고 첫 세팅을 할 준비가 된다.

---

## 배경: 클로드에게 "맡긴다"는 것

Part 5까지 클로드 **곁에서** 일하는 법을 배웠다. 세션을 열고, 프롬프트를 치고, 결과를 보고, 다시 프롬프트를 치는 — **실시간 협업** 방식이다.

그런데 모든 작업이 실시간일 필요는 없다.

- "매주 월요일 아침에 경쟁사 뉴스를 정리해줘"
- "이 폴더의 보고서를 읽고 요약본을 만들어줘"
- "캘린더를 보고 오늘 미팅 준비물을 정리해줘"

이런 작업은 **결과만 받으면 된다.** 과정을 하나하나 지켜볼 필요가 없다.

이것이 **위임(delegation)**이다. 심부름을 보내듯, 원하는 결과를 설명하고 나중에 완성품을 받는 것.

> **💭 생각의 흐름**
>
> **문제** — 매주 경쟁사 블로그 3곳을 읽고 요약하는 작업을 Claude Chat에서 했다. 매번 같은 맥락을 다시 설명하고, 링크를 붙여넣고, 형식을 지정하고... 30분씩 걸렸다
> **질문** — "이거 한 번 설정해두면 자동으로 되게 할 수 없나?"
> **시도** — Claude Code에서 스크립트를 짰지만, 터미널을 열어야 하고 프로그래밍 지식이 필요했다
> **발견** — **Cowork**은 바로 이 문제를 푼다. 한 번 폴더를 세팅해두면, "이 폴더 보고 알아서 해"가 가능하다
> **결론** — Chat은 대화, Code는 개발, **Cowork은 위임**이다

---

## Cowork이란: "심부름 보내기"

### 한 줄 정의

**Cowork = Claude Code의 힘을 코딩 없이 쓰는 위임 시스템.**

Claude Code가 개발자를 위한 에이전트라면, Cowork은 **모든 지식 노동자**를 위한 에이전트다. 터미널 대신 데스크톱 앱에서, 코드 대신 파일과 폴더로, 프로그래밍 없이 작업을 맡긴다.

### Cowork이 하는 일

```
사용자가 하는 것:
  1. 원하는 결과를 설명한다
  2. 필요한 파일을 폴더에 넣어둔다
  3. 완성품을 받는다

클로드가 하는 것:
  1. 폴더의 파일을 읽는다
  2. 여러 단계로 나누어 작업한다
  3. 결과를 파일로 저장한다
```

핵심은 **과정을 일일이 지시하지 않는다**는 것이다. "이런 결과를 원해"라고만 하면, 클로드가 스스로 계획을 세우고 실행한다.

### Cowork의 기술적 구조

Cowork은 데스크톱 앱 안에서 **격리된 샌드박스**로 실행된다.

```
Claude Desktop App
  └── Cowork 세션
        ├── 격리된 가상 환경 (macOS/Windows 내부의 분리된 공간)
        │     ├── 사용자가 허용한 폴더만 접근 가능
        │     └── 시스템 파일 접근 불가 (보안)
        ├── 커넥터 (Slack, Notion, Google Drive 등 외부 서비스)
        └── 결과 → 사용자 파일시스템에 저장
```

중요한 점:
- **사용자가 명시적으로 허용한 폴더**에만 접근한다
- 시스템 파일이나 다른 앱의 데이터에는 닿을 수 없다
- 외부 서비스는 **커넥터(Connector)**를 통해서만 연결된다

---

## Chat vs Projects vs Cowork vs Claude Code — 결정 트리

Ch.1에서 클로드의 4가지 경로를 소개했다. 이제 **언제 어떤 것을 쓰는지** 명확히 구분할 차례다.

### 4가지 경로 비교

| | **Chat** | **Projects** | **Cowork** | **Claude Code** |
|---|---|---|---|---|
| **한 마디** | 대화한다 | 기억하며 대화한다 | 맡긴다 | 함께 만든다 |
| **누가 쓰나** | 누구나 | 누구나 (유료) | 지식 노동자 | 개발자 |
| **실행 방식** | 내가 매 단계 지시 | 내가 매 단계 지시 | 결과만 요청 | 실시간 협업 |
| **파일 접근** | 업로드만 (~30MB) | 업로드 + 기억 | 로컬 파일시스템 | 로컬 전체 |
| **외부 연결** | 없음 | 없음 | 커넥터 (Slack 등) | MCP 서버 |
| **자동화** | 없음 | 없음 | Scheduled Tasks | /loop, CronCreate |
| **인터페이스** | 웹/앱 | 웹/앱 | 데스크톱 앱 | 터미널/VSCode |
| **기술 필요** | 없음 | 없음 | 없음 | 프로그래밍 |

### 결정 트리

```
무엇이 필요한가?

├─ 빠른 질문, 글쓰기, 분석?
│   └→ Chat
│
├─ Chat인데, 맥락을 기억하게 하고 싶다?
│   └→ Projects
│
├─ 여러 단계의 작업을 파일로 받고 싶다?
│   ├─ 코딩이 필요한가?
│   │   ├─ 예 → Claude Code
│   │   └─ 아니오 → Cowork
│   │
│   ├─ 반복 자동화가 필요한가?
│   │   ├─ 개발 환경 → Claude Code (/loop, CronCreate)
│   │   └─ 비개발 환경 → Cowork (Scheduled Tasks)
│   │
│   └─ 외부 서비스(Slack, Notion 등)에 연결해야 하나?
│       ├─ 개발 환경 → Claude Code (MCP)
│       └─ 비개발 환경 → Cowork (Connector)
│
└─ 소프트웨어를 만들거나, 터미널을 쓰거나, git이 필요하다?
    └→ Claude Code
```

### 자주 헷갈리는 경계

**"Cowork에서도 코드를 쓸 수 있지 않나?"**

Cowork 안의 샌드박스에서 코드 실행이 가능하다. 하지만 Cowork의 핵심은 코드가 아니라 **위임**이다. 코드를 짜는 것이 목적이면 Claude Code, 결과물(보고서, 요약, 정리)을 받는 것이 목적이면 Cowork.

**"Projects와 Cowork의 차이가 뭔데?"**

Projects는 **기억하는 채팅**이다. 파일을 올려두면 매 대화에서 참고하지만, 실행은 여전히 사용자가 지시한다. Cowork은 **자율 실행**이다. 폴더를 읽고, 여러 단계를 스스로 수행하고, 파일로 결과를 돌려준다.

```
Projects: "이 자료 참고해서 대답해줘" → 대화
Cowork:   "이 자료 보고 보고서 만들어" → 파일
```

---

## Cowork과 Claude Code의 차이 — 위임 방식과 통제 방식

이 책은 Claude Code 중심이지만, Part 6에서 Cowork을 다루는 이유가 있다. 둘은 **같은 에이전트 기술의 다른 표현**이다.

### 같은 점

```
공통점:
  ├── Claude가 스스로 도구를 부르고 판단한다 (agentic)
  ├── 로컬 파일을 읽고 쓸 수 있다
  ├── 여러 단계를 자율적으로 실행한다
  └── 결과물을 파일로 저장한다
```

### 다른 점

| 관점 | **Claude Code** | **Cowork** |
|---|---|---|
| **위임 방식** | 실시간 대화 속에서 위임 | 결과 중심으로 위임 |
| **통제 방식** | 매 단계 승인 가능 (permissions) | 폴더 접근 허용 후 자율 실행 |
| **피드백** | 실시간 (터미널에서 바로) | 사후 (완성된 파일 확인) |
| **규칙 전달** | CLAUDE.md, settings.json, hooks | about-me.md, working-rules.md |
| **작업 격리** | worktree, SubAgent | 샌드박스 VM |
| **반복 자동화** | /loop, CronCreate | Scheduled Tasks |
| **외부 연결** | MCP 서버 | Connector |
| **대상** | 개발자 | 모든 지식 노동자 |

핵심 차이를 한 줄로:

> **Claude Code는 "같이 일하기", Cowork은 "맡기기".**

Claude Code에서 배운 개념들이 Cowork에서도 그대로 적용된다:

```
Claude Code            →  Cowork
────────────────────────────────────────
CLAUDE.md              →  about-me.md + working-rules.md
settings.json          →  폴더 접근 권한
plan.md                →  brief.md (프로젝트 브리프)
SubAgent               →  Cowork이 내부적으로 자동 분업
worktree               →  샌드박스 VM
/loop                  →  Scheduled Tasks
MCP                    →  Connector
```

이 대응표를 기억해두면, Part 2~5에서 배운 모든 것이 Cowork에서도 의미가 있다.

---

## Cowork 폴더 구조

Cowork의 핵심은 **폴더**다. 채팅이 아니라 **파일 시스템**이 인터페이스다.

### 추천 폴더 구조

다음은 커뮤니티에서 검증된 폴더 구조다. Anthropic이 공식으로 정한 것은 아니지만, 많은 사용자가 이 패턴으로 성공하고 있다.

```
CLAUDE-COWORK/
├── ABOUT-ME/                    ← 클로드가 매 세션 시작 시 읽는 곳
│   ├── about-me.md              ← 나는 누구인가, 어떻게 일하는가
│   └── working-rules.md         ← 일할 때 지켜야 할 규칙
│
├── PROJECTS/                    ← 프로젝트별 작업 자료
│   ├── 경쟁사-분석/
│   │   ├── brief.md             ← 이 프로젝트의 목표와 범위
│   │   └── 참고자료들...
│   └── 주간-보고서/
│       ├── brief.md
│       └── 지난주-보고서.md
│
├── TEMPLATES/                   ← 재사용 가능한 형식 틀
│   ├── weekly-brief-template.md
│   └── competitor-report-template.md
│
└── CLAUDE-OUTPUTS/              ← 클로드가 결과를 저장하는 곳
    ├── 2026-04-14_경쟁사브리프.md
    └── 2026-04-14_주간요약.md
```

### 각 폴더의 역할

**ABOUT-ME/ — "나를 소개하는 곳"**

```markdown
# about-me.md 예시

## 나는 누구인가
- 스타트업 마케팅 리드
- B2B SaaS 제품을 담당
- 매주 경쟁사 동향 브리핑을 팀에 공유

## 클로드에게 바라는 것
- 한국어로 작성
- 글머리 기호 중심, 긴 문단 지양
- 수치가 있으면 반드시 출처 명시
- 불확실한 정보는 "확인 필요"로 표시
```

이것은 Claude Code의 **CLAUDE.md**와 같은 역할이다. Cowork에서는 이를 공식적으로 **Global Instructions**라고 부른다. 매 세션 시작 시 읽혀서 클로드의 행동을 결정한다. 짧고 핵심적으로 유지할수록 효과적이다.

**PROJECTS/ — "작업 자료를 모아두는 곳"**

각 프로젝트마다 **brief.md**를 둔다. brief.md는 Claude Code의 plan.md에 해당한다.

```markdown
# brief.md 예시 (경쟁사-분석)

## 목표
매주 경쟁사 3곳의 블로그를 읽고 핵심 동향을 정리

## 경쟁사
1. CompanyA — blog.companya.com
2. CompanyB — blog.companyb.com
3. CompanyC — medium.com/@companyc

## 출력 형식
- 회사별 3~5줄 요약
- "우리에게 의미하는 것" 1줄
- weekly-brief-template.md 형식 사용

## 주의사항
- 가격 정보는 정확한 것만 포함
- 루머나 추측은 제외
```

**TEMPLATES/ — "재사용 형식 틀"**

```markdown
# weekly-brief-template.md

## 주간 경쟁사 브리프 — {{날짜}}

### CompanyA
- **주요 발표**: 
- **핵심 포인트**: 
- **우리에게 의미**: 

### CompanyB
...

### 요약
- 이번 주 가장 큰 변화:
- 다음 주 주시할 것:
```

이것은 Ch.9에서 배운 **Progressive Disclosure**와 같은 원리다. 매번 형식을 설명하는 대신, 형식 파일을 가리킨다.

**CLAUDE-OUTPUTS/ — "완성품이 쌓이는 곳"**

클로드가 작업 결과를 저장하는 곳이다. 파일명에 날짜를 포함하면 자동으로 정리된다.

### CLAUDE.md와 about-me.md의 관계

```
Claude Code 사용자:
  ~/.claude/CLAUDE.md              ← 글로벌 규칙
  프로젝트/.claude/CLAUDE.md       ← 프로젝트 규칙

Cowork 사용자:
  ABOUT-ME/about-me.md             ← "나는 누구인가"
  ABOUT-ME/working-rules.md        ← "이렇게 일해줘"
  PROJECTS/X/brief.md              ← "이 작업의 목표와 범위"
```

이름은 다르지만 역할은 같다:
- **about-me.md ≈ 글로벌 CLAUDE.md** — 모든 작업에 적용되는 기본 규칙
- **working-rules.md ≈ rules/** — 구체적인 작업 규칙
- **brief.md ≈ plan.md** — 개별 작업의 목표와 범위

---

## Cowork 시작의 4단계

아직 세팅하지 않아도 된다 — Ch.21에서 상세히 다룬다. 여기서는 큰 그림만 본다.

```
1단계: 폴더 만들기
  └── CLAUDE-COWORK/ 안에 4개 하위 폴더

2단계: about-me.md 쓰기
  └── 나는 누구이고, 어떤 형식을 좋아하는가

3단계: 첫 작업 맡기기
  └── "이 폴더 보고 요약해줘" 같은 작은 작업

4단계: 결과 보고 규칙 다듬기
  └── working-rules.md에 "이건 이렇게 해줘" 추가
```

이 순서는 Claude Code를 처음 쓸 때와 같다:
1. CLAUDE.md 만들기 → about-me.md
2. 작은 작업 시도 → 첫 심부름
3. 결과 보고 규칙 조정 → 피드백 반영

---

## 왜 이렇게 동작하는가

Cowork의 설계 원리는 Ch.9~11에서 배운 **3가지 엔지니어링**의 자연스러운 확장이다.

**Context Engineering**: about-me.md와 brief.md가 컨텍스트를 미리 구성한다. 매번 같은 맥락을 채팅으로 설명하는 대신, 파일로 영속화했다.

**Prompt Engineering**: brief.md에 목표·범위·출력 형식·주의사항을 쓰는 것은 Ch.10의 제약형 프롬프트 템플릿과 같은 구조다.

**Harness Engineering**: 폴더 구조 자체가 하네스다. ABOUT-ME/는 기본 규칙, TEMPLATES/는 출력 형식, PROJECTS/는 작업 범위를 각각 파일로 분리한 것이다.

결국 Cowork은 **파일 시스템 기반 하네스**다. 터미널 대신 폴더가, 명령어 대신 파일이, 설정 대신 문서가 같은 역할을 한다.

---

## 변형해보기

1. **쉬운 과제**: 자신의 업무에서 "매번 반복하는 작업"을 3가지 적어보자. 각각이 Chat/Projects/Cowork/Claude Code 중 어디에 해당하는지 결정 트리로 분류해보자
2. **어려운 과제**: CLAUDE-COWORK/ 폴더를 실제로 만들고, about-me.md를 작성해보자. 200단어 이내로 "나는 누구이고, 어떤 결과를 원하는가"를 정리

---

## 다음 챕터로

위임이라는 개념을 이해했다. 하지만 이 개념이 실제로 작동하려면 **세팅**이 필요하다. about-me.md를 어떻게 쓰는지, working-rules.md에 뭘 넣는지, 7일 동안 어떤 순서로 세팅하는지 — Ch.21에서 구체적으로 다룬다.

---

## 이 챕터 핵심 3줄
- **Cowork = 위임 시스템.** Chat은 대화, Projects는 기억하는 대화, Claude Code는 함께 만들기, **Cowork은 맡기기**
- **결정 트리**: 빠른 질문 → Chat, 맥락 유지 → Projects, 코딩 → Claude Code, **결과물 위임 → Cowork**
- **폴더가 인터페이스**: ABOUT-ME/(규칙) + PROJECTS/(작업) + TEMPLATES/(형식) + CLAUDE-OUTPUTS/(결과). Claude Code의 CLAUDE.md·plan.md·rules/와 같은 역할을 파일 시스템으로 수행
