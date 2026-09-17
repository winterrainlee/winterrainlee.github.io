---
title: Pi Finance Observer — Fresh Session Final Report
description: 자연어로 돈을 기록하고 싶다는 생활의 문제에서 출발해, 로컬 모델이 잘하는 일과 코드가 잘하는 일을 분리해 본 기록
date: 2026-09-17
updated: 2026-09-17
tags:
  - AI
  - agentic
  - local-llm
  - observer
draft: false
---

**참고: 다른 글과 다르게 이 글은 내 지시를 받아 gpt 5.6 sol 매우 높음 조건으로 작성되었다.**

Pi Finance Observer는 처음부터 연구 프로젝트로 시작한 것이 아니다. 출발점은 훨씬 생활적이었다.

나는 매일 쓴 돈을 기록하고 싶었고, 그 기록을 나중에 다시 보고 싶었다. 그런데 일반적인 가계부 앱 방식은 나와 잘 맞지 않았다. 앱을 열고, 거래 유형을 고르고, 계좌를 고르고, 카테고리를 고르고, 금액을 입력하는 식의 절차가 한 건 한 건은 별것 아닌데 반복되면 꽤 귀찮았다.

내가 원한 것은 오히려 이런 것이었다.

> “점심 현금 120원.”
>
> 말하고 끝.

그리고 가능하다면 이 일은 개인적인 생활 기록을 다루는 만큼 내 로컬 환경에서 돌아갔으면 했다.

이 글은 그 작은 욕구가 어떻게 `Pi Finance Observer`라는 실험으로 이어졌는지, 그리고 그 과정에서 무엇을 분리해서 보게 되었는지를 정리한 글이다.

---

## 1. 자연어로 돈 정리를 하고 싶다

가계부 자체가 싫은 것은 아니다. 오히려 기록은 하고 싶다. 문제는 **기록을 위해 내가 앱의 형식에 맞춰 움직여야 한다는 점**이었다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/09-natural-language-friction.svg" alt="일반 가계부의 여러 입력 단계를 한 문장 자연어 입력으로 줄이고 싶은 흐름" />
</figure>

매일 반복하는 작은 작업은 입력 비용이 조금만 높아도 금방 귀찮아진다. 그래서 내 경우에는 정확한 UI보다 **“생활 중 떠오르는 순간 바로 한 문장으로 적는 것”**이 더 중요했다.

예를 들면 이 정도다.

```text
점심 현금 120원
버스 이지카드 25원
커피 은행카드 95원
```

이렇게 입력하면 시스템이 알아서 거래를 해석하고 기록해주면 된다.

### 왜 로컬 모델인가

여기에는 몇 가지 이유가 있었다.

첫째, 돈 기록은 작지만 꽤 개인적인 데이터다. 어디에서 무엇을 샀는지, 어느 계좌를 자주 쓰는지, 생활 패턴이 그대로 쌓인다. 가능하면 원본 기록과 일상적인 처리 과정은 내 환경 안에 두고 싶었다.

둘째, 이건 한두 번 쓰고 끝나는 기능이 아니라 매일 반복해서 쓰는 기능이다. 그래서 모델 호출비나 외부 서비스 상태보다 **내가 계속 유지할 수 있는 로컬 도구**에 가까웠으면 했다.

셋째, 나는 이미 다른 작업에서도 로컬 모델을 개인 에이전트의 일부로 사용하고 있었다. 그렇다면 돈 기록도 그 흐름 안에 넣어볼 수 있지 않을까 싶었다.

---

## 2. 사실 지금도 어느 정도는 이렇게 쓰고 있다

완전히 새로 만들려던 것은 아니다. 현재도 나는 비슷한 방식으로 돈을 기록하고 있다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/10-current-workflow.svg" alt="Discord에서 OpenClaw와 Gemma 26B를 거쳐 Daily Note에 기록하고 정기적으로 상용 모델로 결산하는 현재 흐름" />
</figure>

대략 이런 흐름이다.

- Discord에 짧게 지출 내용을 보낸다.
- OpenClaw가 입력과 도구 사용을 연결한다.
- Gemma 26B가 내용을 해석한다.
- 그날의 Daily Note, 즉 Markdown 문서에 기록한다.
- 일정 기간이 지나면 기록을 모아 상용 대형 모델로 결산하거나 분석한다.

