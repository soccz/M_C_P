# Ch.14 Plugins & Connectors

> **이 챕터를 마치면**: Plugin이 무엇이고 왜 필요한지, Connector와 어떻게 다른지 이해한다. Cowork plugin과 Claude Code plugin의 차이를 알고, Plugin 명령어를 쓸 수 있다.

---

## 배경: 왜 묶어야 하는가

Ch.12에서 Skill(절차)을, Ch.13에서 MCP(연결)를 배웠다. 각각은 잘 동작하지만, **팀 전체가 같은 구성을 쓰게 하려면** 어떻게 해야 할까?

예를 들어 "코드 리뷰 자동화"를 팀에 배포하려면:

```
필요한 것들:
├── code-review Skill         (리뷰 체크리스트)
├── hooks (settings.json 내)   (Edit 후 자동 lint)
├── rules/review.md           (리뷰 규칙)
├── MCP: sentry 연결          (에러 데이터 참조)
└── 커스텀 명령어: /review     (한 번에 실행)
```

이걸 팀원 5명에게 "이 파일 복사하고, 이 MCP 설치하고, 이 Hook 넣어"라고 하나하나 알려줘야 하나?

**Plugin은 이 모든 것을 하나의 패키지로 묶는다.** `claude plugin install code-review` 한 번이면 전부 설치된다.

> **💭 생각의 흐름**
>
> **문제** — 코드 리뷰 자동화를 팀에 배포하고 싶다. Skill, Hook, MCP, 규칙이 각각 다른 파일에 있다
> **질문** — "이걸 어떻게 한 번에 배포하지?"
> **시도 1** — README에 설치 방법을 적었다 → 팀원마다 설정이 다르게 됨
> **시도 2** — 셸 스크립트로 자동화했다 → 업데이트 관리가 안 됨
> **발견** — Plugin으로 묶으면 설치, 업데이트, 활성화/비활성화가 명령어 하나로 된다
> **결론** — 개인은 Skill+MCP로 충분. **팀 배포**에는 Plugin이 필요하다

---

## Plugin이란

**Plugin = 역할 패키지**다. Skills, commands, agents, hooks, MCP 설정 등을 **하나로 묶은 배포 단위**다.

비유로 이해하자:

```
요리 비유:

Skill      = 레시피 한 장          (블로그 형식, 리뷰 절차)
MCP        = 주방 도구 하나         (칼, 오븐, 믹서)
Hook       = 주방 규칙 하나         (칼 쓴 후 항상 세척)
Plugin     = 완전한 주방 세트       (레시피 + 도구 + 규칙 + 식재료 목록)
```

레스토랑을 새로 차릴 때, 레시피 한 장씩 모으는 것보다 **"이탈리안 주방 세트"를 통째로 도입**하는 게 빠르다. Plugin이 바로 이것이다.

### Plugin에 들어갈 수 있는 것들

```
my-plugin/
├── skills/            # Skill 모음
│   ├── code-review/
│   └── deploy-check/
├── commands/          # 커스텀 명령어 (/review, /deploy)
├── hooks/             # Hook 설정
├── rules/             # 규칙 파일
├── mcp/               # MCP 서버 설정
└── plugin.json        # 플러그인 메타데이터
```

전부 넣을 필요는 없다. 필요한 것만 묶으면 된다.

---

## Cowork Plugin vs Claude Code Plugin

Plugin은 두 가지 세계에서 다르게 동작한다.

### Cowork Plugin — 비개발자를 위한 Plugin

**Cowork**은 Claude의 비개발자용 협업 환경이다. 여기서 Plugin은:

- **Customize 메뉴**에서 설치
- **Plugin Marketplace**에서 검색
- 클릭 몇 번으로 설치/제거
- 코드 편집이 아니라 **문서 작업, 분석, 소통**에 초점

```
Cowork Plugin 예시:
├── "주간 보고서 자동 생성" Plugin
├── "고객 피드백 분석" Plugin
└── "회의록 요약" Plugin
```

프로그래밍 지식 없이도 쓸 수 있다.

### Claude Code Plugin — 개발자를 위한 Plugin

**Claude Code**에서 Plugin은:

- **터미널 명령어**로 설치
- 코드 편집, 테스트, 배포 **개발 환경 확장**에 초점
- commands, LSP, hooks, MCP agents 등 **개발 도구**를 묶음

