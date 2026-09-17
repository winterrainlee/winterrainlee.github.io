---
title: Pi Finance Observer — Fresh Session Final Report
description: v0.1부터 v0.7까지, 모델을 비교하던 실험이 deterministic fast path와 semantic controller의 경계를 찾는 과정으로 바뀐 기록
date: 2026-09-17
tags:
  - AI
  - agentic
  - local-llm
  - observer
draft: false
---

Pi Finance Observer의 Fresh phase는 처음에는 단순한 질문에서 출발했다.

> 로컬 LLM 에이전트에게 개인 지출 기록 업무를 맡겼을 때 어떤 모델이 더 잘 수행하는가?

그런데 v0.1부터 v0.7까지 실험을 진행하면서 질문 자체가 바뀌었다.

> 이 업무의 어느 부분이 정말 LLM을 필요로 하며, 어느 부분은 deterministic code가 더 적합한가?

결국 Fresh phase의 가장 중요한 산출물은 특정 모델의 승패가 아니었다. **어떤 문제를 모델에게 맡겨야 하는지에 대한 지도**가 남았다.

현재까지의 결론을 먼저 쓰면 다음과 같다.

```text
User input
   ↓
Deterministic Eligibility Gate
   ├─ explicit / closed / complete
   │      ↓
   │  Deterministic Fast-Path Parser
   │      ↓
   │  Deterministic Normalizer / Finance Core
   │
   └─ ambiguous / incomplete / contextual / free-form
          ↓
      Gemma 4 26B-A4B
      Semantic Controller Candidate
          ↓
      Deterministic Finance Core
```

Tiny SLM을 붙이는 구조도 검토했지만, 현재 Fresh fast path에서는 **작은 모델보다 코드가 더 적합했다.**

이 글은 이 결론에 어떻게 도달했는지, 그리고 다음 Persistent phase에서 무엇을 확인할지를 정리한 기록이다.

---

## v0.1 — 모델보다 Observer를 먼저 믿을 수 있어야 했다

v0.1의 핵심은 모델 성능 수치가 아니라 **무엇을 관찰할 것인가**를 정의하는 일이었다.

처음부터 다음을 분리했다.

```text
Agent execution
   ↓
Passive trace capture
   ↓
Visible validator
   ↓
Hidden deterministic evaluator
   ↓
Earliest observable divergence
   ↓
Recovery / termination
```

synthetic mini-world를 사용하고, agent에게 hidden expected result를 노출하지 않았다. 각 run은 fresh workspace에서 시작하고, 최종 파일만 보는 대신 tool trajectory와 file mutation을 보존했다.

또 성공 여부만 기록하지 않고 **최초로 관찰 가능한 이탈**과 **그 뒤의 복구 여부**를 보려고 했다.

이 설계는 live canary에서 바로 필요해졌다. 모델 자체와 무관한 문제가 먼저 나타났기 때문이다.

- runtime OOM으로 decode가 중단될 수 있었다.
- model error가 있어도 process exit가 정상처럼 보일 수 있었다.
- streaming capture와 file-change 기록 사이에 gap이 생길 수 있었다.

이런 문제를 고치고 나서야 모델 결과를 capability evidence로 사용할 수 있었다.

primary 10건에서는 최종 task success가 9/10이었지만 transaction과 balance state 자체는 10/10 정확했다. 반면 mutation case의 first-pass 성공은 2/8에 불과했고 validator feedback 뒤 복구가 반복적으로 나타났다.

이때부터 프로젝트의 기본 원칙이 생겼다.

> **모델 실패와 Observer 실패를 분리해야 한다.**

> **최종적으로 맞았다는 것과 처음부터 독립적으로 맞았다는 것은 다른 정보다.**

> **관측이 깨진 run은 모델이 맞았더라도 capability evidence로 사용하지 않는다.**

---

## v0.2 — Semantic competence와 interface execution은 다르다

v0.2에서는 같은 Gemma/Pi 환경에서 specification과 ledger representation만 바꾼 36-run first study를 진행했다.

가장 중요한 결과는 **경제 의미 능력과 interface 실행 능력이 분리된다**는 것이었다.

관찰 가능한 mutation 25건의 transaction과 balance는 25/25 정확했고 semantic divergence는 0이었다.

그런데 independent first-pass execution은 specification에 따라 크게 달라졌다.