이 방식은 이미 꽤 쓸 만하다. 문제는 **기록과 결산이 분리되어 있다는 점**이다.

그러면 자연스럽게 이런 생각이 든다.

> 이걸 그냥 에이전트 하나가 다 하면 안 되나?

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/11-one-agent-question.svg" alt="하나의 에이전트에게 자연어 이해, 장부 실행, 장기 분석을 모두 맡길 때 실패 원인이 섞이는 구조" />
</figure>

기록도 하고, 잔액도 관리하고, 나중에 주간·월간 분석도 하면 얼마나 편할까 싶다.

그런데 지금까지 로컬 에이전트를 써본 경험으로는 **“한 에이전트에게 다 맡기면 되겠지”가 생각만큼 간단하지 않았다.**

한 문장을 이해하는 일, 빠진 정보를 알아채는 일, 정확한 형식으로 파일을 고치는 일, 계산하는 일, 과거 상태를 이어받는 일, 오류를 발견하고 복구하는 일은 서로 다른 능력이다. 하나가 흔들렸을 때 마지막 결과만 보면 어디서부터 문제가 시작됐는지 알기 어렵다.

그래서 질문이 바뀌었다.

> 더 좋은 모델 하나를 찾으면 되는가?
>
> 아니면 먼저 **모델이 실제로 어디까지 잘하고 어디서부터 흔들리는지** 봐야 하는가?

나는 두 번째 쪽을 먼저 해보기로 했다.

---

## 3. 이왕 하는 김에 로컬 모델을 제대로 관찰해보자

문제는 실제 사용 환경이 너무 복잡하다는 점이었다.

내가 실제로 쓰는 OpenClaw에는 이미 memory, skills, 여러 tools, 긴 context, session 상태, 파일 규칙 같은 것이 들어 있다. 이런 환경에서 어떤 작업이 실패하면 그게 모델 때문인지, context 때문인지, tool interface 때문인지, harness 때문인지 구분하기 어렵다.

그래서 관찰을 위해 일부러 시스템을 가난하게 만들기로 했다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/12-simplify-to-pi.svg" alt="실제 OpenClaw 환경을 Pi 기반 최소 실험 환경으로 단순화하는 구조" />
</figure>

### 왜 Pi를 썼나

Pi를 택한 이유는 OpenClaw보다 더 좋은 하네스라고 생각했기 때문이 아니다.

오히려 반대다. **관찰하려는 변수를 줄이고 싶었기 때문**이다.

- fresh session으로 시작한다.
- tool surface를 최소화한다.
- 실제 개인 금융정보 대신 synthetic data를 쓴다.
- 데이터는 CSV, JSON, Markdown처럼 단순한 파일로 둔다.
- 복잡한 memory나 delegation은 빼둔다.

그리고 Observer는 에이전트 밖에 둔다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/03-observer-outside.svg" alt="에이전트는 원래 업무만 수행하고 Observer가 바깥에서 행동과 파일 상태를 수집하는 구조" />
</figure>

여기서 중요한 원칙은 에이전트에게 “네가 뭘 했는지 보고해”라고 시키지 않는 것이다. 그건 관찰이 아니라 추가 업무가 된다.

에이전트는 자기 업무만 하고, Observer는 tool trajectory와 파일 상태를 바깥에서 기록한다. 실패 판정은 나중에 한다.

이렇게 해야 최소한 **모델의 행동을 관찰하기 위해 모델의 행동 자체를 바꾸는 문제**를 줄일 수 있다.

---

## 4. 실험용 돈 관리 세계는 세 계정만 남겼다

실험용 금융 세계도 최대한 작게 만들었다. 계정은 세 개다.

| 계정 | 생활에서의 의미 | 주요 역할 |
|---|---|---|
| 현금 | 지갑 속 현금 | 직접 지출, EasyCard 충전 |
| 교통카드 | EasyCard 같은 선불 교통카드 | 교통·소액 결제 |
| 은행카드 | 체크카드/현금 인출 원천 | 직접 결제, ATM 인출 |

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/01-basic-system.svg" alt="현금, EasyCard, 은행카드가 지출과 충전, ATM 인출로 연결되는 기본 계정 구조" />
</figure>

