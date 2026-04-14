# Ch.22 Channels

> **이 챕터를 마치면**: Channel이 무엇인지, 어떻게 외부 이벤트를 실행 중인 세션으로 전달하는지 이해한다. Dispatch, Remote Control, Channels, Claude Code on the web 네 가지 원격 기능의 차이를 설명할 수 있다.

---

## 배경: 클로드가 바깥 세상과 소통하다

지금까지 클로드와의 소통은 항상 **내가 먼저** 시작했다. 터미널을 열거나, Cowork에서 작업을 지시하거나. 하지만 실무에서는 **바깥에서 이벤트가 먼저 오는** 경우가 많다.

- CI가 실패했다 → 클로드에게 자동으로 알려주고 싶다
- Telegram에서 팀원이 질문했다 → 클로드가 바로 답하게 하고 싶다
- 배포가 완료됐다 → 클로드가 다음 단계를 자동 시작하게 하고 싶다

이것이 **Channel**이다. 외부 이벤트를 실행 중인 Claude Code 세션으로 **밀어넣는(push)** 경로.

> **💭 생각의 흐름**
>
> **문제** — CI가 새벽에 실패했는데, 아침에 출근해서야 알았다. 클로드가 이미 돌고 있었으면 자동으로 고칠 수 있었을 텐데
> **질문** — "외부 이벤트를 클로드 세션으로 자동으로 보낼 수 있나?"
> **발견** — **Channel**은 MCP 서버가 외부 이벤트를 받아서 실행 중인 세션으로 push하는 구조다. Telegram, Discord, 커스텀 webhook까지 연결 가능
> **결론** — Channel을 쓰면 클로드가 **"기다리는" 상태**가 가능해진다 — 이벤트가 올 때만 반응

---

## Channel이란

### 한 줄 정의

**Channel = 외부 이벤트를 실행 중인 Claude Code 세션으로 쏘아주는 경로.**

기존 방식과의 차이:

```
기존 (polling — 내가 확인):
  나 → "CI 결과 확인해봐" → 클로드 확인 → 보고
  나 → "또 확인해봐" → ...

Channel (push — 이벤트가 온다):
  CI 실패 → Channel → 클로드 세션에 자동 전달
  Telegram 메시지 → Channel → 클로드가 읽고 답장
```

핵심 특성:
- **세션이 열려 있어야** 이벤트를 받을 수 있다 (세션 닫히면 수신 불가)
- **양방향** 가능 — 클로드가 이벤트를 읽고, 같은 채널로 답장할 수 있다
- MCP 서버 기반으로 동작한다 (Ch.13에서 배운 MCP의 확장)

### Channels는 Research Preview

```
⚠️ 중요: Channels는 2026년 4월 현재 Research Preview 기능이다.

- Claude Code v2.1.80 이상 필요
- --channels 플래그 문법과 프로토콜이 변경될 수 있음
- Team/Enterprise 환경에서는 관리자가 명시적으로 활성화해야 함
- claude.ai 로그인 필요 (API 키만으로는 사용 불가)
```

Research Preview라는 것은 **아직 실험 단계**라는 뜻이다. 기능은 동작하지만, 인터페이스나 설정 방법이 바뀔 수 있다. 이 책에서는 현재 동작 방식을 기준으로 설명한다.

---

## 지원 채널 타입

| 채널 | 방식 | 필요한 것 | 용도 |
|---|---|---|---|
| **Telegram** | 봇 polling | BotFather 토큰 | 모바일에서 클로드와 대화 |
| **Discord** | 봇 연결 | Discord Developer Portal 봇 | 팀 채널에서 클로드 호출 |
| **iMessage** | 로컬 DB 읽기 | macOS 전용 | 문자로 클로드와 소통 |
| **fakechat** | localhost 데모 | 없음 | 테스트용 |
| **커스텀** | webhook 등 | 개발 필요 | CI, 배포, 모니터링 연동 |

가장 실용적인 것은 **Telegram**이다. 설정이 간단하고, 모바일에서 클로드와 대화할 수 있다.

---

## 채널 설정법 (Telegram 예시)

### 1단계: Telegram 봇 만들기

Telegram에서 **BotFather**에게 `/newbot` 명령을 보내면 봇 토큰을 받는다. 이 토큰이 클로드와 Telegram을 연결하는 열쇠다.

### 2단계: 플러그인 설치

```bash
# Claude Code에서 Telegram 채널 플러그인 설치
/plugin install telegram@claude-plugins-official
```

### 3단계: 토큰 설정

```bash
# BotFather에게 받은 토큰으로 설정
/telegram:configure <YOUR_BOT_TOKEN>
```

토큰은 `~/.claude/channels/telegram/.env`에 저장된다.

### 4단계: 채널 활성화

```bash
# --channels 플래그로 세션 시작
claude --channels plugin:telegram@claude-plugins-official
```

### 5단계: 보안 설정

```bash
# Telegram에서 봇에 메시지를 보내면 pairing code가 출력됨
/telegram:access pair <pairing-code>

# 허용 목록 방식으로 전환 (pair한 계정만 메시지 가능)
/telegram:access policy allowlist
```

**보안**: allowlist 방식으로 인증된 사용자만 메시지를 보낼 수 있다. 모르는 사람이 봇에게 메시지를 보내도 무시된다.

### 동작 흐름

```
설정 완료 후:

1. 나 (Telegram) → "CI 빌드 상태 확인해줘"
2. Telegram 봇 → Channel → Claude Code 세션에 메시지 전달
3. Claude → 빌드 상태 확인 → 결과 생성
4. Claude → Channel → Telegram 봇 → 나에게 답장

= 채팅 앱에서 클로드와 실시간 대화
```

