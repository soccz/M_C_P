# Ch.8 클로드의 습관 — Hooks

> **이 챕터를 마치면**: Hook이 무엇인지 이해하고, settings.json의 hooks 설정으로 "rm 실행 전 확인", "파일 수정 후 자동 lint" 같은 자동 규칙을 직접 만들 수 있다. 파이썬의 함수(def)를 이해한다.

---

## 배경: 규칙은 있는데, 지키는지 확인을 못 한다

Ch.5~7에서 CLAUDE.md, settings.json, rules/로 규칙을 만들었다. 하지만 이건 **"이렇게 해라"라고 말한 것**이지, **"어겼을 때 자동으로 잡아주는 것"**은 아니다.

사람 비유: 회사에 "코드 리뷰 없이 배포하지 마세요"라는 규칙이 있다. 하지만 규칙만 있으면 누군가는 잊고 배포한다. **자동 검사 시스템**(CI/CD)이 있으면 리뷰 없이 배포 버튼을 눌러도 시스템이 막아준다.

Hook은 클로드의 **자동 검사 시스템**이다. "이런 일이 생기면 → 자동으로 이렇게 해"라는 규칙.

> **💭 생각의 흐름**
>
> **문제** — 클로드가 `rm -rf`를 실행하려 할 때가 있다. 매번 눈으로 확인하기 힘들다
> **질문** — "위험한 명령을 자동으로 막을 수 없나?"
> **발견** — PreToolUse 훅으로 Bash 명령 실행 전에 검사 스크립트를 돌릴 수 있다
> **결과** — rm 명령이 포함된 Bash 호출은 자동으로 차단하는 훅을 만들었다

---

## Hook이란

Hook(훅)은 **특정 이벤트 전후에 자동으로 실행되는 규칙**이다.

일상에서의 예시:
- 현관문을 열면 → 자동으로 불이 켜진다 (모션 센서)
- 냉장고 문을 오래 열어두면 → 경고음이 울린다
- git push를 하면 → 자동으로 테스트가 돌아간다 (CI)

Claude Code에서:
- 파일을 수정하면 → **자동으로 lint 검사**
- Bash 명령을 실행하려 하면 → **위험 명령 차단**
- 작업이 끝나면 → **자동으로 테스트 실행**

---

## Hook의 두 가지 시점

### PreToolUse — 도구 실행 **전에**

클로드가 도구를 사용하기 **직전에** 실행된다. 여기서 차단하면 도구가 실행되지 않는다.

```
클로드: "rm -rf temp/ 실행할게요"
  ↓ [PreToolUse 훅 실행]
훅: "rm 명령 감지! 차단!"
  ↓
클로드: "이 명령은 차단되어 실행할 수 없습니다."
```

**용도:** 위험한 행동 사전 차단, 특정 파일 보호

### PostToolUse — 도구 실행 **후에**

클로드가 도구를 사용한 **직후에** 실행된다. 결과를 검사하거나 후속 작업을 자동화한다.

```
클로드: [파일 수정 완료]
  ↓ [PostToolUse 훅 실행]
훅: "lint 검사 실행..." → 결과: 2개 경고
  ↓
클로드: "lint 경고가 2개 있네요. 수정하겠습니다."
```

**용도:** 자동 검사, 포맷팅, 로그 기록

---

## Hook 4가지 타입

### 1. command 훅 — 셸 명령 실행

가장 기본적이고 가장 많이 쓴다. 셸 명령어를 실행하고 결과를 확인한다.

```json
{
  "type": "command",
  "command": ".claude/hooks/block-rm.sh"
}
```

### 2. prompt 훅 — 클로드가 직접 판단

클로드에게 "이 동작이 안전한지 판단해봐"라고 묻는 방식. `"type": "prompt"`로 설정한다.

### 3. agent 훅 — 서브에이전트가 검사

별도 에이전트가 도구를 사용하며 검사를 수행한다. 더 복잡한 판단이 필요할 때. `"type": "agent"`로 설정한다.

### 4. http 훅 — 외부 서비스 호출

외부 서비스에 HTTP POST를 보내 알림이나 승인을 받는 방식. `"type": "http"`로 설정한다.

**초보자는 command 훅만 알면 충분하다.** 나머지는 필요할 때 배우면 된다.

---

## Conditional `if` hooks 🆕 (2026-W13 추가)

### 배경 — "모든 Edit에 lint를 걸면 느리다"

앞서 배운 matcher는 "이 도구를 쓸 때"까지만 걸러낸다. 그런데 실무에서는 더 세밀한 조건이 자주 필요하다.