거래도 크게 두 종류면 충분했다.

- **지출**: 돈이 시스템 밖으로 나간다.
- **이체**: 돈이 세 계정 사이에서 이동한다.

예를 들어:

```text
현금으로 점심 120원
→ 현금 지출

은행카드에서 현금 2000원 인출
→ 은행카드 → 현금 이체

현금에서 이지카드 500원 충전
→ 현금 → EasyCard 이체
```

작은 세계지만 필요한 문제는 거의 다 들어 있다.

- 어느 계정인지 판단해야 한다.
- 지출과 이체를 구분해야 한다.
- 금액을 읽어야 한다.
- `카드`처럼 애매하면 물어봐야 한다.
- 계정이 빠졌을 때 기본값을 써도 되는지 판단해야 한다.
- 거래 뒤 잔액이 일관되어야 한다.

즉 **작지만 agent의 여러 능력을 분리해서 보기 좋은 세계**였다.

---

## 5. Pi Finance Observer에서 실제로 본 것

이후 실험은 버전 번호보다 질문이 어떻게 바뀌었는지로 보는 편이 이해하기 쉽다.

### 5.1 먼저 Observer를 믿을 수 있는가 — v0.1

첫 번째로 확인한 것은 모델 성능이 아니었다.

실제 run을 돌리자 모델이 아니라 실험 장치에서 먼저 문제가 나왔다. runtime 오류가 정상 종료처럼 보이기도 했고, 모델은 파일을 제대로 고쳤는데 capture에서 일부 변화가 빠지기도 했다.

그래서 가장 먼저 분리한 것은 이것이었다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/04-failure-ownership.svg" alt="모델 의미 판단, 실행 표현, runtime, harness capture, evaluator 실패를 구분하는 구조" />
</figure>

이때 얻은 원칙은 단순하다.

> **에이전트를 평가하려면 먼저 Observer를 믿을 수 있어야 한다.**

그리고 최종 결과와 과정도 분리해야 했다.

처음부터 정확하게 수행한 것과, validator의 실패 신호를 보고 고친 뒤 최종적으로 맞은 것은 같은 성공이 아니다.

**독립 수행 능력 ≠ 도움을 받았을 때의 회복 능력 ≠ 최종 결과**

이 구분은 이후 실험 전체의 기반이 됐다.

### 5.2 모델이 이해한 것과 인터페이스를 잘 수행한 것은 같은가 — v0.2

다음으로 보고 싶었던 것은 **의미 이해와 인터페이스 수행의 차이**였다.

사용자의 말을 정확히 이해했다고 해도 모델은 내부 enum 이름, ID 규칙, CSV/JSON 형식, 여러 파일의 동기화까지 함께 맞춰야 할 수 있다.

v0.2에서는 같은 Gemma/Pi 환경에서 specification과 representation을 바꿔봤다.

관찰 가능한 mutation에서는 경제적 거래 의미와 잔액이 모두 정확했지만, 첫 구조화 write는 조건에 따라 크게 달라졌다. 특히 public structural specification을 충분히 알려주자 pre-feedback first-pass 성공이 `2/9 → 9/9`로 바뀌었다.

이때부터 중요한 질문이 생겼다.

> 모델이 정말 못하는 걸까?
>
> 아니면 내가 모델에게 내부 형식의 책임까지 너무 많이 맡긴 걸까?

이 질문이 이후 실험의 방향을 바꿨다.

### 5.3 모델마다 어디서 다르게 실패하는가 — v0.3 ~ v0.4

그 다음에야 서로 다른 모델을 비교했다.

초기 복합 workflow에서는 Gemma 4 26B-A4B가 안정적이었고 Qwen3 30B-A3B는 더 많이 흔들렸다. 하지만 이걸 곧바로 “Gemma가 좋고 Qwen이 나쁘다”로 읽으면 무엇이 원인인지 알 수 없었다.

그래서 interface 부담을 하나씩 줄이면서 다시 봤다.

그 결과 Qwen은 **명확한 explicit action**에서는 빠르고 안정적이었다. 현금 지출, EasyCard 지출, 입금, 충전, ATM 인출 같은 명확한 요청은 잘 처리했다.

하지만 다음 같은 입력에서는 반복적으로 행동 방향이 달랐다.

