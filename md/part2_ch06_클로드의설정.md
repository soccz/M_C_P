# Ch.6 클로드의 설정

> **이 챕터를 마치면**: settings.json으로 클로드의 권한을 제어할 수 있고, 4가지 권한 모드의 차이를 이해하고, 상황에 맞는 설정을 고를 수 있다.

---

## 배경: "이 파일 수정해도 될까요?"가 매번 나온다

Claude Code를 쓰다 보면 이런 메시지가 자주 나온다:

```
Claude wants to use Edit tool on src/config.ts
[Allow] [Deny]
```

처음엔 안전하다고 느낀다. 하지만 파일 10개를 수정하는 작업을 시킬 때 10번 Allow를 누르면 피로해진다. 반대로, 아무런 확인 없이 `.env` 파일을 건드리면 위험하다.

**settings.json은 이 균형을 잡는 파일이다.** "이건 허용, 이건 금지, 이건 물어봐"를 미리 정해두는 것.

> **💭 생각의 흐름**
>
> **문제** — 테스트 실행할 때마다 "Bash(npm test) 허용할까요?" 묻는 게 번거롭다
> **질문** — "자주 쓰는 명령은 자동 허용할 수 없나?"
> **발견** — settings.json의 `allow`에 넣으면 묻지 않고 바로 실행
> **결과** — npm test, npm run lint는 자동 허용, rm이나 .env 접근은 차단으로 설정

---

## settings.json 해부

### 위치

```
my-project/.claude/settings.json
```

### 기본 구조

```json
{
  "$schema": "https://cdn.jsdelivr.net/npm/@anthropic-ai/claude-code@latest/config-schema.json",
  "model": "claude-sonnet-4-6",
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "Bash(npm test)",
      "Bash(npm run lint)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  },
  "env": {
    "DEBUG": "true"
  }
}
```

### 각 항목 설명

**`$schema`** — 이 파일이 어떤 형식을 따르는지 알려주는 주소. 자동 검증과 자동완성을 도와준다. 그냥 넣어두면 된다.

**`model`** — 이 프로젝트에서 사용할 모델을 고정한다. `"claude-sonnet-4-6"`, `"claude-opus-4-6"` 등. 설정하지 않으면 기본 모델이 사용된다.

**`env`** — 클로드 세션에서 사용할 환경변수. 디버그 모드 켜기, API 키 경로 지정 등에 유용하다.

**`permissions.allow`** — 클로드가 **묻지 않고 바로 할 수 있는 것** 목록
- `"Read"` — 파일 읽기
- `"Edit"` — 파일 수정
- `"Write"` — 파일 쓰기
- `"Glob"` — 파일 패턴 검색
- `"Grep"` — 파일 내용 검색
- `"Bash(npm test)"` — 이 명령어 실행
- `"Bash(npm run lint)"` — 이 명령어 실행

**`permissions.deny`** — 클로드가 **절대 할 수 없는 것** 목록
- `"Read(./.env)"` — .env 파일 읽기 금지
- `"Read(./.env.*)"` — .env.로 시작하는 모든 파일 읽기 금지

### allow에도 deny에도 없는 것은?

**매번 물어본다.** 이게 기본(default) 모드다. allow에 넣으면 자동 허용, deny에 넣으면 차단, 둘 다 아니면 사용자에게 물어본다.

```
판단 순서: allow 확인 → deny 확인 → 둘 다 없으면 물어보기

allow에 있나? → 허용
deny에 있나? → 차단
둘 다 아니면 → "허용할까요?" 질문
```

---

## 설정 우선순위

settings.json이 여러 곳에 있을 수 있다. 어떤 게 우선인가?

```
Managed (조직 관리자) > Command Line (실행 시 플래그) > Local (개인) > Project (프로젝트) > User (전역)
```

| 순위 | 위치 | 역할 | 예시 |
|------|------|------|------|
| 1 | **Managed** | 조직이 강제하는 정책 | Enterprise 관리자 설정 |
| 2 | **CLI args** | 실행할 때 붙이는 플래그 | `claude --allowedTools "Read,Edit"` |
| 3 | **Local** | `.claude/settings.local.json` (git 제외) | 개인 API 키, 개인 편의 설정 |
| 4 | **Project** | `.claude/settings.json` (git 포함) | 팀 공유 규칙 |
| 5 | **User** | `~/.claude/settings.json` | 내 모든 프로젝트 기본값 |

