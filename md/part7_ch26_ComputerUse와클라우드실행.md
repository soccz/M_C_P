# Ch.26 Computer Use와 클라우드 실행

> **이 챕터를 마치면**: Computer Use가 왜 "클로드가 내 컴퓨터를 쓴다"는 감각을 주는지 이해한다. Sandboxing·`/autofix-pr`·`/team-onboarding`·`/powerup` 등 2026 신규 자동화 명령을 구분할 수 있다. 🐍 subprocess로 "외부 프로세스를 호출한다"는 개념을 직접 체감한다.

---

## 배경: 대화에서 실행으로, 실행에서 장악으로

지금까지 클로드는 **"내가 시키면 파일을 읽고 고친다"** 수준이었다. 2026에 한 단계 더 나아갔다:

```
Part 1-6까지:
  사용자 → 클로드 → 파일 수정, 터미널 명령
  (내 터미널 프로세스 안에서만 동작)

Ch.26에서 다루는 것:
  사용자 → 클로드 → ① 다른 앱을 열고 클릭 (Computer Use)
                → ② 샌드박스에서 격리 실행 (Sandboxing)
                → ③ PR 자동 수정 (/autofix-pr)
                → ④ 세팅 패키지화 (/team-onboarding)
                → ⑤ 대화형 학습 (/powerup)
```

"클로드에게 시킨다"의 **범위**가 넓어졌다. 파일 수정 → 컴퓨터 조작 → 팀 전파까지.

> **💭 생각의 흐름**
>
> **문제** — 매번 같은 PR을 수동으로 고치고, 테스트 돌리고, 스크린샷 찍어 붙이는데, 이건 "코드 작성"이 아니라 "클릭 노동"이다
> **질문** — "클로드가 그 클릭까지 해줄 수 없나?"
> **발견** — Computer Use = 클로드가 화면을 보고 마우스·키보드를 쓴다. 스프레드시트, 브라우저, GUI 앱까지 조작 가능
> **확장** — 위험하니 Sandboxing, 팀 공유는 /team-onboarding, 학습은 /powerup — 안전·전파·교육까지 한 세트
> **결론** — 이 챕터는 **"손 대신 쓰는 클로드"**에 대한 이야기

---

## Computer Use 🆕 — 클로드가 내 컴퓨터를 쓴다

**Computer Use**는 클로드가 **화면을 보고, 마우스를 움직이고, 키보드로 입력**하는 능력이다. 현재 **research preview** 단계.

### 어떻게 동작하나

```
① 클로드가 스크린샷을 요청 → 운영체제가 화면 캡처 전달
② 클로드가 "거기서 ○○ 버튼을 본다" → 좌표 계산
③ 클릭/입력 명령을 보낸다 → OS가 실제로 실행
④ 다시 스크린샷 → 결과 확인 → ①로 돌아가 반복
```

이는 Ch.18의 agentic loop의 **GUI 버전**이다. 관찰(스크린샷) → 생각(좌표/행동) → 행동(클릭) → 반복.

### 적합한 사용 사례

```
✅ 적합:
- API가 없는 GUI 앱 자동화 (레거시 사내 툴)
- 브라우저의 특정 UX 자동화 (캘린더 등록, 양식 작성)
- 스프레드시트/디자인 툴의 반복 조작
- "클릭 노동"의 자동화

❌ 부적합:
- 이미 API/CLI가 있는 작업 (그쪽이 빠르고 안전)
- 민감한 자격증명 화면 (패스워드, 2FA)
- 금융 거래, 법적 서명 등 인간 확인이 필수인 행위
- 속도가 중요한 대량 반복 (GUI는 느리다)
```

### Computer Use vs 터미널 Bash 도구

| | Bash 도구 (Ch.1~) | Computer Use 🆕 |
|---|---|---|
| **조작 대상** | 셸 명령 / 파일 | GUI 앱, 브라우저, OS |
| **속도** | 빠름 | 느림 (스크린샷 → 추론 반복) |
| **안정성** | 명령 성공/실패 명확 | UI 변경에 취약 |
| **비용 (토큰)** | 낮음 | 높음 (이미지 토큰 누적) |
| **위험** | 파일 삭제 등 | **화면 전체 접근** — 훨씬 높음 |