```text
카드로 점심 150원
커피 95원 결제했어
어제 저녁 현금 180원
```

Qwen은 빈 정보를 채워서라도 실행 가능한 action으로 가려는 경향이 강했고, Gemma 26B는 상대적으로 “지금 충분히 이해했는가?”를 더 따지는 쪽이었다.

아주 거칠게 말하면 내가 본 차이는 이랬다.

- Qwen: **“무슨 작업을 실행하면 되지?”**에 빨리 수렴한다.
- Gemma 26B: **“사용자가 무슨 뜻으로 말했지?”**를 조금 더 오래 붙잡는다.

이건 모델 family 전체의 본질을 단정하는 이야기가 아니다. 이 작은 finance workflow에서 관찰된 행동 차이다.

그리고 이 실험을 통해 왜 내가 Gemma와 대화할 때 상대적으로 편하다고 느꼈는지도 조금 이해했다. 나는 AI에게 완성된 명령만 던지는 것이 아니라, 생각 중인 것을 던지고 아직 정하지 않은 부분은 정하지 않은 채로 같이 경계를 찾는 경우가 많다.

내 사용 방식에서는 **성급하게 빈칸을 채우는 오류보다 잠깐 멈추고 확인하는 오류가 덜 불편했다.**

같은 Gemma 계열의 더 작은 E4B도 별도로 봤다. validator 지원 아래에서는 최종 성공으로 복구할 수 있었지만, interface 부담을 줄여도 semantic wrong-action이 남았다. 그래서 `Gemma라는 family는 이렇다`라고 단순화하기보다 **family × capacity × interface × 외부 지원**을 함께 봐야 했다.

### 5.4 실패를 보다 보니 “모델이 잘하는 일만 맡기는 편이 낫겠다”로 바뀌었다 — v0.4 ~ v0.5

처음에는 하나의 LLM이 자연어 해석부터 내부 코드 변환, 계산, 파일 수정, 검증까지 전부 하는 모습을 생각했다.

그런데 실패 위치를 하나씩 분리해서 보다 보니, 이 일들이 모두 같은 종류의 능력을 요구하는 것은 아니라는 게 보였다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/06-capability-decomposition.svg" alt="하나의 agent success를 의미 판단, 인터페이스 수행, 상태 변화, 복구, 종료 능력으로 나누는 구조" />
</figure>

자연어의 뜻을 읽고, 애매함을 감지하고, 질문할지 판단하는 일은 모델이 잘하는 편이었다.

반면 다음은 규칙이 명확했다.

- 내부 account code로 바꾸기
- 금액 계산
- 잔액 계산
- schema 맞추기
- state mutation
- validation

이런 일은 deterministic code가 더 안정적이었다.

그래서 방향은 **“모델이 하는 일을 줄이자”가 아니라 “각자 잘하는 일을 맡기자”**로 바뀌었다.

> **모델을 덜 쓰는 구조를 찾은 것이 아니라, 모델이 잘하는 곳에만 쓰는 구조를 찾았다.**

이 관점으로 보니 이전에 “모델이 실패했다”고 생각했던 것 중 일부는 사실 잘못된 interface responsibility에서 생긴 문제였다.

### 5.5 Tiny model도 필요한가 — v0.5 ~ v0.7

한때는 큰 모델 뒤에 작은 executor를 붙이는 구조를 생각했다.

`Gemma 26B → resolved work order → Tiny executor → finance core`

그런데 의미가 이미 해결된 작업지시는 deterministic mapper만으로 정확하게 실행할 수 있었다. 이 경우 Tiny LLM은 도움이 되기보다 이미 정해진 의미를 바꿀 가능성을 하나 더 추가한다.

그래서 Tiny executor를 뒤에서 뺐다.

그 다음에는 앞쪽에 Tiny model을 두는 구조를 생각했다.

`입력 → gate → Tiny → 필요하면 Gemma 26B`

하지만 여기서도 같은 일이 생겼다. gate가 “이 입력은 안전하고 명확하다”고 판단할 수 있을 정도라면, 그 입력은 이미 deterministic parser로 처리할 수 있었다.

결국 Fresh phase의 현재 구조는 다음처럼 수렴했다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/05-final-architecture.svg" alt="명확한 입력은 deterministic fast path로, 애매한 입력은 Gemma 26B semantic controller로 보내는 최종 구조" />
</figure>