- "Edit이 `src/**/*.ts`일 때만 타입체크 실행"
- "Bash가 `npm test`일 때는 훅 건너뛰기" (어차피 테스트는 스스로 돌아가니까)
- "Write가 새 파일일 때만 템플릿 검사"

2026년 3월 말 업데이트로 **`if` 필드**가 추가됐다. matcher 아래에 조건식을 하나 더 쓸 수 있다.

### 기본 문법

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "if": "tool_input.file_path matches '^src/.*\\.(ts|tsx)$'",
        "hooks": [
          {
            "type": "command",
            "command": "npm run typecheck"
          }
        ]
      }
    ]
  }
}
```

위 훅은:
- **matcher**: Edit 도구일 때 발화 후보
- **if**: 파일 경로가 `src/**/*.ts` 또는 `src/**/*.tsx`일 때만 실제 실행
- 두 조건이 모두 맞을 때만 `npm run typecheck`가 돈다

### `if` 안에서 쓸 수 있는 필드

| 필드 | 의미 | 예시 |
|---|---|---|
| `tool_input.file_path` | Edit/Write가 건드는 파일 경로 | `tool_input.file_path matches 'src/.*'` |
| `tool_input.command` | Bash 명령 전체 문자열 | `tool_input.command contains 'rm'` |
| `tool_input.pattern` | Grep/Glob 패턴 | `tool_input.pattern == 'TODO'` |
| `session.cwd` | 현재 작업 디렉터리 | `session.cwd matches '/work/api/.*'` |

### 실전 예시 3종

**1) 특정 폴더에만 포맷터 적용**

```json
{
  "matcher": "Edit",
  "if": "tool_input.file_path matches '^packages/ui/.*'",
  "hooks": [
    { "type": "command", "command": "cd packages/ui && npm run format" }
  ]
}
```

UI 패키지만 포맷하고, 백엔드 폴더는 건드리지 않는다.

**2) 위험 명령을 조건부로만 차단**

```json
{
  "matcher": "Bash",
  "if": "tool_input.command contains 'rm -rf' and not tool_input.command contains 'rm -rf /tmp/'",
  "hooks": [
    { "type": "command", "command": ".claude/hooks/block.sh" }
  ]
}
```

`rm -rf /tmp/` 같은 안전한 임시 폴더 정리는 통과, 나머지 `rm -rf`는 차단.

**3) 새 파일 생성 시에만 CLAUDE.md 갱신 제안**

```json
{
  "matcher": "Write",
  "if": "tool_input.file_path matches 'src/.*\\.(ts|tsx)$' and session.is_new_file",
  "hooks": [
    { "type": "command", "command": ".claude/hooks/suggest-claude-md-update.sh" }
  ]
}
```

### 왜 중요한가

`if`가 없으면 훅 스크립트 안에서 직접 파일 경로를 파싱해서 걸러내야 했다. 그러면:
- 훅 스크립트 = 로직 덩어리가 됨
- 매번 훅이 발화되므로 속도 저하
- 디버깅 어려움

`if`는 이 필터링을 settings.json 선언부로 끌어올려서 **훅이 실제로 돌아야 할 때만 돌게** 한다. "matcher + if" 두 단계 필터링이라고 기억하면 된다.

---

## settings.json의 hooks 구조

Hooks는 **settings.json 안에** 정의한다. 별도 파일이 아니라 permissions와 같은 레벨의 설정이다.

```json
{
  "permissions": { "allow": ["Read", "Edit"] },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/check-bash.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint"
          }
        ]
      }
    ]
  }
}
```

위치: `.claude/settings.json`(팀 공유) 또는 `.claude/settings.local.json`(개인)에 작성한다.

### 구조 분해

```
settings.json
└── hooks
    ├── PreToolUse (실행 전)
    │   └── matcher: "Bash" → 이 도구를 쓸 때
    │       └── command: 검사 스크립트
    └── PostToolUse (실행 후)
        └── matcher: "Edit" → 이 도구를 쓴 후
            └── command: lint 실행
```

**matcher** — 어떤 도구에 반응할지 지정
- `"Bash"` — Bash 명령 실행 시
- `"Edit"` — 파일 수정 시
- `"Write"` — 파일 생성 시
- `"Read"` — 파일 읽기 시

---

## 실전 1: rm 명령 차단 훅

### 목표
클로드가 `rm` 명령을 실행하려 하면 자동으로 차단한다.

### 스크립트 만들기

```bash
#!/bin/bash
# .claude/hooks/block-rm.sh
# Bash 명령에서 rm이 포함되어 있으면 차단