**한 줄**: CLI·API가 있으면 그쪽. **없거나 GUI만 있으면** Computer Use.

---

## Sandboxing 🆕 — "어디까지 건드려도 되는가"를 가두다

Computer Use가 강력한 만큼 위험도 크다. **Sandboxing**은 클로드의 실행을 **격리된 환경**에 가두는 기능이다.

```
샌드박스 없이:
  Computer Use → 내 메인 OS 전체 접근 → 실수 시 파일 삭제/설정 변경

샌드박스 안에서:
  Computer Use → 가상 환경만 접근 → 실수해도 메인 OS에 영향 없음
```

### 어떤 종류가 있나

```
1. 가상 머신 (VM) 기반
   - 완전히 분리된 OS
   - 가장 안전, 가장 무거움

2. 컨테이너 기반
   - Docker 같은 경량 격리
   - 빠름, 완전 격리는 아님

3. 프로세스 격리
   - OS의 권한 제한
   - 가장 빠름, 격리 수준 제한적
```

Claude가 제공하는 Sandboxing은 **클라우드 쪽 VM**이 기본이다. 내 컴퓨터를 전혀 안 건드린다는 게 핵심.

### 언제 Sandboxing이 필요한가

```
✅ 반드시 필요:
- Computer Use로 브라우저를 열어 외부 사이트에 접근할 때
- 실험적 설치 (패키지, 툴체인 실험)
- 신뢰할 수 없는 코드 실행

✅ 권장:
- 장시간 자동화 작업
- 테스트 환경 반복 재생성

❌ 불필요:
- 내 프로젝트 코드를 읽기만 할 때
- 이미 격리된 CI/CD 환경
```

**원칙**: Computer Use를 켰다면 Sandboxing도 켰는지 확인하는 습관. 둘은 한 세트.

---

## `/autofix-pr` 🆕 — 터미널에서 PR 자동 수정

GitHub PR에 달린 리뷰 코멘트를 읽고 **자동으로 수정 커밋**을 올리는 명령이다.

```bash
/autofix-pr 142
```

### 동작 흐름

```
① PR #142의 모든 리뷰 코멘트 가져오기
② 각 코멘트를 분석 (요청? 질문? 제안?)
③ 수정 가능한 것만 골라서 diff 생성
④ 테스트 돌리기
⑤ 통과하면 같은 브랜치에 커밋 + 푸시
⑥ PR에 "자동 수정 완료" 코멘트
```

### 쓰면 좋은 경우 vs 아닌 경우

```
✅ 좋음:
- 린트/포맷 코멘트 ("세미콜론 빠짐", "변수명 수정")
- 단순 리팩터링 ("이 함수 추출해")
- 명확한 버그 지적

⚠️ 위험:
- 설계 논쟁 ("이 구조 자체를 바꿔야 해")
- 테스트 커버리지 요구 (범위 판단 필요)
- 성능 개선 요청 (측정 필요)
```

**안전 패턴**: `/autofix-pr` 실행 후 커밋을 **반드시 Review Split**(Ch.17)으로 다시 본다. 자동 수정이 "실제로 맞는지" 사람이 판단.

---

## `/team-onboarding` 🆕 — 내 세팅을 팀 가이드로 패키지

내 로컬의 CLAUDE.md, settings.json, Hooks, Skills를 **팀원용 가이드로 묶어내는** 명령이다.

```bash
/team-onboarding
```

### 만들어지는 것

```
팀 온보딩 패키지:
├── TEAM_ONBOARDING.md
│   ├── 이 프로젝트에서 클로드를 쓰는 이유
│   ├── 필수 파일 설명 (CLAUDE.md, rules/, hooks/)
│   ├── 초기 세팅 단계 (10분 분량)
│   └── 자주 쓰는 프롬프트 예시
├── setup.sh (선택)  — 의존성 설치 스크립트
└── .claude/starter/ — 시작용 기본 설정
```

### 왜 유용한가

