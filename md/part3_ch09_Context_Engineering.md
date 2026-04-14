# Ch.9 Context Engineering

> **이 챕터를 마치면**: "프롬프트 엔지니어링"보다 더 중요한 것이 "컨텍스트 엔지니어링"이라는 걸 이해하고, 무엇을 넣고 무엇을 빼야 하는지 판단할 수 있다. 파이썬의 딕셔너리를 이해한다.

---

## 배경: 좋은 프롬프트를 써도 결과가 안 좋은 이유

Ch.3에서 좋은 프롬프트를 쓰는 법을 배웠다. 구체적으로, 위치 명시, 결과 형태 지정, 금지 사항 포함. 이걸 잘 해도 **결과가 기대와 다른 경우**가 있다.

왜일까?

프롬프트는 **"지금 무엇을 해달라고 요청하는가"**다. 하지만 클로드가 좋은 결과를 내려면 그것만으로는 부족하다. **"이 프로젝트가 뭔지, 어떤 규칙이 있는지, 이전에 뭘 했는지, 어떤 파일이 관련 있는지"**도 알아야 한다. 이 전체가 **컨텍스트**다.

마스터 가이드의 표현을 빌리면:

> **프롬프트 엔지니어링** = "지금 무엇을 해달라고 말하는가"
> **컨텍스트 엔지니어링** = "무엇을 읽고 유지하는 컨텍스트 전체를 설계하는 일"

같은 프롬프트라도 컨텍스트가 다르면 결과가 완전히 달라진다. "버그 고쳐줘"라는 프롬프트가:
- CLAUDE.md도 없고, 파일도 안 읽은 상태에서 → 엉뚱한 추측
- CLAUDE.md가 있고, 관련 파일을 미리 읽은 상태에서 → 정확한 수정

**컨텍스트 엔지니어링이 프롬프트 엔지니어링보다 더 중요한 이유**가 이것이다.

> **💭 생각의 흐름**
>
> **문제** — "회원가입 폼 버그 고쳐줘"라고 했는데 엉뚱한 파일을 수정했다
> **질문** — "프롬프트가 나쁜 건가?"
> **발견** — 프롬프트 자체는 괜찮았다. 문제는 클로드가 어떤 파일을 읽고 있었는지. 관련 없는 파일 10개가 컨텍스트에 들어있었다
> **결과** — "먼저 CLAUDE.md와 src/features/signup/ 폴더만 읽어봐"를 앞에 붙이니 한 번에 해결

---

## "무엇을 넣을 것인가"보다 "무엇을 넣지 않을 것인가"

컨텍스트 엔지니어링의 핵심은 역설적으로 **뺄셈**이다.

클로드의 컨텍스트 윈도우는 유한하다. 200K 토큰이 많아 보이지만, 실제로는 이렇게 채워진다:

```
CLAUDE.md                    ≈ 500 토큰
.claude/rules/ (해당 경로)    ≈ 300 토큰
Memory (관련된 것)            ≈ 200 토큰
대화 기록 (지금까지 주고받은 것) ≈ 50,000+ 토큰
도구 출력 (테스트 로그, grep 결과) ≈ 30,000+ 토큰
파일 내용 (읽은 파일들)        ≈ 20,000+ 토큰
───────────────────────────────
합계: 쉽게 100K 넘어감
```

특히 **도구 출력(tool output)**이 컨텍스트를 많이 차지한다:
- `cargo test` 결과가 수백 줄
- `git log` 결과가 수십 줄
- `grep` 결과가 수백 줄
- 브라우저/네트워크 로그가 수천 줄

이걸 다 넣으면 정작 중요한 정보가 묻힌다.

### Attention Budget (주의 예산)

클로드에게도 **집중력 한계**가 있다. 컨텍스트가 길면 앞부분보다 뒷부분에 더 집중하는 경향이 있고, 중간에 있는 정보는 놓칠 수 있다. 이걸 "주의 예산"이라고 생각하면 된다.

**주의 예산이 유한하므로:**
- 중요한 것은 가까이 (프롬프트 직전에)
- 참고 수준인 것은 별도 파일로 (supporting file)
- 불필요한 것은 아예 빼기

---

## Progressive Disclosure — 필요한 정보만 필요할 때

Ch.7에서 rules/를 배울 때 잠깐 나왔던 개념이다. 여기서 더 깊이 다룬다.

Progressive Disclosure = **처음부터 모든 자료를 한꺼번에 넣지 않고, 필요한 자료만 필요할 때 점진적으로 보여주는 방식.**

### 나쁜 예: 모든 것을 한 파일에

```
workspace/
└── everything.md    ← 자기소개, 브랜드 톤, 지난 보고서, 규칙, 참고자료 전부
```

이러면 매번 everything.md 전체가 읽힌다. 관련 없는 정보까지.

