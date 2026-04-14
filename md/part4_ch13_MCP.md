# Ch.13 도구 연결하기 — MCP

> **이 챕터를 마치면**: MCP(Model Context Protocol)가 무엇인지, 왜 필요한지, 어떻게 설치하고 연결하는지 이해한다. MCP가 토큰을 많이 쓰는 이유를 알고, "최소 연결" 원칙을 실천할 수 있다.

---

## 배경: Skill만으로는 닿을 수 없는 곳

Ch.12에서 Skill을 배웠다. Skill은 **클로드가 할 줄 아는 것**을 정의한다. 하지만 Skill에는 한계가 있다.

```
Skill이 할 수 있는 것:
✅ 파일을 정해진 형식으로 만들기
✅ 코드 리뷰 체크리스트 실행하기
✅ 배포 절차 안내하기

Skill이 할 수 없는 것:
❌ Slack에 메시지 보내기
❌ 데이터베이스 조회하기
❌ Sentry에서 에러 가져오기
❌ 브라우저로 웹사이트 테스트하기
```

Skill은 클로드의 **내부 능력**이다. 외부 세계에 닿으려면 **연결**이 필요하다.

이 연결을 만드는 것이 **MCP(Model Context Protocol)**다.

---

## MCP란 무엇인가

MCP는 **클로드와 외부 도구를 연결하는 표준 인터페이스**다.

비유로 이해하자:

```
스마트폰 비유:

스마트폰 자체     = Claude Code
앱 스토어의 앱들  = MCP 서버들
앱을 설치하면     = claude mcp add
앱의 기능을 쓸 수 있다 = 외부 도구 사용
```

스마트폰이 아무리 좋아도, 앱 없이는 은행 업무도, 택시 호출도, 음식 주문도 못 한다. **MCP는 클로드에게 "앱을 설치하는 것"**과 같다.

> **💭 생각의 흐름**
>
> **문제** — 클로드에게 "Slack에 메시지 보내줘"라고 했더니 "저는 Slack에 접근할 수 없습니다"라고 한다
> **질문** — "어떻게 하면 클로드가 Slack을 쓸 수 있을까?"
> **시도 1** — CLAUDE.md에 Slack 규칙을 적었다 → 당연히 안 된다. 규칙을 적는다고 능력이 생기진 않는다
> **시도 2** — Skill로 Slack 매뉴얼을 만들었다 → 매뉴얼이 있어도 도구가 없으면 못 쓴다
> **발견** — MCP 서버를 설치해야 한다. `claude mcp add slack ...` 하면 클로드가 Slack API를 쓸 수 있게 된다
> **결론** — 규칙(CLAUDE.md) + 절차(Skill) + **연결(MCP)** = 완전한 능력

---

## MCP의 구조: 클라이언트-서버 모델

MCP는 **클라이언트-서버 모델**로 동작한다.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Claude Code │────▶│  MCP 서버    │────▶│  외부 서비스  │
│  (클라이언트) │◀────│  (중간 다리)  │◀────│  (Slack 등)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **클라이언트** (Claude Code) — "이 도구를 써줘"라고 요청
- **MCP 서버** (중간 다리) — 요청을 외부 서비스에 맞게 변환
- **외부 서비스** (Slack, DB 등) — 실제로 일을 수행

왜 중간에 "서버"가 필요할까? **각 외부 서비스마다 API가 다르기 때문**이다. MCP 서버가 이 차이를 통일된 형식으로 바꿔준다.

### 서버 통신 방식 2가지

MCP 서버는 두 가지 방식으로 통신한다:

**1. stdio (표준 입출력)** — 로컬에서 실행

```
Claude Code ──stdin/stdout──▶ MCP 서버 (같은 컴퓨터)
```

가장 흔한 방식. MCP 서버가 내 컴퓨터에서 프로세스로 실행되고, 표준 입출력으로 통신한다.

**2. SSE / Streamable HTTP** — 원격에서 실행

```
Claude Code ──HTTP──▶ MCP 서버 (다른 서버/클라우드)
```

MCP 서버가 원격 서버에서 실행될 때. 팀 전체가 같은 MCP 서버를 공유할 수 있다.

초보자라면 **stdio만 알면 충분**하다. 대부분의 MCP 서버가 이 방식이다.

---

## MCP 서버 설치하고 연결하기

### 기본 명령어

```bash
# MCP 서버 추가 (설치 + 연결)
claude mcp add <이름> <실행 명령>

# 예: filesystem MCP 서버 추가
claude mcp add filesystem npx @anthropic/mcp-filesystem /home/user/documents

# MCP 서버 목록 확인
claude mcp list

# MCP 서버 제거
claude mcp remove <이름>

# MCP 서버 직접 실행 (서빙 모드)
claude mcp serve
```