---

## Dispatch vs Remote Control vs Channels vs Claude Code on the web

Part 6에서 **"원격으로 클로드를 쓰는 방법"**이 여러 가지 등장한다. 헷갈리기 쉬우니 한 번에 정리한다.

### 4종 비교표

| | **Dispatch** | **Remote Control** | **Channels** | **Code on the web** |
|---|---|---|---|---|
| **한 마디** | 새 작업 보내기 | 기존 세션 이어받기 | 외부 이벤트 수신 | 클라우드에서 작업 |
| **방향** | 앱 → 로컬 | 웹/앱 → 로컬 | 외부 → 로컬 | 웹 → 클라우드 |
| **Claude 실행 위치** | 내 컴퓨터 (Desktop) | 내 컴퓨터 (CLI/VSCode) | 내 컴퓨터 (CLI) | Anthropic 클라우드 |
| **최적 용도** | 자리 비울 때 위임 | 다른 기기에서 조종 | 이벤트에 반응 | 로컬 설정 없이 작업 |
| **세션** | 새로 생성 | 기존 세션 연결 | 기존 세션에 push | 새로 생성 (클라우드) |

### 비유로 이해하기

```
Dispatch = 택배 주문
  "이거 만들어줘" → 집에 있는 클로드가 작업 시작

Remote Control = 원격 데스크톱
  집에서 작업 중인 클로드를 카페에서 원격으로 조종

Channels = 인터폰
  외부에서 "벨" 누르면 → 집에 있는 클로드가 반응

Code on the web = 임시 사무실
  집이 아니라 클라우드에 임시 사무실을 열어서 작업
```

### 언제 무엇을 쓰나

```
"자리를 비우는데 작업을 맡기고 싶다"
  → Dispatch (모바일 앱에서 보내고 나중에 확인)

"이미 돌고 있는 작업을 다른 기기에서 보고 싶다"
  → Remote Control (claude.ai/code에서 연결)

"외부 이벤트(CI 실패, 채팅 메시지)에 자동 반응하게 하고 싶다"
  → Channels

"로컬 환경 설정 없이, GitHub 레포에서 바로 작업하고 싶다"
  → Claude Code on the web
```

---

## Channel의 제약과 주의사항

### 세션이 열려 있어야 한다

Channel의 가장 큰 제약이다. 세션이 닫히면 이벤트를 받을 수 없다.

```
✅ 이벤트 수신 가능:
  터미널이 열려 있고, claude --channels ... 로 시작된 세션

❌ 이벤트 수신 불가:
  터미널을 닫았거나, Claude Code를 종료한 상태
```

24시간 수신이 필요하면:
- background 프로세스나 persistent terminal(tmux 등)을 사용
- 또는 Claude Code on the web으로 클라우드에서 실행

### 권한 프롬프트가 세션을 멈춘다

Claude가 도구를 사용할 때 권한 확인이 필요하면, 사용자 승인을 기다리며 세션이 일시 정지된다. 원격에서 쓰려면:
- 신뢰 환경에서 `--dangerously-skip-permissions` 사용 (주의 필요)
- 또는 허용 목록(allowlist)을 넉넉하게 설정

### Research Preview 제약

- 공식 allowlist에 있는 플러그인만 사용 가능
- 커스텀 채널 테스트: `--dangerously-load-development-channels` 플래그 필요
- Team/Enterprise: 관리자가 `channelsEnabled: true`로 명시적 활성화 필요

---

## 왜 이렇게 동작하는가

Channel의 설계 원리는 **이벤트 드리븐 아키텍처(event-driven architecture)**다.

기존의 **polling**(내가 주기적으로 확인)에서 **push**(이벤트가 올 때만 반응)로 전환하면:
1. **불필요한 확인이 없어진다** — 변화가 없으면 아무것도 안 한다
2. **반응 시간이 빨라진다** — 이벤트 발생 즉시 처리
3. **토큰이 절약된다** — polling은 매번 컨텍스트를 소비하지만, push는 이벤트가 있을 때만

이것은 소프트웨어 세계에서 **webhook**이 API polling을 대체한 것과 같은 진화다. Ch.8에서 배운 Hook이 "이벤트 → 자동 실행"이었듯, Channel은 **외부 이벤트 → 세션 내 자동 실행**이다.

---

## 변형해보기

1. **쉬운 과제**: Dispatch, Remote Control, Channels, Code on the web 네 가지 중 자신의 업무에 가장 먼저 필요한 것은 무엇인지 골라보자. 왜 그것이 먼저인가?
2. **어려운 과제**: Telegram BotFather에서 봇을 만들고 토큰을 받아보자 (아직 Claude와 연결하지 않아도 됨). 봇 생성 과정 자체가 Channel 이해의 시작이다

---

## 다음 챕터로

Channel이 **이벤트에 반응**하는 것이라면, Scheduled Tasks는 **시간에 반응**하는 것이다. "매주 월요일 아침에", "매일 저녁에" — 정해진 시간에 자동으로 작업을 실행하는 방법을 Ch.23에서 다룬다.

---

## 이 챕터 핵심 3줄
- **Channel = 외부 이벤트를 실행 중인 Claude Code 세션으로 push하는 경로.** Telegram, Discord, iMessage, 커스텀 webhook 지원. MCP 서버 기반
- **4종 비교**: Dispatch(새 작업 보내기) / Remote Control(기존 세션 이어받기) / Channels(외부 이벤트 수신) / Code on the web(클라우드 작업). 택배·원격데스크톱·인터폰·임시사무실
- **제약**: 세션이 열려 있어야 수신 가능. Research Preview 상태(2026년 4월). 24시간 수신은 persistent terminal 필요