```text
VALIDATOR_GUIDED
pre-feedback structural PASS: 2/9

FULL_SPEC
pre-feedback structural PASS: 9/9
```

두 조건에서 경제 의미는 모두 9/9 정확했지만, public structural specification을 충분히 주느냐에 따라 첫 실행 성공이 `2/9 → 9/9`로 바뀌었다.

여기서 이후 프로젝트를 계속 끌고 간 질문이 생겼다.

> 모델이 의미를 몰라서 실패한 것인가?

> 아니면 우리가 모델에게 불필요하거나 불완전한 interface responsibility를 준 것인가?

Representation 비교에서도 비슷했다. CSV 조건이 workflow cost 측면에서 더 유리한 신호를 보였지만 Markdown 자체의 observed structural divergence는 0이었다. 차이에는 validation timing, process cost, runtime censor가 함께 작용했다.

그래서 “Markdown이라서 나쁘다” 같은 식으로 성급하게 해석하지 않았다.

또 temperature 0과 고정 seed도 local trajectory를 완전히 고정하지 않았다. 이후의 반복 실험들은 이 경험에서 출발했다.

그리고 evaluator 자체의 freshness boundary defect도 발견했다. 기존 결과를 소급 수정하지 않고 historical evidence로 보존한 채 새 version에서 교정했다.

**Observer 자신도 관찰 대상**이라는 사실을 여기서 배웠다.

---

## v0.3 — 모델 비교보다 failure topology가 더 중요했다

v0.3에서는 Gemma 4 26B-A4B와 Qwen3 30B-A3B를 같은 복합 finance agent workflow에서 비교했다.

### Gemma 4 26B-A4B

- final PASS: 12/12
- semantic transaction exactness: 9/9
- representation first-pass: 9/9
- clarification: 3/3
- state consistency: 9/9
- termination: 12/12

### Qwen3 30B-A3B

- PASS 4
- FAIL 7
- runtime-censored 1
- semantic exactness: 4/7 observed
- representation first-pass: 3/8
- clarification: 1/3
- termination: 7/11

겉으로 보면 “Gemma가 좋고 Qwen이 나쁘다”라고 끝낼 수 있었다.

하지만 Qwen의 failure에는 semantic decision, representation, protected write, validator interaction, recovery loop, termination이 뒤섞여 있었다.

그래서 더 중요한 질문은 이것이었다.

> **Qwen이 finance semantics를 이해하지 못하는가, 아니면 복합 agent harness와 잘 맞지 않는가?**

이 질문이 이후 responsibility reduction으로 이어졌다.

---

## v0.3.1 — Final success와 독립 수행은 다르다

Gemma E4B scale probe는 또 다른 분리를 보여주었다.

- final PASS: 12/12
- semantic exactness: 9/9
- state consistency: 9/9
- representation first-pass: 0/9

9개 mutation path가 validator-assisted recovery를 필요로 했다.

즉 다음은 서로 다른 능력이다.

```text
무엇을 해야 하는지 안다
≠
혼자 정확하게 실행한다
≠
지원이 있으면 최종적으로 완료한다
```

Final success 하나로는 독립 수행과 scaffolded recovery를 구분할 수 없다.

---

## v0.4 — 모델에게 맡긴 책임을 하나씩 덜어내다

v0.4 계열에서는 모델에게 맡긴 responsibility를 하나씩 제거했다.

가설은 간단했다.

> LLM은 의미 판단을 하고, low-level accounting/state/serialization은 deterministic code가 맡으면 더 안정적이지 않을까?

### 작은 interface도 잘못 설계하면 어렵다

v0.4.1에서는 Minimal Action interface를 만들었지만 모델에게 내부 enum/codebook normalization까지 맡겼다. 26B조차 크게 흔들렸다.

즉 interface가 작다는 것만으로 충분하지 않았다.

**사용자 표현을 내부 canonical code로 번역하는 일 자체가 별도의 책임**이었다.

### Normalization을 코드로 옮기다

v0.4.2에서는 localized surface alias를 deterministic normalizer가 canonical account/category/currency/date로 바꾸게 했다.

그 결과 26B의 explicit critical action은 `0/6 → 6/6`으로 회복됐다.

이때 architecture 원칙이 선명해졌다.

> **모델은 의미를 판단하고, 내부 표현은 코드가 책임진다.**