### `claude mcp serve`란?

`claude mcp serve`는 **Claude Code 자체를 MCP 서버로 실행**하는 명령어다.

보통은 "MCP 서버를 Claude Code에 연결"하지만, `serve`는 반대다. **다른 프로그램이 Claude Code의 기능을 MCP로 쓸 수 있게** 열어주는 것이다.

```
일반적인 흐름:
  Claude Code ──▶ MCP 서버 (Slack, Playwright 등)

serve 모드:
  다른 프로그램 ──▶ Claude Code (MCP 서버로 동작)
```

초보자 단계에서는 잘 안 쓴다. "이런 것도 있다" 정도만 알면 충분하다.

### JSON으로 추가하기

더 복잡한 설정이 필요하면 JSON으로 추가한다:

```bash
claude mcp add-json <이름> '{
  "command": "npx",
  "args": ["@anthropic/mcp-filesystem", "/home/user/documents"],
  "env": {}
}'
```

### settings.json에서 직접 설정하기

`settings.json`의 `mcpServers` 섹션에 직접 적을 수도 있다:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@anthropic/mcp-filesystem", "/home/user/documents"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"]
    }
  }
}
```

Ch.6에서 배운 settings.json에 새 섹션이 추가된 것이다.

---

## 실전 1: 파일시스템 MCP

가장 간단한 MCP부터 해보자. 파일시스템 MCP는 클로드가 **특정 폴더의 파일을 읽고 쓸 수 있게** 한다.

"잠깐, 클로드는 이미 파일을 읽고 쓸 수 있지 않나?" — 맞다. Claude Code 자체가 파일 도구를 가지고 있다. 파일시스템 MCP는 **MCP가 어떻게 동작하는지 이해하기 위한 연습용**이다.

```bash
# 1. MCP 서버 추가
claude mcp add filesystem npx @anthropic/mcp-filesystem /home/user/documents

# 2. 확인
claude mcp list
# → filesystem: npx @anthropic/mcp-filesystem /home/user/documents

# 3. 사용
# Claude Code에서: "documents 폴더에 있는 파일 목록을 보여줘"
# → MCP의 filesystem 도구를 사용하여 파일 목록을 가져온다
```

### 권한 설정

MCP 도구를 처음 쓰면 **승인 요청**이 뜬다:

```
Claude wants to use: mcp__filesystem__read_file
Allow? [y/n/always]
```

매번 승인하기 귀찮으면 settings.json의 permissions에 추가한다:

```json
{
  "permissions": {
    "allow": [
      "mcp__filesystem__read_file",
      "mcp__filesystem__list_directory"
    ]
  }
}
```

패턴: `mcp__<서버이름>__<도구이름>`

Ch.6에서 배운 permissions의 확장이다.

---

## 실전 2: 공개 레지스트리에서 MCP 서버 찾아 추가하기

MCP 서버는 직접 만들 수도 있지만, **이미 만들어진 것을 가져다 쓰는 게** 대부분이다.

### 공개 MCP 레지스트리

MCP 서버를 찾을 수 있는 곳들이 있다:

- **npm 레지스트리** — `@anthropic/mcp-*` 패키지 (공식)
- **GitHub** — 커뮤니티가 만든 MCP 서버들
- **MCP 디렉토리** — 카테고리별 MCP 서버 모음

### Playwright MCP 추가해보기

프론트엔드 테스트를 위한 Playwright MCP를 레지스트리에서 찾아 설치해보자:

```bash
# 1. npm에서 검색 (이미 알고 있다면 바로 설치)
# @anthropic/mcp-playwright

# 2. MCP 서버 추가
claude mcp add playwright npx @anthropic/mcp-playwright