# 클로드가 실행하려는 명령이 stdin으로 JSON 형태로 들어옴
# tool_input 필드에 실제 명령이 있다
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1)

if echo "$COMMAND" | grep -q "rm "; then
    echo "BLOCKED: rm 명령은 자동 실행할 수 없습니다."
    echo "직접 터미널에서 실행하세요."
    exit 1  # 0이 아닌 값 = 차단
fi

exit 0  # 0 = 통과
```

### 실행 권한 부여
```bash
chmod +x .claude/hooks/block-rm.sh
```

### settings.json에 등록

`.claude/settings.json`(또는 `.claude/settings.local.json`)에 hooks 섹션을 추가한다:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

### 테스트
Claude Code에서: "temp 폴더를 삭제해줘"

클로드가 `rm -rf temp/`를 실행하려 하면 훅이 차단한다.

---

## 실전 2: 파일 수정 후 자동 lint

### 목표
파일을 수정할 때마다 자동으로 lint를 실행한다.

### settings.json에 추가

`.claude/settings.json`의 hooks 섹션에 PostToolUse를 추가한다:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint"
          }
        ]
      }
    ]
  }
}
```

이게 끝이다. 클로드가 파일을 수정할 때마다 `npm run lint`가 자동으로 실행되고, 결과가 클로드에게 전달된다. lint 에러가 있으면 클로드가 알아서 수정한다.

---

## Hook과 allowlist의 관계

Ch.6에서 배운 settings.json의 allow/deny와 Hook은 **다른 레이어**에서 동작한다.

```
사용자 요청
  ↓
[settings.json] allow에 있나? → 허용
  ↓ 없으면
[settings.json] deny에 있나? → 차단
  ↓ 허용 또는 사용자 승인 후
[PreToolUse Hook] 실행 → 차단할 수 있음
  ↓ 통과
[도구 실행]
  ↓
[PostToolUse Hook] 실행 → 검사/후처리
```

**settings.json** = 1차 관문 (허용/차단)
**Hook** = 2차 관문 (세밀한 검사)

둘 다 쓰면 이중 안전장치가 된다.

---

## 🐍 함수(def) — Hook도 결국 "이벤트 → 함수 호출"

Hook의 원리를 파이썬으로 이해해보자. Hook은 결국 **"어떤 일이 생기면 미리 등록한 함수를 실행한다"**는 패턴이다.

### 함수란

함수는 **이름이 붙은 코드 묶음**이다. 한 번 만들어두면 언제든 불러서 쓸 수 있다.

```python
def greet(name):
    """인사하는 함수"""
    print(f"안녕하세요, {name}님!")

# 함수 호출
greet("클로드")     # 안녕하세요, 클로드님!
greet("제미나이")   # 안녕하세요, 제미나이님!
```

### 함수의 구조

```python
def 함수이름(매개변수):
    """설명 (선택)"""
    # 실행할 코드
    return 결과값    # 선택
```

- `def` — "함수를 정의한다"
- `함수이름` — 이 함수를 부를 이름
- `매개변수` — 함수에 넣는 입력값
- `return` — 함수의 결과. 없으면 None을 돌려줌

### 기본 예시들

```python
# 매개변수 없는 함수
def say_hello():
    print("안녕!")

# 매개변수 있는 함수
def add(a, b):
    return a + b

# 기본값이 있는 매개변수
def greet(name, greeting="안녕하세요"):
    print(f"{greeting}, {name}님!")

# 여러 값 반환
def divide(a, b):
    quotient = a // b
    remainder = a % b
    return quotient, remainder

# 사용
say_hello()                    # 안녕!
result = add(3, 5)             # 8
greet("클로드")                # 안녕하세요, 클로드님!
greet("클로드", "반갑습니다")   # 반갑습니다, 클로드님!
q, r = divide(10, 3)          # q=3, r=1
```

### Hook을 파이썬으로 구현하면