### 좋은 예: 역할별로 분리

```
workspace/
├── CLAUDE.md           ← 공통 규칙만 (항상 읽힘)
├── context/
│   ├── about-me.md     ← 필요할 때만
│   └── glossary.md     ← 필요할 때만
├── rules/
│   ├── writing.md      ← 글 쓸 때만
│   └── api.md          ← API 작업할 때만
├── projects/
│   └── client-a/
│       ├── brief.md    ← 이 프로젝트 작업할 때만
│       └── sources.md  ← 필요할 때만
└── templates/
    └── report.md       ← 보고서 생성할 때만
```

이 구조에서 client-a 프로젝트의 보고서를 작성할 때 클로드가 읽는 것은:
- `CLAUDE.md` (항상)
- `rules/writing.md` (글 관련 작업)
- `projects/client-a/brief.md` (이 프로젝트)
- `templates/report.md` (보고서 형식)

about-me.md나 api.md는 읽히지 않는다. **필요한 것만 필요할 때.**

---

## 템플릿 vs 보조 자료 파일(supporting file) 분리

모든 참고 자료를 하나의 큰 파일에 넣으면 두 가지 문제가 생긴다:
1. 필요한 구조를 찾기 어렵다
2. 수정할 때 어떤 부분이 형식이고 어떤 부분이 예시인지 헷갈린다

**분리 원칙:**

| 유형 | 역할 | 예시 |
|------|------|------|
| **템플릿** | 형식을 고정 — 빈 구조 | `weekly-brief-template.md` |
| **예시** | 같은 결과의 감각을 제공 | `weekly-brief-example.md` |
| **보조 자료** | 참고 세부 지식 | `market-data-2026.md` |

클로드에게:
- 템플릿: "이 형식대로 만들어줘"
- 예시: "이런 느낌으로"
- 보조 자료: "이 데이터를 참고해서"

각각 별도 파일로 두면 필요한 것만 지정할 수 있다.

---

## tool output이 컨텍스트를 먹는 문제

실무에서 가장 많이 컨텍스트를 낭비하는 원인이다.

```
You: npm test 결과 보여줘
Claude: [npm test 실행 → 결과 200줄이 컨텍스트에 들어감]
```

테스트 결과 200줄 중 중요한 건 "3개 실패, 47개 성공" 한 줄이다. 나머지 199줄은 컨텍스트 낭비.

### 해결법

**1. hook이나 wrapper를 써서 요약만 보기**
```bash
# 전체 출력 대신
npm test 2>&1 | tail -5    # 마지막 5줄만
```

**2. 클로드에게 필요한 부분만 보게 하기**
```
npm test를 실행하고, 실패한 테스트만 보여줘. 성공한 건 생략해.
```

**3. `/compact` 활용**
도구 출력이 많이 쌓이면 `/compact`로 압축. 중요한 것만 남기고 나머지를 줄인다.

---

## 실제 호출 예시: Context-first 프롬프트

좋은 컨텍스트 엔지니어링이 적용된 프롬프트:

```
먼저 'CLAUDE.md', 'projects/client-a/brief.md',
'templates/client-report-template.md'를 읽어.

이번 주 미팅 메모는 'projects/client-a/raw-notes.md'만 참고해.
나머지 파일은 필요한 때만 열어.
```

**핵심: 무엇을 읽을지를 명시적으로 지정한다.** 클로드가 알아서 찾게 두면 불필요한 파일까지 읽고 컨텍스트를 낭비한다.

---

## 🐍 딕셔너리 — JSON 구조를 이해하면 Context가 보인다

클로드가 주고받는 데이터는 대부분 **JSON 형식**이다. settings.json, hooks 설정, MCP 설정, API 응답 — 전부 JSON이다. 파이썬의 **딕셔너리**는 JSON과 거의 같은 구조다.

### 딕셔너리란

**키(key)와 값(value)의 쌍**으로 데이터를 저장하는 구조다.

```python
# 딕셔너리 만들기
user = {
    "name": "클로드",
    "role": "AI 어시스턴트",
    "version": 4.6,
    "skills": ["코딩", "분석", "글쓰기"]
}
```

### 값 접근하기

```python
print(user["name"])        # 클로드
print(user["skills"])      # ['코딩', '분석', '글쓰기']
print(user["skills"][0])   # 코딩
```

### 값 수정하기

```python
user["version"] = 5.0      # 버전 변경
user["language"] = "한국어"  # 새 키 추가
del user["role"]            # 키 삭제
```

### 딕셔너리 메서드

```python
user.keys()      # dict_keys(['name', 'version', 'skills', 'language'])
user.values()    # dict_values(['클로드', 5.0, [...], '한국어'])
user.items()     # (key, value) 쌍의 목록
user.get("age", 0)  # 키가 없으면 기본값 0 반환 (에러 안 남)

"name" in user   # True — 키 존재 확인
```