# 3. 확인
claude mcp list
# → filesystem: ...
# → playwright: npx @anthropic/mcp-playwright
```

이제 클로드에게:

```
"localhost:3000에 접속해서 로그인 페이지를 테스트해줘.
이메일/비밀번호 입력 → 로그인 버튼 클릭 → 결과 확인."
```

클로드가 **실제로 브라우저를 열고 테스트를 수행**한다. 마스터 가이드의 실제 사례:

> Claude가 Playwright로 localhost:3000에 접속해서 UI 컴포넌트를 생성하고,
> 스타일링 품질을 분석한 뒤, 자동으로 프롬프트를 개선하여 더 나은 결과를 만들었다.

이것이 MCP의 진짜 힘이다. **코드 편집을 넘어서, 개발 자동화 전체**로 클로드의 능력이 확장된다.

### MCP 서버를 고르는 팁

레지스트리에서 MCP 서버를 고를 때:

1. **공식(@anthropic/) 먼저** — 안정성과 호환성이 높다
2. **GitHub 스타 수 확인** — 커뮤니티 검증 지표
3. **최근 업데이트 날짜** — 관리되고 있는지 확인
4. **제공하는 도구 수** — 너무 많으면 토큰 낭비 (최소 연결 원칙!)

---

## MCP가 토큰을 많이 쓰는 이유

MCP에는 중요한 주의점이 있다. **토큰을 많이 먹는다.**

### 왜?

MCP 도구를 호출하면, 도구의 **출력(tool output)**이 컨텍스트에 들어간다.

```
일반적인 파일 읽기:
  Read("config.json") → 파일 내용 50줄 → ~200 토큰

MCP를 통한 파일 읽기:
  mcp__filesystem__read_file("config.json")
  → MCP 프로토콜 메타데이터 + 파일 내용 50줄 + 응답 구조
  → ~400 토큰 (2배)
```

이게 한두 번이면 괜찮지만, MCP 도구를 10번 호출하면 차이가 커진다.

### tool output이 컨텍스트를 먹는 구조

Ch.9에서 배운 **Attention Budget(주의 예산)**을 떠올려보자.

```
컨텍스트 창 = 200,000 토큰이라고 할 때:

CLAUDE.md             →   500 토큰 (작음)
rules/                →   300 토큰 (작음)
사용자 대화           → 2,000 토큰 (보통)
코드 파일 읽기        → 3,000 토큰 (보통)
MCP 도구 출력 10번    → 5,000~15,000 토큰 (큼!)
```

MCP 도구 출력이 컨텍스트의 큰 부분을 차지할 수 있다. 특히:
- 데이터베이스 쿼리 결과 (수백 행)
- 브라우저 DOM 스냅샷 (수천 줄)
- API 응답 전체 (중첩된 JSON)

이것들이 컨텍스트에 쌓이면, 앞에서 읽은 CLAUDE.md나 코드 파일에 대한 "주의력"이 줄어든다.

---

## "최소 연결" 원칙

MCP는 **"많을수록 좋다"가 아니다.** 반대다.

### 나쁜 예: MCP 서버 10개 연결

```json
{
  "mcpServers": {
    "filesystem": { ... },
    "playwright": { ... },
    "slack": { ... },
    "notion": { ... },
    "linear": { ... },
    "sentry": { ... },
    "github": { ... },
    "postgres": { ... },
    "redis": { ... },
    "elasticsearch": { ... }
  }
}
```

문제:
- 각 MCP 서버가 제공하는 도구 목록이 컨텍스트에 들어감
- 10개 서버 × 서버당 5~10개 도구 = 50~100개 도구 설명
- **도구 설명만으로 수천 토큰 소비**
- 클로드가 어떤 도구를 써야 할지 혼란

### 좋은 예: 필요한 것만 연결

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-playwright"]
    }
  }
}
```

지금 프론트엔드 작업을 하고 있으니 Playwright만 연결. 나중에 Sentry가 필요하면 그때 추가.

### 판단 기준

```
이 MCP가 정말 필요한가?

질문 1: 이번 작업에서 이 외부 서비스를 써야 하는가?
  아니오 → 연결하지 않는다

질문 2: 클로드가 직접 해야 하는가, 내가 직접 하는 게 빠른가?
  내가 빠르다 → 연결하지 않는다

질문 3: 이 MCP 없이 작업을 못 하는가?
  할 수 있다 → 연결하지 않는다
```

**3번 모두 "예"일 때만 연결한다.**

---

## MCP의 범위: 프로젝트 vs 사용자

MCP 설정도 Ch.6에서 배운 범위(scope) 개념이 적용된다.

### 프로젝트 레벨

`.claude/settings.json`에 적으면 **이 프로젝트에서만** 적용:

```json
// .claude/settings.json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["@anthropic/mcp-playwright"] }
  }
}
```

팀원과 공유된다 (Git에 포함).

### 사용자 레벨