```
❌ 손으로 팀 온보딩 문서 작성:
  - 내가 쓰는 모든 설정을 나열해야 함
  - "나만 알고 있는 암묵지"가 빠짐
  - 업데이트할 때마다 문서가 뒤처짐

✅ /team-onboarding:
  - 현재 내 실제 설정을 그대로 스냅샷
  - 설명을 자동 생성 (LLM이 설정 파일을 읽고 해설)
  - 주기적으로 재생성하면 항상 최신
```

**한계**: 자동 생성된 문서는 **초안**이다. 반드시 읽고 다듬어야 한다. "이 훅은 왜 있지?"에 대한 **의도**는 내 머릿속에만 있기 때문이다.

---

## `/powerup` 🆕 — 클로드에게 직접 배우기

대화형 학습 모드다. "내 사용 패턴을 보고, 내가 더 잘 쓸 수 있는 방법을 알려줘."

```bash
/powerup
```

### 진행 흐름

```
① 최근 세션의 명령 이력 분석
② 비효율적 패턴 발견
   ("같은 파일을 3번 열었네요, @-mention을 쓰면 한 번에 됩니다")
③ 대화형으로 1가지씩 연습
   ("그럼 방금 그걸 @-mention으로 다시 해볼까요?")
④ 3~5가지 팁 제공 후 종료
```

### 언제 쓰나

```
✅ 추천:
- Claude Code 입문 1~2주 후 (기본기 익힌 뒤)
- 새 기능(Ultraplan, Checkpointing 등) 도입 직후
- "더 잘 쓰는 법"이 궁금할 때

❌ 비추:
- 지금 바쁠 때 (학습에 집중이 필요)
- 기본 명령도 어색할 때 (너무 이름)
```

**본질**: 이 교재가 정적 학습이라면, `/powerup`은 **내 습관에 맞춘 동적 학습**이다. 둘을 번갈아 쓰면 성장 속도가 빠르다.

---

## 🐍 subprocess — "외부 프로세스를 호출한다"의 파이썬 동형

Computer Use의 핵심 감각이 **"클로드가 외부 프로세스(앱/브라우저)를 호출한다"**는 것이다. 이 개념을 파이썬에서 가장 직접적으로 맛볼 수 있는 게 **subprocess**다.

### subprocess.run() — 셸 명령을 파이썬에서 호출

```python
import subprocess

# 간단한 명령 실행
result = subprocess.run(["ls", "-l"], capture_output=True, text=True)
print(result.stdout)
# (현재 폴더 파일 목록이 출력됨)
```

**`subprocess.run(명령, ...)`**:
- **명령**: 리스트로 전달 (`["ls", "-l"]`)
- **capture_output=True**: 실행 결과를 변수에 담기
- **text=True**: bytes가 아닌 문자열로 받기
- **result.stdout**: 표준 출력 (보통의 결과)
- **result.returncode**: 종료 코드 (0=성공, 그 외=실패)

### 파이썬 스크립트에서 브라우저 열기 (macOS/Linux 예시)

```python
import subprocess

url = "https://code.claude.com/docs"

# macOS
subprocess.run(["open", url])

# Linux (xdg 기반)
# subprocess.run(["xdg-open", url])

# Windows (cmd)
# subprocess.run(["cmd", "/c", "start", url])
```

한 줄로 **내 파이썬 프로그램이 OS의 브라우저를 실행시킨다**. 이게 바로 "외부 프로세스 호출"이다.

### Computer Use와의 동형 관계

```
파이썬의 subprocess:
  my_program → subprocess.run(["open", url]) → OS가 브라우저 실행

Claude의 Computer Use:
  Claude → OS 제어 API → 화면 보고 → 마우스 이벤트 → 브라우저 조작
```

**같은 본질**: "내 프로그램(또는 Claude)이 **자기 바깥의 다른 프로세스**를 부려먹는 것."

### 실패 처리 — 외부 호출은 실패할 수 있다