### 올바른 결론과 실제 행동도 다르다

Missing-account 반복에서는 26B가 5회 중 4회 올바르게 clarification했고, 한 번은 active-generation runaway가 나타났다.

흥미로운 점은 runaway에서도 모델이 이미 “계좌를 물어봐야 한다”는 결론에는 도달했다는 것이다.

실패는 그 결론을 tool call로 넘기는 구간에서 발생했다.

> **올바른 결론에 도달하는 것과 그 결론을 실제 행동으로 전환하는 것도 서로 다른 능력이다.**

---

## v0.4.3 — E4B의 한계는 representation만이 아니었다

surface-semantic interface에서 E4B를 다시 평가했다.

- first-pass semantic success: 12/24
- explicit critical exact: 12/18
- clarification true positive: 0/6
- semantic wrong-action: 9/24
- timeout: 0

이 결과는 “E4B는 의미는 알지만 표현만 약하다”는 앞선 해석을 수정하게 했다.

Representation 부담을 없앤 뒤에도 semantic wrong-action이 반복됐다.

---

## v0.4.4 / v0.4.4.1 — Qwen 패자부활전

Qwen을 같은 surface-semantic interface에서 다시 평가했다.

Primary campaign은 모든 inference가 끝난 뒤 postflight runtime readiness 문제로 integrity-stop되었기 때문에, 결과를 억지로 primary로 승격시키지 않았다. 대신 이미 보존된 trace를 별도의 zero-model-call secondary analysis에서 사용했다.

결과는 꽤 흥미로웠다.

- first-pass semantic success: 15/24
- explicit semantic exact: 15/18
- C01–C05 explicit transactions: 15/15
- clarification: 0/6
- relative-date failure: 3/3
- timeout/runaway: 0

Qwen은 cash expense, EasyCard expense, income, EasyCard top-up, ATM withdrawal처럼 **답이 명확한 explicit action**에서 강했다.

특히 ATM withdrawal도 정확히 `travel_card → cash` transfer로 처리했다.

반대로 다음과 같은 경계에서 세 repeat 모두 같은 방향으로 실패했다.

### Ambiguity

```text
카드로 점심 150원
```

→ 물어보지 않고 transaction을 만들었다.

### Missing information

```text
커피 95원 결제했어
```

→ 계좌가 없는데도 transaction을 완성하려 했다.

### Relative date

```text
어제 저녁 현금 180원
```

→ `어제`를 제대로 변환하지 못했다.

이 결과를 보고 Qwen의 성격을 이렇게 정리했다.

> **답이 명확한 실행 문제에는 빠르고 강하지만, “지금 행동해도 되는가?”를 판단하는 abstention/clarification boundary가 약하다.**

v0.3에서 보였던 Qwen의 총체적 실패 중 상당 부분은 모델 자체의 semantic incapability라기보다 **complex workflow와의 interaction**이었다는 것도 알게 됐다.

---

## v0.5 — Tiny Executor가 정말 필요한가?

다음 구조를 잠시 생각했다.

```text
Gemma 26B
→ resolved work order
→ Tiny Executor
→ deterministic core
```

그런데 no-LLM baseline에서 deterministic mapper만으로 W0/W1 valid 12/12, invalid rejection 10/10, action/argument/sequence fidelity 12/12, semantic authority violation 0을 달성했다.

결론은 단순했다.

> **26B가 이미 의미를 해결한 뒤 Tiny LLM을 붙일 이유는 없다.**

이미 resolved된 work order를 작은 모델에게 다시 주면 Tiny는 사실상 stochastic serializer가 된다.

이 단계에서 `SEMANTIC_AUTHORITY_VIOLATION`이라는 개념도 추가했다.

Upstream controller가 이미 확정한 의미를 executor가 변경·누락·발명·재정렬하면, 단순히 “틀렸다”뿐 아니라 **자기 책임 범위를 넘어섰다**고 별도로 기록할 수 있게 했다.

---

## v0.6 — Tiny가 있다면 controller 앞이어야 했다

Tiny model의 가능한 위치를 controller 뒤가 아니라 controller 앞 fast path로 옮겼다.

```text
User
  ↓
Deterministic Gate
   ├─ safe → Fast-path candidate
   └─ uncertain → Gemma 26B
```