```python
# 훅 시스템을 파이썬으로 이해하기

# 훅 함수 등록
def check_dangerous_command(command):
    """PreToolUse 훅: 위험 명령 검사"""
    dangerous = ["rm", "drop", "delete"]
    for word in dangerous:
        if word in command:
            return False  # 차단
    return True  # 통과

def auto_lint(file_path):
    """PostToolUse 훅: 자동 lint"""
    print(f"[자동 lint] {file_path} 검사 중...")
    # 실제로는 여기서 lint 실행
    print(f"[자동 lint] 통과!")

# 클로드의 동작 시뮬레이션
def claude_execute(tool, target):
    """클로드가 도구를 실행하는 과정"""
    
    # PreToolUse 훅
    if tool == "Bash":
        if not check_dangerous_command(target):
            print(f"❌ 차단: '{target}' 은 위험한 명령입니다")
            return
    
    # 도구 실행
    print(f"✅ 실행: {tool}({target})")
    
    # PostToolUse 훅
    if tool == "Edit":
        auto_lint(target)

# 테스트
claude_execute("Bash", "npm test")       # ✅ 실행
claude_execute("Bash", "rm -rf /")       # ❌ 차단
claude_execute("Edit", "src/app.ts")     # ✅ 실행 + 자동 lint
```

### 클로드와의 연결

| 파이썬 | Hook |
|--------|------|
| `def check(command)` | 훅 스크립트 (block-rm.sh) |
| `if word in command` | matcher ("Bash") |
| `return False` | exit 1 (차단) |
| `return True` | exit 0 (통과) |

**함수를 이해하면 Hook이 보인다.** "어떤 조건이면 → 이 동작을 실행한다"는 패턴이 동일하다.

---

## 실습: 직접 해보기

### 실습 1: 훅 폴더 만들기
```bash
mkdir -p .claude/hooks
```

### 실습 2: rm 차단 훅 만들기
Claude Code에서:
```
.claude/hooks/block-rm.sh를 만들어줘.
Bash 명령에 rm이 포함되면 차단하는 스크립트야.
그리고 .claude/settings.json의 hooks에 PreToolUse로 등록해줘.
```

### 실습 3: 자동 lint 훅
settings.json의 hooks에 PostToolUse → Edit → `npm run lint` 추가. 파일을 수정하고 자동으로 lint가 실행되는지 확인.

### 실습 4: 파이썬 함수
```python
# calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

# 사용
print(f"3 + 5 = {add(3, 5)}")
print(f"10 - 3 = {subtract(10, 3)}")
print(f"4 × 7 = {multiply(4, 7)}")
```

---

## 잘 안 된다면

| 증상 | 원인 | 해결 |
|------|------|------|
| 훅이 실행 안 됨 | 실행 권한 없음 | `chmod +x .claude/hooks/스크립트.sh` |
| 훅이 항상 차단 | exit 코드가 항상 1 | 스크립트 로직 확인. 통과 시 `exit 0` |
| 훅 등록 후 반응 없음 | settings.json hooks 섹션 문법 에러 | JSON 유효성 확인. 쉼표, 중괄호 체크 |
| 어떤 훅이 등록됐는지 모름 | | `.claude/settings.json` 또는 `.claude/settings.local.json`의 hooks 섹션 확인 |

---

## 왜 이렇게 동작하는가

Hook 패턴은 프로그래밍에서 매우 오래된 개념이다. **이벤트 기반 프로그래밍(Event-driven programming)**이라고 한다.

- 웹사이트에서 버튼을 클릭하면 → 함수가 실행된다 (onClick)
- 파일이 변경되면 → 자동으로 빌드된다 (file watcher)
- git commit을 하면 → 자동으로 테스트가 돌아간다 (pre-commit hook)

Claude Code의 Hook도 같은 원리다. **이벤트(도구 사용) → 반응(스크립트 실행)**. 이 패턴을 이해하면 Ch.12(Skills)에서 더 복잡한 자동화를 만들 때도 같은 원리가 적용된다.

---

## 변형해보기

1. **쉬운 과제**: `.env` 파일을 읽으려 할 때 경고 메시지를 출력하는 PreToolUse 훅을 만들어보자.
2. **어려운 과제**: Write(파일 생성) 후에 자동으로 `git add`를 실행하는 PostToolUse 훅을 만들어보자.

---

## 다음 챕터로

Part 2가 끝났다! 클로드의 **기억**(CLAUDE.md, Memory), **설정**(settings.json), **규칙**(rules/), **습관**(Hooks)을 모두 배웠다.

Part 3에서는 **대화의 기술**로 들어간다. 프롬프트 엔지니어링, 컨텍스트 엔지니어링, 하네스 엔지니어링 — 클로드를 전문가처럼 다루는 3가지 기술이다.

---

## 이 챕터 핵심 3줄
- **Hook** = "이런 일이 생기면 자동으로 이렇게 해" — 규칙을 **자동으로 지키게** 만드는 장치
- **PreToolUse**(실행 전 차단) + **PostToolUse**(실행 후 검사) — 이중 안전장치
- 🐍 **함수(def)** = Hook의 원리. "이벤트 → 함수 호출" 패턴이 동일하다