```
Claude Code Plugin 예시:
├── "코드 리뷰 자동화" Plugin
├── "CI/CD 파이프라인 관리" Plugin
└── "프론트엔드 컴포넌트 생성" Plugin
```

### 비교표

| | Cowork Plugin | Claude Code Plugin |
|---|---|---|
| **대상** | 비개발자 (기획, 마케팅, PM) | 개발자 |
| **설치 방법** | UI에서 클릭 | `claude plugin install` |
| **초점** | 문서, 분석, 소통 | 코드, 테스트, 배포 |
| **구성 요소** | 템플릿, 워크플로우 | commands, hooks, MCP, LSP |
| **마켓플레이스** | Customize → Plugin 탭 | npm / Git 레포지토리 |

이 교재는 Claude Code를 다루므로, **Claude Code Plugin**에 집중한다.

---

## Plugin 명령어

```bash
# 설치된 플러그인 목록 보기
claude plugin list

# 플러그인 설치
claude plugin install <이름 또는 경로>

# 플러그인 업데이트
claude plugin update <이름>

# 플러그인 비활성화 (삭제하지 않고 끄기)
claude plugin disable <이름>

# 플러그인 다시 활성화
claude plugin enable <이름>
```

### 설치 예시

```bash
# npm에서 설치
claude plugin install @team/code-review-plugin

# Git 레포지토리에서 설치
claude plugin install https://github.com/team/code-review-plugin

# 로컬 폴더에서 설치 (개발 중인 플러그인)
claude plugin install ./my-plugin
```

### enable/disable이 유용한 경우

Plugin을 삭제하지 않고 잠시 끄고 싶을 때:

```bash
# 프론트엔드 작업 중 → 프론트엔드 Plugin 활성화
claude plugin enable frontend-tools

# 백엔드 작업으로 전환 → 프론트엔드 Plugin 비활성화
claude plugin disable frontend-tools
claude plugin enable backend-tools
```

**작업 맥락에 따라 Plugin을 전환**할 수 있다. Ch.13에서 배운 "최소 연결" 원칙의 Plugin 버전이다.

---

## Connector란

**Connector = 서비스 연결 인터페이스**다. 하나의 외부 서비스에 대한 연결 하나.

MCP와 비슷해 보이지만, 개념적 위치가 다르다:

```
MCP        = 연결 프로토콜 (통신 규격)
Connector  = 그 프로토콜로 만든 실제 연결 (특정 서비스)
```

비유: **MCP는 USB 규격**이고, **Connector는 USB 케이블 하나**다. USB 규격(MCP)이 있으니까 다양한 케이블(Connector)을 만들 수 있는 것이다.

### 두 종류의 Connector

#### 1. Local Desktop Extension — 같은 컴퓨터 내 연결

```
Claude Code ──로컬──▶ 내 컴퓨터의 프로그램
```

예시:
- 로컬 파일 시스템 접근
- 로컬에서 실행 중인 DB
- 브라우저 자동화 (Playwright)

특징:
- 빠르다 (네트워크 안 탐)
- 내 컴퓨터에서만 동작
- 설정이 간단

#### 2. Remote Web Connector — 클라우드 서비스 연결

```
Claude Code ──인터넷──▶ 클라우드 서비스
```

예시:
- Asana (프로젝트 관리)
- Linear (이슈 트래킹)
- Notion (문서)
- Slack (메시징)
- GitHub (코드 호스팅)

특징:
- 인터넷 필요
- 인증(API 키, OAuth) 필요
- 팀 전체가 공유 가능

---

## Plugin과 Connector의 관계

핵심 구분: **Plugin은 묶음, Connector는 단일 연결.**

```
Plugin: "코드 리뷰 자동화"
├── Skill: 리뷰 체크리스트
├── Hook: Edit 후 자동 lint
├── Connector: Sentry 연결     ← Connector는 Plugin의 일부가 될 수 있다
├── Connector: GitHub 연결     ← 여러 Connector가 들어갈 수 있다
└── Command: /review
```

**Connector는 Plugin 안에 포함될 수 있다.** 하지만 Plugin 없이 단독으로도 쓸 수 있다.

### 전체 계층 관계