**실무에서 중요한 것:**
- **Project** (`.claude/settings.json`) — 팀원 모두에게 같은 규칙 적용. git에 올린다.
- **Local** (`.claude/settings.local.json`) — 내 개인 설정. git에 안 올린다. `.gitignore`에 추가.

> **💭 생각의 흐름**
>
> **문제** — 팀원마다 다른 settings.json을 쓰면 "내 PC에서는 되는데?" 문제 발생
> **질문** — "팀 공통 설정은 어떻게?"
> **발견** — settings.json은 git에 올리고, 개인 차이는 settings.local.json에
> **결과** — 팀 전체 규칙은 project, 개인 편의는 local로 분리

---

## 권한 모드 비교

Claude Code는 여러 권한 모드를 제공한다. 핵심 4가지를 먼저 배우고, 나머지 2개도 알아두자.

### 1. default — 기본 모드

```bash
claude
```

- allow에 있으면 자동 실행, deny에 있으면 차단, 나머지는 물어봄
- **장점**: 안전함. 모르는 동작은 확인 후 실행
- **단점**: 승인 피로. 파일 많이 수정할 때 번거로움
- **추천**: 처음 시작할 때, 낯선 프로젝트

### 2. plan — 계획 우선 모드

```bash
claude --permission-mode plan
```

- 코드를 바로 수정하지 않고, **먼저 계획을 세우고 승인 후 실행**
- **장점**: 실수 방지. 큰 작업에서 방향 확인 가능
- **단점**: 속도 느림. 간단한 작업에는 과한 절차
- **추천**: 복잡한 리팩터링, 여러 파일 동시 수정, 처음 보는 코드베이스

### 3. acceptEdits — 편집 수락 활성화

```bash
claude --permission-mode acceptEdits
```

- 파일 수정(Edit)을 자동 허용. 사소한 수정에 매번 물어보지 않음
- **장점**: 빠른 반복 작업
- **단점**: 의도치 않은 파일 수정 위험
- **추천**: 신뢰된 작업, 테스트 통과 확인이 있는 환경

### 4. bypassPermissions — 권한 건너뛰기

```bash
claude --dangerously-skip-permissions   # 주의: 모든 권한 확인을 건너뜀
```

- **모든 도구를 묻지 않고 실행**. 가장 빠르지만 가장 위험
- **장점**: 최고 속도. 자동화에 유용
- **단점**: 잘못된 명령도 바로 실행됨
- **추천**: 실험 환경, 안전한 테스트 환경에서만. **프로덕션 절대 금지**

### 5. auto — 자동 판단 모드 🆕 (2026-W13 Research Preview)

```bash
claude --permission-mode auto
```

**2026년 3월 말에 추가된 가장 중요한 모드다.** default와 `--dangerously-skip-permissions` 사이의 **중간 지대**를 메운다.

동작 방식:
- 권한이 필요한 순간마다 **분류기(classifier)**가 동작을 분석한다
- 안전한 동작 (읽기, 테스트 실행, 일반적인 편집) → **자동 실행**
- 위험한 동작 (rm, .env 접근, git push --force, 외부 네트워크 호출) → **차단 또는 질문**
- default처럼 매번 묻지 않고, bypass처럼 무모하지도 않다

```
default           → 모르면 다 묻는다 (승인 피로)
auto 🆕           → 분류기가 판단: 안전하면 자동, 위험하면 차단
bypassPermissions → 전부 허용 (위험)
```

언제 쓰나:
- 신뢰 가능한 작업 환경 (개인 레포, 테스트 브랜치)
- "승인 버튼 피로"는 줄이되 "rm 사고"는 막고 싶을 때
- Research preview 단계이므로 **프로덕션 중요 작업에는 default 권장**

> Research preview 주의: 분류기 판단이 항상 완벽하지 않다. 중요한 작업은 여전히 default로 시작하고, 반복 작업이 많아졌을 때만 auto로 전환하자.

### 6. dontAsk — 질문 안 하기 모드

```bash
claude --permission-mode dontAsk
```

- allow에 없는 작업은 **물어보지 않고 건너뜀** (차단이 아니라 스킵)
- 자동화 파이프라인에서 사용자 입력이 불가능할 때 유용

### 비교표