- **명확하고 닫힌 입력** → deterministic code
- **애매하거나 빠진 정보가 있는 입력** → Gemma 26B
- **계산·잔액·검증·상태 변경** → deterministic finance core

현재의 좁은 finance surface에서는 이것이 가장 단순했다.

---

## 6. Fresh phase에서 얻은 것

돌아보면 이 실험에서 가장 크게 바뀐 것은 모델 선택보다 **문제를 보는 방식**이었다.

처음 질문은 이런 것이었다.

> Gemma가 더 좋은가?
>
> Qwen이 더 좋은가?
>
> 작은 모델도 가능한가?

지금 질문은 조금 다르다.

> **이 일은 누가 맡기는 것이 가장 자연스러운가?**

사람의 말이 애매한지, 질문이 필요한지, 상대 날짜나 문맥을 어떻게 해석할지는 모델이 잘하는 영역이다.

반대로 계산, schema, account mapping, balance, validation, state mutation처럼 규칙이 분명한 일은 코드가 잘한다.

그래서 현재 구조는 LLM 하나가 모든 일을 자유롭게 결정하는 시스템보다는 **deterministic workflow 안에 semantic model이 필요한 지점만 들어가는 hybrid agentic workflow**에 가깝다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/07-hybrid-agentic-workflow.svg" alt="deterministic workflow 안에서 판단이 필요한 곳만 semantic LLM이 맡는 hybrid agentic workflow" />
</figure>

Fresh phase에서 얻은 가장 큰 결과는 특정 모델의 승패가 아니었다.

**어떤 문제를 모델에게 맡기고, 어떤 문제를 코드에게 맡길지에 대한 지도가 생긴 것**이 가장 컸다.

Observer도 처음에는 모델을 감시하는 도구처럼 보였지만, 지금은 조금 다르게 느껴진다.

Observer가 묻는 것은 사실 이런 것이다.

```text
어디서 실패했나?
왜 실패했나?
그건 모델이 맡아야 할 일이었나?
코드가 더 잘할 수 있는 일이었나?
그래도 모델이 필요한 지점은 어디인가?
```

---

## 7. 다음은 Persistent Finance다

Fresh phase에서는 대부분 한 요청을 fresh session에서 보고, 그 입력이 어떤 거래인지 정확하게 처리할 수 있는지를 관찰했다.

하지만 실제로 내가 원하는 것은 하루 쓰고 버리는 synthetic ledger가 아니다.

이제 다시 처음의 생활 문제로 돌아갈 차례다.

다음에는 거래가 쌓이고, 상태가 이어져야 한다.

- 어제의 closing balance가 오늘 opening balance가 된다.
- 오늘 거래를 반영해 현재 잔액을 계산한다.
- 현금과 EasyCard가 너무 낮으면 바로 알려준다.
- 하루가 끝나면 다음 날로 상태를 넘긴다.
- 일정 기간이 지나면 주간·월간 분석을 만든다.
- 나중에는 “이번 달 편의점에서 얼마 썼지?” 같은 질문도 장부를 조회해 답한다.

전체를 세 층으로 보면 다음과 같다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:hidden;">
  <img src="/assets/pi-finance-observer/08-next-phases.svg" alt="Capture, State, Insight 세 단계로 확장되는 앞으로의 Pi Finance 구조" />
</figure>

여기에서도 원칙은 같다.

- **Capture**: “지금 무슨 거래를 말한 거지?” — fast path + semantic controller
- **State**: “그래서 지금 얼마가 남았지?” — deterministic balance / carry-forward / alert
- **Insight**: “최근 어디에 많이 썼지?” — deterministic aggregation + LLM explanation

처음에는 자연어로 돈을 기록하고 싶었을 뿐이었다.

그런데 그 작은 문제를 제대로 해보려다 보니, 결국 내가 알고 싶었던 것은 **로컬 모델에게 무엇을 시키면 편하고, 무엇은 굳이 시키지 않는 편이 좋은가**였다.

Fresh phase는 그 경계를 찾는 작업이었다.

다음 Persistent phase에서는 그 경계가 실제 생활의 연속된 상태에서도 유지되는지를 확인해볼 생각이다.