```python
import subprocess

try:
    result = subprocess.run(
        ["git", "status"],
        capture_output=True,
        text=True,
        check=True,      # 실패하면 예외 발생
        timeout=5,       # 5초 넘으면 중단
    )
    print(result.stdout)

except subprocess.CalledProcessError as e:
    print(f"명령 실패 (exit code {e.returncode}): {e.stderr}")

except subprocess.TimeoutExpired:
    print("명령이 너무 오래 걸려서 중단했습니다")

except FileNotFoundError:
    print("git이 설치되어 있지 않습니다")
```

Computer Use도 **화면이 안 뜨거나, 버튼을 못 찾거나, 느려서 타임아웃**이 난다. 이 실패 패턴은 `subprocess`의 실패 패턴과 구조가 같다.

### 교재 규칙에 맞는 범위

파이썬 규칙("클래스/모듈 제외")에 따라, 여기서는:
- `subprocess.run()` 함수 사용만 소개
- Popen 클래스, 파이프라인 구성 등 **고급 주제는 생략**
- 핵심은 "외부 프로세스를 호출한다는 감각" 그 자체

---

## 4가지 명령과 Computer Use의 관계도

```
          Computer Use
          (손 대신 쓰는 클로드)
               │
        ┌──────┴──────────┐
        │                 │
    Sandboxing        /autofix-pr
    (안전한 격리)      (PR 자동 수정)
        │
        └── 위험 작업을 안전하게 한정
  
         /team-onboarding       /powerup
         (설정을 팀에 전파)     (학습 대화)
                │                    │
                └── "내 세팅"을 확장 ──┘
```

네 명령은 **서로 다른 방향**의 확장이다:
- Computer Use: **OS로** 확장
- Sandboxing: **안전 경계**를 정함
- `/autofix-pr`: **리뷰 흐름**을 자동화
- `/team-onboarding`: **팀**으로 확장
- `/powerup`: **내 습관**을 개선

공통점: 전부 "클로드 세션 하나"를 넘어서 **외부에 손을 뻗는다**.

---

## 왜 이렇게 동작하는가

2026 기능들의 공통 철학을 한 줄로 요약하면:

> **"대화를 넘어 실행으로, 실행을 넘어 확장으로."**

지금까지의 클로드는 **"내 세션 안에서 문장·파일·명령"**을 다루었다. 2026 기능은 경계를 밀었다:

- **Computer Use**: 세션 → OS 조작
- **Sandboxing**: OS 조작을 → 격리 환경으로
- **`/autofix-pr`**: 내 로컬 → GitHub PR 자동화
- **`/team-onboarding`**: 내 세팅 → 팀 전체
- **`/powerup`**: 정적 학습 → 내 패턴에 맞춘 동적 학습

이 방향은 **LLM이 단일 대화에서 시스템의 일부가 되는 변화**를 보여준다. 파이썬에서 `subprocess`가 "내 프로그램이 OS의 일부가 되는 순간"인 것처럼.

---

## 변형해보기

1. **쉬운 과제**: `subprocess.run(["echo", "hello"])`를 파이썬 스크립트로 실행하고, `result.stdout`이 무엇인지 print로 확인
2. **어려운 과제**: `/team-onboarding`을 실제 프로젝트에 실행해 만들어진 TEAM_ONBOARDING.md를 읽어보자. 내가 다듬어야 할 부분은 어디인지 표시

---

## 다음 챕터로

Ch.25·26에서 **Surface(입구)**와 **Computer Use·팀 확장(출구)**을 배웠다. Ch.27에서는 이 모든 도구를 **내 업무 워크플로우**로 꿰는 방법을 본다.

---

## 이 챕터 핵심 3줄
- **Computer Use** 🆕 = 클로드가 화면·마우스·키보드를 쓴다. **Sandboxing과 한 세트**로만 안전하게
- **2026 자동화 4인방** 🆕: `/autofix-pr`(PR 자동 수정) · `/team-onboarding`(세팅 → 팀 가이드) · `/powerup`(내 습관 학습) · Computer Use(GUI 조작) — 각자 다른 방향의 확장
- 🐍 **subprocess** = 파이썬이 외부 프로세스(앱/브라우저)를 부르는 법. Computer Use가 주는 "바깥을 부려먹는다"는 감각의 가장 가까운 동형