| 모드 | 속도 | 안전 | 적합한 상황 |
|------|------|------|---------|
| **default** | ★★☆ | ★★★ | 처음, 낯선 프로젝트 |
| **plan** | ★☆☆ | ★★★★ | 복잡한 작업, 팀 리뷰 |
| **acceptEdits** | ★★★ | ★★☆ | 반복 수정, 신뢰된 작업 |
| **auto** 🆕 | ★★★ | ★★★ | 분류기가 판단: 안전하면 자동, 위험하면 차단 (preview) |
| **dontAsk** | ★★★ | ★★☆ | 자동화 파이프라인 |
| **bypassPermissions** | ★★★★ | ★☆☆ | 실험 환경만 |

**초보자 추천 경로:**
1. 처음에는 **default**로 시작
2. 익숙해지면 **acceptEdits**
3. 복잡한 작업에는 **plan**
4. 승인 피로가 심해지면 **auto**로 전환 🆕 (preview 단계임을 감안)
5. **bypassPermissions**는 나중에, 안전한 환경에서만

> settings.json에서 기본 모드를 고정하려면 `"defaultMode": "acceptEdits"` 처럼 설정한다.

---

## allowlist 설계하기

실무에서 가장 중요한 건 **allowlist(허용 목록)**를 잘 만드는 것이다.

### 좋은 allowlist 원칙

1. **자주 쓰는 읽기/검색 명령은 항상 허용**
   ```json
   "allow": ["Read", "Edit", "Write", "Glob", "Grep"]
   ```

2. **안전한 빌드/테스트 명령은 허용**
   ```json
   "allow": ["Bash(npm test)", "Bash(npm run lint)", "Bash(npm run build)"]
   ```

3. **위험한 것은 반드시 deny**
   ```json
   "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(rm -rf *)"]
   ```

4. **hook으로 이중 안전장치**
   ```
   allowlist에 없더라도 hook으로 특정 패턴을 자동 검사 → Ch.8
   ```

### 실전 settings.json 예시

```json
{
    "permissions": {
    "allow": [
      "Read", "Edit", "Write", "Glob", "Grep",
      "Bash(npm test)",
      "Bash(npm run lint)",
      "Bash(npm run build)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git log)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(rm -rf *)",
      "Bash(git push --force)"
    ]
  }
}
```

---

## scope(적용 범위) 개념

settings.json은 **어디에 놓느냐에 따라 적용 범위가 달라진다**.

| 위치 | 범위 | 공유 |
|------|------|------|
| `~/.claude/settings.json` | 내 모든 프로젝트 | 나만 |
| `.claude/settings.json` | 이 프로젝트 | 팀 (git) |
| `.claude/settings.local.json` | 이 프로젝트, 나만 | 나만 |

**팀 운영 시 패턴:**
- 공통 규칙은 `.claude/settings.json`에 → git push
- 개인 편의(모델 선택, 추가 allow)는 `.claude/settings.local.json`에 → .gitignore

---

## 🐍 조건문(if/else) — 권한 관리도 결국 조건 분기

settings.json의 동작을 파이썬으로 표현하면 이렇다:

```python
# settings.json의 동작 원리를 파이썬으로

allow_list = ["Read", "Edit", "Bash(npm test)"]
deny_list = ["Read(./.env)"]

def check_permission(tool_name):
    """클로드가 도구를 쓰려 할 때 권한 확인"""
    
    # 1단계: allow에 있으면 허용
    if tool_name in allow_list:
        return "허용"
    
    # 2단계: deny에 있으면 차단
    if tool_name in deny_list:
        return "차단"
    
    # 3단계: 둘 다 아니면 물어보기
    return "사용자에게 물어보기"

# 테스트
print(check_permission("Read"))           # 허용
print(check_permission("Read(./.env)"))   # 차단
print(check_permission("Bash(rm -rf)"))   # 사용자에게 물어보기
```

### if/else 기초

```python
age = 20

if age >= 18:
    print("성인입니다")
else:
    print("미성년자입니다")
```

`if` 뒤에 **조건**이 오고, 조건이 True이면 아래 들여쓴 코드가 실행된다. False이면 `else` 아래가 실행된다.

### elif — 여러 조건

```python
score = 85

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")
```

`elif`는 "else if"의 줄임말. 여러 조건을 순서대로 확인한다.

### 비교 연산자

```python
x = 10

x == 10    # True  (같다)
x != 5     # True  (다르다)
x > 5      # True  (크다)
x < 20     # True  (작다)
x >= 10    # True  (크거나 같다)
x <= 10    # True  (작거나 같다)
```

### 논리 연산자