새 minimal-pair corpus 46건에서:

- false accept: 0
- false reject: 1
- true accept: 22
- true reject: 23
- safe precision: 100%
- recall: 95.65%

을 얻었다.

Qwen의 기존 24-run evidence를 offline replay했더니:

- gate accepted: 12
- accepted Qwen exact: 12/12
- historical failures intercepted: 9/9
- historical success retained: 12/15

이었다.

즉 deterministic gate는 **Qwen이 잘하는 입력만 골라내는 것**까지 가능했다.

그런데 여기서 또 질문이 생겼다.

> Gate가 이미 action과 필요한 semantic fact를 확인했는데 Tiny model이 정말 필요한가?

---

## v0.7 — 결국 fast path에서도 모델이 빠졌다

마지막으로 다음 Architecture C를 직접 시험했다.

```text
User
→ deterministic gate
→ deterministic parser
→ deterministic normalizer
→ finance core
```

### Frozen Set A

v0.6 accepted corpus 22건은 canonical exact 22/22, 3-repeat byte identity 22/22였다.

### Fresh Set B

Parser 구현 전에 동결한 새 표현 24건도 canonical exact 24/24였다.

- expense: 5/5
- income: 4/4
- transfer: 6/6
- refund: 4/4
- correction: 5/5

### Shadow Set C

Controller가 필요한 minimal pair 24건은 모두 parser 실행 전에 차단됐다.

- blocked before parser: 24/24
- parser false accept: 0

Parser를 위해 새 semantic engine을 만들 필요도 없었다.

- frozen gate: 377 executable LOC
- parser: +156 LOC
- new lexical table: 0
- duplicated rule: 0
- unique parser semantic rule: 0
- fixture-specific exception: 0
- fuzzy matching / embedding / LLM-like ranking: 0

결론은 **Case C1 — Deterministic Fast Path Sufficient**였다.

현재 accepted closed surface에서는 Tiny SLM의 incremental value가 없다.

---

# Fresh phase의 최종 architecture

현재 evidence에서 가장 단순하고 근거가 강한 구조는 다음이다.

```text
                    User Input
                        |
                        v
          Deterministic Eligibility Gate
                /                 \
             ACCEPT              REJECT
                |                  |
                v                  v
      Deterministic Parser    Gemma 4 26B-A4B
                |             Semantic Controller
                |                  |
                +--------+---------+
                         |
                         v
              Deterministic Normalizer
                         |
                         v
                 Finance State Core
```

### Code가 맡는 것

- exact alias resolution
- known closed-surface action
- amount extraction
- account/category mapping
- transfer projection
- normalization
- schema validation
- arithmetic
- state transition
- replay와 invariant validation

### Gemma 26B가 맡는 것

- 자유로운 사용자 자연어
- ambiguity
- missing information
- clarification
- relative/contextual time
- dialogue context
- contradiction
- free-form/unsupported request interpretation

### Tiny SLM

현재 fast path에서는 **필요 없음**.

실제 사용에서 필요한 표현을 넓히는 과정에서 deterministic gate/parser가 지나치게 복잡해질 때 다시 후보로 검토하면 된다.

---

# Fresh phase에서 얻은 몇 가지 교훈

## 복잡한 task가 semantic workflow 분석에 꼭 필요한 것은 아니었다

작은 contrast가 오히려 boundary를 더 선명하게 보여주었다.

```text
이지카드로 점심 150원
vs
카드로 점심 150원
```

이 작은 차이만으로 `account extraction`과 `ambiguity detection`을 분리할 수 있었다.

앞으로도 **한 fixture에서 가능한 한 하나의 semantic decision만 흔드는 것**이 좋은 원칙이 될 것 같다.

## Final success보다 failure location이 중요했다

다음은 서로 다른 능력이다.

```text
이해한다
독립적으로 실행한다
지원이 있으면 복구한다
정확하게 종료한다
```

하나의 PASS/FAIL에 다 집어넣으면 중요한 정보가 사라진다.

## 모델의 실패 방향도 실용성의 일부였다

Qwen은 빈칸이 있어도 실행 가능한 action을 완성하려는 쪽이었고, Gemma 26B는 의미가 충분하지 않을 때 질문하거나 행동을 늦추는 쪽이 상대적으로 강했다.

단순 정확도 외에 **어떤 방향으로 실패하는가**가 실제 사용자 경험에 중요하다는 신호였다.