```
Plugin (가장 큰 묶음)
├── Skill (절차/지식)
├── Hook (자동화 규칙)
├── MCP 설정 (연결 프로토콜)
│   └── Connector (실제 연결)
│       ├── Local Extension (로컬)
│       └── Remote Connector (원격)
└── Command (커스텀 명령어)
```

가장 작은 단위(Connector)부터 가장 큰 단위(Plugin)까지, **필요한 수준만 쓰면 된다.**

- 연결 하나만 필요 → Connector (또는 MCP add)
- 절차 하나만 필요 → Skill
- 여러 개를 묶어 배포 → Plugin

---

## 파이썬 연결: 패키지와 모듈

Plugin의 핵심은 **여러 기능을 하나로 묶어 배포하는 것**이다. 파이썬에서 이 개념이 바로 **패키지(package)**다.

### 모듈 vs 패키지

```python
# 모듈 = 파일 하나 (Skill 하나와 비슷)
import math            # math.py 하나

# 패키지 = 폴더 하나에 여러 모듈 (Plugin과 비슷)
import requests        # requests/ 폴더 안에 여러 .py 파일
```

### 패키지의 구조

```
requests/              # 패키지 (= Plugin)
├── __init__.py        # 패키지 메타데이터 (= plugin.json)
├── api.py             # HTTP 요청 기능 (= Skill)
├── auth.py            # 인증 기능 (= Connector)
├── models.py          # 데이터 모델 (= rules)
└── utils.py           # 유틸리티 (= hooks)
```

### pip install = claude plugin install

```python
# 파이썬: 패키지 설치
pip install requests       # 패키지 설치
import requests            # 사용

# 클로드: 플러그인 설치
# claude plugin install code-review   # 설치
# /review                             # 사용
```

둘 다 **"누군가 만들어둔 묶음을 한 번에 설치"**한다. pip가 파이썬 생태계를 풍요롭게 만들듯, Plugin이 Claude Code 생태계를 풍요롭게 만든다.

---

## 왜 이렇게 동작하는가

Plugin은 소프트웨어 엔지니어링의 **조합 패턴(Composition Pattern)**이다.

작은 단위를 조합해서 큰 단위를 만드는 것:

- **함수** → 클래스로 묶음
- **클래스** → 모듈로 묶음
- **모듈** → 패키지로 묶음
- **Skill + MCP + Hook** → **Plugin으로 묶음**

이 패턴의 장점:
- **재사용**: 한 번 만들면 여러 팀에서 쓴다
- **일관성**: 팀원 모두 같은 구성
- **버전 관리**: `update` 한 번으로 전체 업데이트
- **활성/비활성**: 필요할 때만 켜고 끈다

프로그래밍 경험이 없어도, "여러 도구를 세트로 묶어서 한 번에 배포한다"는 개념은 직관적이다. 공구 세트를 사는 것과 같다 — 망치, 드라이버, 펜치를 따로 사는 것보다 **공구함 하나**를 사는 게 편하다.

---

## 변형해보기

1. **쉬운 과제**: `claude plugin list`를 실행해서 현재 설치된 Plugin이 있는지 확인해보자
2. **어려운 과제**: 자기 프로젝트에 필요한 Plugin의 구성을 상상해보자. 어떤 Skill, Hook, MCP, Command가 들어갈지 목록을 적어보자

---

## 다음 챕터로

Part 4에서 네 가지를 배웠다: **Skill(절차)**, **MCP(연결)**, **Plugin(묶음)**, **Connector(단일 연결)**.

이 네 가지가 각각 언제 필요한지, 어떻게 선택하는지 헷갈릴 수 있다. Ch.15에서는 **"같은 문제를 다른 방식으로 풀어보기"**를 통해 판단 기준을 확립한다.

---

## 이 챕터 핵심 3줄
- **Plugin** = Skill + MCP + Hook + Command를 하나로 묶은 배포 패키지. `claude plugin install`로 한 번에 설치
- **Connector** = 하나의 외부 서비스 연결. Local(같은 컴퓨터) / Remote(클라우드). Plugin 안에 포함되거나 단독 사용
- **개인은 Skill+MCP로 충분, 팀 배포에는 Plugin** — 파이썬의 모듈 vs 패키지와 같은 관계