`~/.claude/settings.json`에 적으면 **모든 프로젝트에서** 적용:

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "filesystem": { "command": "npx", "args": ["@anthropic/mcp-filesystem"] }
  }
}
```

개인용. 어떤 프로젝트를 열든 이 MCP가 사용 가능.

**권장**: 대부분의 MCP는 프로젝트 레벨에 두자. 모든 프로젝트에서 쓰는 MCP는 거의 없다.

---

## 주요 MCP 서버 소개

초보자가 알면 좋은 대표적인 MCP 서버들:

| MCP 서버 | 하는 일 | 언제 쓰나 |
|----------|---------|----------|
| **Playwright** | 브라우저 조작 | 프론트엔드 테스트, UI 확인 |
| **Filesystem** | 파일 읽기/쓰기 | MCP 학습용 (Claude Code 자체 기능과 겹침) |
| **Sentry** | 에러 모니터링 | 에러 분석, 수정 제안 |
| **Slack** | 메시지 보내기/읽기 | 팀 알림, 상태 보고 |
| **Figma** | 디자인 가져오기 | 디자인→코드 변환 |
| **PostgreSQL** | DB 조회 | 데이터 확인, 마이그레이션 |

이 중에서 **Playwright**가 가장 실용적이다. 프론트엔드 개발을 하면 거의 필수.

---

## 파이썬 연결: 외부 라이브러리 (import)

MCP의 핵심은 **외부 도구를 가져와서 쓰는 것**이다. 파이썬에서 이 개념이 바로 **import**다.

### import — "이미 만들어진 도구 가져오기"

```python
# 파이썬에 기본 내장된 기능
print("안녕")  # 바로 쓸 수 있음

# 외부 라이브러리 가져오기
import requests  # HTTP 요청 도구

# 이제 외부 API에 접근 가능
response = requests.get("https://api.example.com/data")
print(response.json())
```

클로드도 마찬가지:

```
Claude Code 기본 기능:
  Read, Edit, Bash  # 바로 쓸 수 있음

MCP로 외부 도구 가져오기:
  claude mcp add playwright ...  # import와 같은 역할

이제 브라우저 조작 가능:
  mcp__playwright__navigate("http://localhost:3000")
```

### pip install → claude mcp add

```python
# 파이썬: 외부 라이브러리 설치 + 가져오기
pip install requests    # 설치
import requests         # 가져오기

# 클로드: MCP 서버 설치 + 연결
claude mcp add playwright npx @anthropic/mcp-playwright  # 설치+연결 동시
```

### "너무 많이 import하면" 문제

```python
# 나쁜 예: 안 쓰는 것까지 전부 import
import requests
import pandas
import numpy
import matplotlib
import seaborn
import scipy
import sklearn
import tensorflow
# → 메모리 낭비, 시작 느려짐

# 좋은 예: 필요한 것만
import requests
# → 가볍고 빠름
```

MCP도 똑같다. 안 쓰는 MCP 서버를 잔뜩 연결하면 토큰 낭비, 혼란 증가.

**import를 최소화하듯, MCP도 최소 연결.**

---

## 왜 이렇게 동작하는가

MCP는 소프트웨어 엔지니어링의 **어댑터 패턴(Adapter Pattern)**이다.

외부 서비스마다 API가 다르다:
- Slack은 REST API + WebSocket
- PostgreSQL은 SQL 프로토콜
- Sentry는 GraphQL API

클로드가 이걸 **각각 배우는 건 불가능**하다. 대신 MCP 서버가 **통일된 인터페이스**로 변환해준다.

```
Claude가 아는 것: MCP 프로토콜 하나
MCP 서버가 하는 것: MCP ↔ 각 서비스 API 변환

= USB처럼 하나의 포트로 모든 기기 연결
```

이게 "프로토콜(Protocol)"이라는 이름이 붙은 이유다. **약속된 통신 규격**이 있으면, 어떤 서비스든 이 규격만 맞추면 클로드와 연결된다.

---

## 변형해보기

1. **쉬운 과제**: `claude mcp list`를 실행해서 현재 연결된 MCP 서버가 있는지 확인해보자. 없다면 아무것도 안 해도 괜찮다.
2. **어려운 과제**: Playwright MCP를 설치하고, 아무 웹사이트에 접속해서 스크린샷을 찍어달라고 해보자.

---

## 다음 챕터로

Skill은 "절차"를, MCP는 "연결"을 제공한다. 이 둘을 **팀 전체가 같은 구성으로 바로 쓸 수 있게 묶으면** 어떨까?

Ch.14에서는 Skills, MCP, Hooks, 명령어 등을 **하나의 패키지로 묶는** Plugins & Connectors를 배운다.

---

## 이 챕터 핵심 3줄
- **MCP** = 클로드와 외부 도구를 연결하는 표준 인터페이스. `claude mcp add`로 설치, 스마트폰에 앱 깔듯이
- **토큰 주의**: MCP 도구 출력이 컨텍스트를 많이 먹는다. "최소 연결, 필요한 것만" 원칙 필수
- **파이썬 import와 같은 원리** — 외부 능력을 가져오되, 안 쓰는 건 연결하지 않는다