## Scaling이 responsibility separation을 대신하지는 않았다

Gemma 26B는 현재 가장 강한 controller 후보지만 완벽하지 않다.

그래서 다음 구조는 계속 유지해야 한다.

```text
26B judgment
→ deterministic validation
→ deterministic state mutation
```

큰 모델이 있다고 해서 상태 변경과 invariant를 모델에게 넘길 이유는 없다.

## 모델을 쓰는 것 자체가 목표가 아니었다

Tiny executor를 찾으려 했는데 오히려 Tiny model보다 code가 더 적합한 영역을 발견했다.

Observer는 모델을 더 많이 넣기 위한 도구가 아니라 **모델이 필요한 경계를 찾는 도구**가 되었다.

## Observer 자신도 관찰 대상이었다

capture 문제, evaluator defect, runtime readiness race 같은 사건들은 모두 같은 교훈을 반복했다.

> **모델 결과와 실험 장치의 결과를 분리해야 한다.**

Evidence custody와 fail-closed protocol은 부가 기능이 아니라 실험 결과의 일부였다.

---

# 아직 모르는 것

Fresh phase에서 다음은 아직 확인하지 않았다.

- 실제 사용자 입력 중 deterministic fast-path 비율
- 장기간 workload distribution
- persistent account state
- daily balance carry-forward
- 실제 correction/reconciliation
- periodic analytics
- ledger-backed Q&A
- 모든 fallback case에서의 26B 안정성
- 모든 finance action의 실제 persistent commit
- production deployment

특히 diagnostic corpus의 fast-path 비율을 실제 사용자 요청 비율로 해석해서는 안 된다.

---

# 다음 단계 — Persistent State

다음 phase에서 persistent는 “모델 대화 context를 오래 유지한다”는 뜻이 아니다.

Persistent하게 유지해야 할 것은 **장부의 world state**다.

초기에는 기존 CSV/JSON 구조를 유지한다.

```text
ledger.csv + balances.json
        ↓
deterministic state transition / replay
        ↓
current account state
```

당장 DB migration을 할 이유는 없다. 우선 필요한 것은 stable transaction identity, reproducible state transition, replay 가능성, correction semantics, day boundary consistency다.

---

## v0.8 — Transaction → Balance Propagation

첫 Persistent milestone은 transaction commit이 기존 account state를 정확하게 바꾸는지 확인하는 것이다.

- expense → 해당 account 감소
- income → 해당 account 증가
- transfer → source 감소 + target 증가
- refund → 정의된 reverse effect
- correction → intended state만 변경
- rejected action → state mutation 0
- duplicate commit 방지
- replay 결과 동일

새 failure taxonomy 후보는 다음과 같다.

```text
BALANCE_PROPAGATION_ERROR
SOURCE_BALANCE_ERROR
TARGET_BALANCE_ERROR
DOUBLE_COMMIT
FAILED_ACTION_STATE_MUTATION
STATE_REPLAY_MISMATCH
```

---

## v0.9 — Immediate Balance Feedback

현금과 EasyCard는 도중에 부족하면 실제 생활에서 바로 문제가 된다.

따라서 transaction commit 직후 잔액을 알려주는 편이 자연스럽다.

```text
점심 120원 현금
→ 기록 완료
→ 현금 잔액 380 TWD
→ LOW_CASH
```

```text
버스 25원 이지카드
→ 기록 완료
→ 이지카드 잔액 72 TWD
→ LOW_EASYCARD
```

Transfer에서는 관련된 두 계좌를 모두 보여준다.

```text
현금 → EasyCard 500

현금: 1200 → 700
이지카드: 60 → 560
```

이 계산과 threshold alert는 LLM보다 deterministic code의 책임에 가깝다.

---

## v0.10 — Daily Close / Carry Forward

하루 lifecycle을 도입한다.

```text
Yesterday Closing Balance
        ↓
Today Opening Balance
        +
Today Transactions
        ↓
Today Closing Balance
```

핵심 invariant는 단순하다.

```text
D-1 closing == D opening
```

Daily close에서는 opening balance, transactions, closing balance, threshold alert, next-day action을 만든다.

예를 들어 현금이 기준 이하라면 다음 외출 전에 인출해야 한다는 정보를 줄 수 있다.