### 중첩 딕셔너리

```python
# settings.json을 파이썬으로 표현하면
settings = {
    "permissions": {
        "allow": ["Read", "Edit", "Write"],
        "deny": ["Read(./.env)"]
    }
}

# 접근
print(settings["permissions"]["allow"])   # ['Read', 'Edit', 'Write']
print(settings["permissions"]["deny"][0]) # Read(./.env)
```

### JSON과 딕셔너리의 관계

```python
import json

# JSON 문자열 → 파이썬 딕셔너리
json_text = '{"name": "클로드", "version": 4.6}'
data = json.loads(json_text)
print(data["name"])  # 클로드

# 파이썬 딕셔너리 → JSON 문자열
result = json.dumps(data, ensure_ascii=False, indent=2)
print(result)
# {
#   "name": "클로드",
#   "version": 4.6
# }
```

### 실전: context 파일 목록 관리

```python
# context_manager.py — 어떤 파일을 컨텍스트에 넣을지 관리

context_map = {
    "api_work": {
        "always": ["CLAUDE.md"],
        "rules": [".claude/rules/api.md"],
        "files": ["src/api/routes.ts", "src/api/types.ts"]
    },
    "frontend_work": {
        "always": ["CLAUDE.md"],
        "rules": [".claude/rules/frontend.md"],
        "files": ["src/components/", "src/pages/"]
    },
    "report": {
        "always": ["CLAUDE.md"],
        "templates": ["templates/weekly-report.md"],
        "data": ["projects/client-a/brief.md"]
    }
}

# 작업 유형에 따라 필요한 파일 목록 출력
work_type = input("작업 유형 (api_work/frontend_work/report): ")
if work_type in context_map:
    ctx = context_map[work_type]
    print(f"\n[{work_type}] 읽어야 할 파일:")
    print(f"  항상: {ctx['always']}")
    # 딕셔너리의 키로 원하는 항목에 접근
    if "rules" in ctx:
        print(f"  규칙: {ctx['rules']}")
    if "files" in ctx:
        print(f"  파일: {ctx['files']}")
    if "templates" in ctx:
        print(f"  템플릿: {ctx['templates']}")
else:
    print("알 수 없는 작업 유형")
```

---

## 실습: 직접 해보기

### 실습 1: 컨텍스트 확인
Claude Code에서:
```
/status
```
현재 컨텍스트 사용량을 확인. 불필요한 것이 많으면 `/compact`로 정리.

### 실습 2: Context-first 프롬프트 실전
```
먼저 CLAUDE.md와 src/features/login/ 폴더를 읽어.
다른 파일은 열지 마.
그 다음 로그인 기능의 버그를 찾아줘.
```

### 실습 3: 파이썬 딕셔너리
```python
# my_settings.py
settings = {
    "allow": ["Read", "Edit"],
    "deny": ["Read(./.env)"],
    "model": "sonnet"
}

for key, value in settings.items():
    print(f"{key}: {value}")
```

---

## 왜 이렇게 동작하는가

컨텍스트 엔지니어링이 중요한 이유는 **토큰 = 비용 + 품질** 이기 때문이다.

1. **비용**: 토큰이 많을수록 비용이 올라간다
2. **품질**: 불필요한 토큰이 많으면 중요한 정보가 묻혀서 품질이 떨어진다
3. **속도**: 컨텍스트가 길면 응답이 느려진다

결국 **좋은 컨텍스트 = 필요한 것만 최소한으로 넣는 것**이다. 이건 Part 5(토큰과 비용)에서 더 자세히 다루지만, 지금부터 `/cost`로 비용을 확인하는 습관을 들이면 체감이 빠르다.

---

## 변형해보기

1. **쉬운 과제**: `/status`로 컨텍스트 사용량을 확인하고, 불필요한 내용이 많다면 `/compact`로 정리해보자.
2. **어려운 과제**: 같은 작업을 "파일 지정 없이"와 "파일 지정해서" 각각 시도하고, `/cost`로 토큰 차이를 비교해보자.

---

## 다음 챕터로

컨텍스트를 잘 설계하는 법을 배웠다. 다음은 그 위에 올라가는 **프롬프트 엔지니어링**이다. Ch.10에서는 제약형 프롬프트 템플릿, 프롬프트 9원칙 등 실전에서 바로 쓸 수 있는 기법을 배운다.

---

## 이 챕터 핵심 3줄
- **컨텍스트 엔지니어링 > 프롬프트 엔지니어링** — 무엇을 읽고 있는지가 더 중요하다
- 핵심은 **뺄셈**: 무엇을 넣지 않을 것인가. Attention Budget은 유한하다
- 🐍 **딕셔너리** = JSON과 같은 구조. settings.json, hooks, API 응답 — 전부 이 구조