```python
age = 25
has_id = True

# and: 둘 다 True여야 True
if age >= 18 and has_id:
    print("입장 가능")

# or: 하나만 True여도 True
if age < 18 or not has_id:
    print("입장 불가")

# not: True를 False로, False를 True로
if not has_id:
    print("신분증이 없습니다")
```

### in 연산자 — 포함 여부

```python
allowed = ["Read", "Edit", "Write"]

if "Read" in allowed:
    print("읽기 허용")

if "Delete" not in allowed:
    print("삭제는 허용 안 됨")
```

이게 바로 settings.json의 allow/deny 리스트를 확인하는 원리다.

### 실전: 간단한 권한 관리 시스템

> 아래 `while True:`는 "계속 반복하라"는 뜻이고, `break`는 "반복을 멈춰라"다. 반복문은 Ch.12에서 자세히 배운다. 지금은 전체 흐름만 따라가면 된다.

```python
# permission.py
allow = ["read", "edit", "test"]
deny = ["delete", "env"]

while True:
    action = input("\n행동 입력 (quit으로 종료): ").lower()
    
    if action == "quit":
        print("종료합니다.")
        break
    
    if action in deny:
        print(f"❌ '{action}'은(는) 차단됨!")
    elif action in allow:
        print(f"✅ '{action}' 허용!")
    else:
        answer = input(f"🤔 '{action}'을(를) 허용할까요? (y/n): ")
        if answer == "y":
            print(f"✅ '{action}' 이번만 허용!")
        else:
            print(f"❌ '{action}' 거부!")
```

실행하면 settings.json의 동작을 직접 체험할 수 있다.

---

## 실습: 직접 해보기

### 실습 1: settings.json 만들기
```bash
mkdir -p .claude
```
Claude Code에서: "이 프로젝트의 settings.json을 만들어줘. Read, Edit, Glob, Grep은 허용하고 .env 읽기는 금지."

### 실습 2: 권한 차이 체험
1. settings.json 없이: "이 폴더의 파일을 읽어봐" → 허용 물어봄
2. settings.json에 Read 허용 추가 후: 같은 요청 → 바로 실행

### 실습 3: 모드 전환
대화 중에 `/permissions`로 현재 권한 확인. 다음 작업 전에 적절한 모드인지 확인하는 습관.

### 실습 4: 파이썬 조건문
```python
# grade.py
score = int(input("점수: "))
if score >= 90:
    print("🏆 A등급!")
elif score >= 80:
    print("👍 B등급!")
elif score >= 70:
    print("📝 C등급!")
else:
    print("📚 더 노력하세요!")
```

---

## 왜 이렇게 동작하는가

권한 시스템이 존재하는 이유는 **AI가 실수할 수 있기 때문**이다.

클로드는 "이 파일을 삭제하면 문제가 해결될 것 같다"고 판단할 수 있다. 대부분은 맞지만, 가끔 중요한 파일을 삭제하려 할 수도 있다. 권한 시스템은 **인간이 최종 결정권을 유지**하게 해준다.

이건 자동차의 안전벨트와 같다. 안전벨트가 귀찮다고 안 매면 사고 시 위험하다. 하지만 매번 운전할 때마다 안전벨트를 매는 건 습관이 되면 귀찮지 않다. settings.json도 마찬가지다. 한 번 잘 설정해두면 귀찮지 않으면서 안전하다.

---

## 변형해보기

1. **쉬운 과제**: 현재 프로젝트에 맞는 allow/deny 리스트를 직접 작성해보자.
2. **어려운 과제**: 파이썬으로 "권한 레벨 시스템"을 만들어보자. 레벨 1은 읽기만, 레벨 2는 읽기+수정, 레벨 3은 전부 허용.

---

## 다음 챕터로

settings.json으로 "무엇을 허용하고 금지할 것인가"를 정했다. 하지만 규칙이 많아지면 하나의 파일로는 부족하다. Ch.7에서는 **경로별로 다른 규칙**을 적용하는 `.claude/rules/`를 배운다.

---

## 이 챕터 핵심 3줄
- **settings.json** = 클로드의 권한 경계. allow(자동 허용), deny(차단), 나머지는 물어봄
- 설정 우선순위: **Managed > CLI > Local > Project > User** — 팀 규칙은 project, 개인은 local로 분리
- 🐍 **if/elif/else**와 **in 연산자** — 권한 확인도 결국 조건 분기다