v0.8~v0.10까지 끝나면 실제 생활에서 다음 질문에 답할 수 있는 최소 시스템이 만들어진다.

> 오늘 무엇을 썼는가?

> 지금 현금과 EasyCard가 얼마 남았는가?

> 다음 외출 전에 무엇을 준비해야 하는가?

---

## v0.11 — Historical Correction / Reconciliation

그 다음부터 다시 LLM semantic workflow가 중요해진다.

> 어제 저녁 현금 180원이 아니라 160원이었어.

```text
User request
 ↓
26B semantic interpretation
 ↓
ledger query
 ↓
candidate transaction(s)
 ↓
unique?
 ├─ yes → correction proposal
 └─ no  → clarification
 ↓
deterministic commit
```

Fresh ambiguity가 “현재 입력 자체가 충분한가?”였다면 Persistent ambiguity는 다음과 같다.

> **입력과 기존 ledger state를 합쳐 target transaction이 유일한가?**

---

## v0.12 — Periodic Aggregation and Summary

주간·월간 지출 분석은 먼저 코드가 집계하고, 모델은 그 결과를 설명하는 식으로 나누는 것이 자연스럽다.

```text
total spending
category totals
account totals
week-over-week delta
month-over-month delta
largest categories
largest changes
```

Observer는 `Aggregation correctness`와 `Narrative faithfulness`를 분리해서 볼 수 있다.

예를 들어 숫자에는 식비가 340 TWD 늘었다는 정보만 있는데 모델이 “외식을 많이 해서 늘었다”고 단정하면 unsupported analytic claim이다.

---

## v0.13 — Ledger-backed Q&A

마지막 단계에서는 자유 질의를 지원한다.

> 이번 달 편의점에서 얼마 썼어?

```text
Question
 ↓
26B query interpretation
 ↓
Deterministic ledger query
 ↓
Structured result
 ↓
26B response
```

모델이 장부 전체를 장기 context에 보관하는 것이 아니라, **필요한 state를 tool/query로 읽는 방식**을 기본으로 한다.

---

# 앞으로의 Observer 구조

Pi Finance Observer는 앞으로 세 층으로 정리할 수 있다.

| Layer | 핵심 질문 | 주 책임 |
|---|---|---|
| Capture | 이 요청은 무슨 거래인가? | deterministic fast path + Gemma 26B fallback |
| State | 그래서 지금 계좌 상태는 무엇인가? | deterministic finance core |
| Insight | 이 기록은 무엇을 의미하는가? | deterministic aggregation + Gemma 26B explanation |

다음 순서는 이렇게 잡는다.

```text
v0.8  Transaction → Balance
  ↓
v0.9  Immediate Balance + Threshold Alert
  ↓
v0.10 Daily Close + Carry Forward
  ↓
v0.11 Historical Reconciliation
  ↓
v0.12 Periodic Analytics
  ↓
v0.13 Ledger-backed Q&A
```

---

# Fresh phase closing

처음에는 대략 이런 그림을 생각했다.

```text
LLM Agent
→ tools
→ ledger
```

실험을 거친 뒤에는 책임을 더 단순하게 나눌 수 있게 됐다.

```text
Code가 확실히 아는 것
→ Code

사람의 표현이 애매한 것
→ Gemma 4 26B-A4B

상태와 계산
→ Code

설명과 문맥 판단
→ Gemma 4 26B-A4B
```

아주 좁은 finance domain이지만, 코드가 잘하는 일을 코드에게 넘기고 의미적으로 애매한 경계를 모델에게 남겨두면 Gemma 4 26B-A4B 정도의 로컬 모델도 꽤 실용적인 semantic-controller candidate가 될 수 있다는 가능성이 보였다.

반대로 Qwen과 Tiny SLM을 뜯어본 과정은 **모델이 필요하지 않은 곳을 찾는 데** 큰 역할을 했다.

Fresh phase의 결론은 그래서 특정 모델의 승패가 아니다.

> **모델이 필요한 곳과 필요하지 않은 곳의 경계를 직접 관찰하고 분리할 수 있었다.**

이제 다음 질문은 하나다.

> **이 구조 위에서 상태가 하루에서 다음 날로 정확히 이어지는가?**

Persistent phase의 첫 milestone은 **Transaction → Balance → Immediate Feedback → Daily Close**다.
