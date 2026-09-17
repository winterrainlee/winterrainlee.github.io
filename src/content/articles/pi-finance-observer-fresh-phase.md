---
title: Pi Finance Observer — Fresh Session Final Report
description: 개인 지출 기록이라는 작은 문제를 통해, 에이전트에게 무엇을 맡기고 무엇을 코드로 분리할지 관찰한 기록
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

Pi Finance Observer를 시작할 때 내가 만들고 싶었던 것은 거창한 금융 에이전트가 아니었다. 매일 내가 쓴 돈을 간단히 기록하고, 현금·교통카드·은행카드의 잔액을 이어서 관리하는 아주 작은 개인 장부였다.

그런데 실제로 만들어 보기 시작하니 내가 궁금했던 것은 가계부 자체보다 다른 쪽에 더 가까웠다.

> **LLM 에이전트는 어디까지 스스로 맡겨도 되고, 어디부터는 코드가 책임져야 할까?**

그리고 한 단계 더 들어가면 질문은 이렇게 바뀌었다.

> **에이전트가 실패했을 때, 대체 어디서부터 잘못된 걸까?**

이 글은 v0.1부터 v0.7까지의 실험을 숫자 순서대로 나열하기보다, 그 과정에서 내가 무엇을 보고 싶었고 무엇을 분리하려 했는지를 중심으로 정리한 글이다.

---

## 1. 시작점: 아주 작은 생활비 시스템

실험에 사용한 세계는 일부러 작게 만들었다. 계정은 세 개뿐이다.

| 계정 | 생활에서의 의미 | 주요 역할 |
|---|---|---|
| 현금 | 지갑 속 현금 | 직접 지출, 교통카드 충전 |
| 교통카드 | EasyCard 같은 선불 교통카드 | 교통·소액 결제, 현금에서 충전 |
| 은행카드 | 체크카드/현금 인출 원천 | 직접 결제, ATM에서 현금 인출 |

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/01-basic-system.svg" alt="현금, 교통카드, 은행카드로 이루어진 기본 생활비 시스템" style="display:block; width:920px; max-width:none; height:auto; margin:0 auto;" />
</figure>

예를 들면 이런 입력을 받는다.

```text
점심 현금 120원
버스 이지카드 25원
은행카드에서 현금 2000원 인출
현금에서 이지카드 500원 충전
```

처음에는 `사용자 입력 → LLM → 장부 수정` 정도로 생각했다. 그런데 실제로 돌려보니 이 한 줄 안에 너무 많은 능력이 한꺼번에 섞여 있었다.

---

## 2. 내가 정말 보고 싶었던 것: “성공했나?”가 아니었다

에이전트 평가에서 가장 쉬운 질문은 성공과 실패다. 하지만 내가 궁금했던 것은 그보다 세분화된 것이었다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/02-what-to-separate.svg" alt="사용자 입력에서 의미 판단, 실행과 표현, 상태 변화로 이어지는 과정과 Observer가 분리해 보려 한 실패 지점" style="display:block; width:980px; max-width:none; height:auto; margin:0 auto;" />
</figure>

최종 장부가 맞더라도 실제 과정은 다를 수 있다. 처음부터 정확하게 기록했을 수도 있고, 잘못 기록한 뒤 validator의 실패 신호를 보고 고쳤을 수도 있다.

그래서 나는 처음부터 다음을 서로 다른 것으로 보고 싶었다.

**독립 수행 능력 ≠ 도움을 받았을 때의 회복 능력 ≠ 최종 결과**

이 구분은 나중에 모델 규모, 인터페이스, validator 지원을 비교할 때 꽤 중요해졌다.

---

## 3. 그래서 Observer를 에이전트 밖에 두었다

처음 생각했던 Observer의 모습은 일종의 외주 감리 회사에 가까웠다. 에이전트는 자기 업무만 하고, 관찰과 판정은 바깥에서 한다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/03-observer-outside.svg" alt="에이전트 밖에서 실제 행동과 파일 상태를 수집하는 Observer 구조" style="display:block; width:980px; max-width:none; height:auto; margin:0 auto;" />
</figure>

중요한 것은 에이전트에게 따로 자기평가 보고서를 쓰라고 시키지 않는 것이었다.

“지금 네 판단 과정을 표로 보고해”, “실패했는지 스스로 분류해”, “무슨 능력을 사용했는지 설명해” 같은 요구는 관찰이 아니라 추가 업무다. 그 요구 자체가 모델의 행동을 바꿀 수 있다.

내가 원했던 것은 단순했다.

> 에이전트는 원래 하던 일을 하고, Observer는 실제 행동만 조용히 기록하며, 판정은 나중에 외부에서 한다.

이 원칙은 프로젝트 전체에서 계속 유지됐다.

---

## 4. 첫 번째로 분리해야 했던 것: 모델 실패 vs 실험 장치 실패

막상 첫 실험을 돌리자 모델보다 Observer와 실행 환경에서 먼저 문제가 발견됐다. 모델이 맞게 행동했는데 로그가 빠지기도 했고, runtime 오류가 났는데 harness가 정상 종료처럼 보이기도 했다. 이후 evaluator의 판정 경계나 서비스 복원 시점에서도 비슷한 문제가 나타났다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/04-failure-ownership.svg" alt="관찰된 실패를 의미 판단, 실행 표현, runtime, harness capture, evaluator 실패로 나누는 구조" style="display:block; width:980px; max-width:none; height:auto; margin:0 auto;" />
</figure>

모델이 틀린 것과 실험 장치가 틀린 것을 섞어버리면 이후 비교가 전부 흔들린다.

그래서 v0.1에서 얻은 가장 중요한 결과는 특정 모델의 점수가 아니었다.

> **에이전트를 평가하려면 먼저 Observer를 믿을 수 있어야 한다.**

Observer 자신도 사실상 관찰 대상이었다.

---

## 5. 두 번째로 분리하고 싶었던 것: “이해” vs “인터페이스 수행”

다음 질문은 이랬다.

> 모델이 거래 의미를 알고 있는데도 장부를 틀리게 쓸 수 있을까?

그럴 수 있었다.

사용자의 뜻을 이해하는 것과 내부 enum 이름을 맞추고, ID 규칙을 지키고, CSV/JSON 형식을 만들고, 여러 파일의 상태를 동기화하는 것은 같은 능력이 아니었다.

v0.2에서 같은 모델을 두고 specification과 representation만 바꿔보니 이 차이가 선명해졌다. 경제적 거래 의미와 잔액은 맞으면서도 구조화된 첫 write에서 오류가 날 수 있었고, 공개 구조 규칙을 명시해주자 같은 의미 판단이 훨씬 안정적으로 실행됐다.

여기서 이후 프로젝트를 끌고 간 질문이 생겼다.

> **모델이 정말 못하는 걸까? 아니면 내가 모델에게 쓸데없이 많은 내부 규칙을 떠넘긴 걸까?**

이 질문 때문에 이후 실험은 “더 좋은 모델 찾기”보다 “모델에게 맡긴 책임을 한 겹씩 벗겨보기” 쪽으로 움직였다.

---

## 6. 모델 비교도 “누가 더 좋나”보다 “어디서 다르게 실패하나”로 봤다

그 다음에야 서로 다른 모델을 같은 업무에서 비교했다.

초기 복합 workflow에서는 Gemma 4 26B-A4B와 Qwen3 30B-A3B 사이의 결과 차이가 컸다. 하지만 그것을 바로 모델 서열로 읽기보다, 나는 **실패의 모양**을 보고 싶었다.

이 exact finance workflow에서 Qwen은 명확한 실행 문제를 빠르고 짧게 처리했다. 반면 `카드`처럼 모호한 표현, 빠진 계좌, 상대 날짜 같은 입력에서는 빈칸을 채워서라도 행동하려는 패턴이 반복됐다.

Gemma 26B는 상대적으로 사용자의 의미가 충분히 정해졌는지를 더 신경 쓰는 쪽이었다. 모호하면 질문하고, 정보가 빠지면 멈추려는 경향이 더 강했다.

아주 거칠게 말하면 내가 관찰한 차이는 이랬다.

- Qwen: **“무슨 작업을 실행하면 되지?”**에 빨리 수렴한다.
- Gemma 26B: **“사용자가 무슨 뜻으로 말했지?”**를 조금 더 오래 붙잡는다.

이건 모델 family의 학습 철학을 단정하는 이야기가 아니다. 이 작은 workflow에서 관찰된 행동 차이를 설명한 것이다.

개인적으로는 이 실험을 통해 왜 Gemma와 대화할 때 내가 편하다고 느꼈는지도 조금 이해하게 됐다. 나는 AI에게 항상 완성된 명령을 즉시 처리하는 비서 역할만 원하는 것이 아니다. 생각 중인 것을 던지고, 아직 정하지 않은 것은 정하지 않은 상태로 남겨두면서 같이 경계를 찾는 경우가 많다.

그래서 내 사용 방식에서는 **성급하게 빈칸을 채우는 오류보다 잠깐 멈추고 확인하는 오류가 덜 불편했다.**

---

## 7. 모델 규모도 따로 봐야 했다

같은 Gemma 계열 안에서도 더 작은 E4B는 다른 모습을 보였다.

처음에는 validator 도움을 받으면 최종 결과를 잘 복구해서 “의미는 알고 형식만 약한 것 아닐까?”라고 생각할 수 있었다. 하지만 인터페이스 부담을 줄여 다시 보자 semantic wrong-action도 나타났다.

그래서 `Gemma라는 family는 이렇다`처럼 단순화하기 어렵다는 것도 확인했다.

모델 행동은 적어도 다음이 함께 작용한다.

- model family
- model capacity
- 주어진 interface
- 외부 validator와 recovery support

즉 같은 family 안에서도 규모와 역할 배치가 달라지면 failure profile이 달라질 수 있다.

---

## 8. Fresh phase에서 계속 한 일: “에이전트 성공”을 쪼개기

돌아보면 v0.1~v0.7에서 내가 한 일은 하나의 `agent success`라는 덩어리를 계속 분해하는 일이었다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/06-capability-decomposition.svg" alt="에이전트 성공을 의미 판단, 인터페이스 수행, 상태 변화, 복구와 종료로 분해한 다이어그램" style="display:block; width:1000px; max-width:none; height:auto; margin:0 auto;" />
</figure>

그리고 이 바깥에도 별도의 층이 있었다.

**Agent capability ≠ Harness integrity ≠ Observer integrity ≠ Evaluator correctness**

이것들을 분리하지 않았다면 결국 “이 모델은 잘했다/못했다” 정도의 결론밖에 얻지 못했을 것이다.

---

## 9. 점점 모델에게서 일을 빼기 시작했다

처음에는 자연어 해석부터 형식화, 계산, 파일 수정, 검증, 종료까지 한 LLM에게 맡기는 그림에 가까웠다.

그런데 각 실패를 분리해서 보다 보니 자연스럽게 질문이 생겼다.

> **이 단계들 중 정말 LLM이어야 하는 것은 몇 개나 될까?**

그래서 하나씩 책임을 코드로 옮겼다.

- 자연어 의미 판단 → LLM 후보
- 내부 enum 변환 → 코드
- 금액 계산 → 코드
- 계좌 잔액 계산 → 코드
- schema → 코드
- validation → 코드
- state mutation → 코드

그 결과 모델이 갑자기 더 똑똑해진 것처럼 보이는 순간들이 있었다. 하지만 모델 자체가 변한 것이 아니라 **모델에게 잘못 맡겼던 책임을 제거한 것**이었다.

이게 Fresh phase에서 얻은 가장 중요한 교훈 중 하나다.

---

## 10. “작은 실행 모델”도 정말 필요한지 다시 물었다

한때는 큰 모델이 의미를 판단하고, Tiny LLM이 싸고 빠르게 실제 tool call만 하는 구조를 생각했다.

그런데 의미가 이미 해결된 작업지시는 deterministic mapper가 완전히 처리할 수 있었다. 이미 결정된 의미를 다시 LLM에게 넘기면 오히려 그 의미를 변경하거나 누락할 가능성이 생긴다.

이때 생긴 개념이 `semantic authority`였다.

- 의미를 결정할 권한은 semantic controller에게 있다.
- executor나 코드는 이미 결정된 의미를 그대로 실행한다.
- executor가 이미 결정된 사실을 변경·누락·발명하면 `SEMANTIC_AUTHORITY_VIOLATION`으로 본다.

결국 **26B 뒤의 Tiny executor는 필요성이 입증되지 않았다.**

---

## 11. 그러면 26B 앞에서는 작은 모델이 필요할까?

이번에는 반대로 “명확한 요청은 작은 모델에게 보내고, 애매한 요청만 26B로 보내면 어떨까?”를 생각했다.

그런데 안전한 입력을 가려내는 deterministic gate를 만들고 보니, gate가 통과시킨 좁고 명확한 입력은 모델 없이도 deterministic parser가 처리할 수 있었다.

예를 들어 `현금 점심 85원`, `이지카드 버스 25원`, `은행카드에서 현금 2000원 인출` 같은 입력은 코드만으로 충분했다.

반대로 `카드로 점심 150원`, `커피 95원 결제했어`, `어제 저녁 현금 180원`, `지난번처럼 해줘` 같은 표현은 애매함·누락·문맥·상대시간 때문에 semantic controller로 보내는 편이 안전했다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/05-final-architecture.svg" alt="명확한 요청은 deterministic fast path로, 애매한 요청은 Gemma 26B semantic controller로 보내는 Fresh phase 최종 구조" style="display:block; width:980px; max-width:none; height:auto; margin:0 auto;" />
</figure>

현재의 좁은 fast-path surface에서는 Tiny SLM을 굳이 넣을 이유가 보이지 않았다.

---

## 12. 결국 내가 찾은 것은 “좋은 모델”보다 책임의 경계였다

처음에는 “Gemma가 더 좋은가?”, “Qwen이 더 좋은가?”, “작은 모델도 가능한가?” 같은 질문이었다.

Fresh phase 끝에서는 질문이 이렇게 바뀌었다.

> **이 문제는 누가 책임지는 것이 가장 좋은가?**

현재 내 답은 비교적 단순하다.

사람의 말이 애매하거나, 정보가 빠져 있거나, 문맥과 상대 날짜를 해석해야 하거나, 질문해야 할지를 결정해야 하는 구간은 Gemma 26B 같은 semantic controller의 역할이다.

이미 의미가 명확한 뒤의 계산, 계좌 이동, schema, 잔액, validation, state mutation은 deterministic code의 역할이다.

모델은 모든 것을 하는 주인공이라기보다 **코드만으로 확실하게 해결하기 어려운 인간 언어의 경계**를 담당한다.

---

## 13. 그래서 이건 에이전틱 워크플로우인가?

현재 구조는 LLM 하나가 모든 행동을 자유롭게 결정하는 형태와는 거리가 있다. 오히려 deterministic workflow 안에 semantic 판단이 필요한 구간만 LLM에게 넘기는 hybrid 구조다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/07-hybrid-agentic-workflow.svg" alt="deterministic workflow, semantic LLM, state와 tool로 이어지는 hybrid agentic workflow" style="display:block; width:980px; max-width:none; height:auto; margin:0 auto;" />
</figure>

나는 지금은 이것을 꽤 자연스럽게 **agentic workflow**라고 부를 수 있다고 생각한다.

바퀴를 완전히 새로 만든 것도 아니다. router, validation, state machine, tool execution 같은 구성요소는 이미 흔하다.

다만 프레임워크가 대신 정해주지 못하는 것이 있었다.

> **내 실제 업무에서는 어디까지가 code의 영역이고, 어디부터 model의 판단이 필요한가?**

이번 작업은 바퀴를 새로 발명했다기보다, 여러 바퀴를 분해해 보고 내 차에 어느 바퀴를 어느 자리에 달아야 하는지 직접 주행시험한 것에 더 가깝다.

---

## 14. Fresh 다음에는 Persistent State를 본다

지금까지는 대부분 fresh session이었다. 한 입력을 받아 무슨 거래인지 판단하고, 안전하게 기록할 수 있는지를 보는 문제였다.

하지만 실제로 내가 원하는 장부는 하루만 쓰고 버리는 것이 아니다. 거래가 쌓이면서 상태가 이어져야 한다.

어제의 closing balance가 오늘의 opening balance가 되고, 오늘 거래를 반영한 closing balance가 다시 내일로 넘어가야 한다.

특히 현금과 교통카드는 생활 도중에 떨어지면 바로 불편해진다. 그래서 앞으로는 거래를 하나 기록할 때마다 관련 잔액을 즉시 보여주고 싶다.

예를 들어 현금 지출 뒤 잔액이 기준 이하로 내려가면 `LOW_CASH`, EasyCard가 기준 이하로 내려가면 `LOW_EASYCARD`를 코드가 판단하고 다음 외출이나 이동 전에 준비할 것을 알려주는 식이다.

이 판단은 LLM보다 deterministic state logic이 담당하는 편이 맞다.

---

## 15. 앞으로의 세 층: Capture → State → Insight

지금은 전체 시스템을 세 층으로 보고 있다.

<figure style="margin:2rem 0; padding:1rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto;">
  <img src="/assets/pi-finance-observer/08-next-phases.svg" alt="Capture에서 State를 거쳐 Insight로 이어지는 Pi Finance Observer의 다음 단계" style="display:block; width:980px; max-width:none; height:auto; margin:0 auto;" />
</figure>

**Capture**는 “지금 무슨 거래를 말한 거지?”를 다룬다. Fresh phase에서 주로 본 부분이다.

**State**는 “그래서 지금 얼마 남았지?”를 다룬다. 거래가 계좌 잔액을 정확하게 바꾸고, 하루가 바뀌어도 상태가 이어지고, 현금이나 EasyCard가 부족할 때 즉시 알려주는 단계다.

**Insight**는 “최근에 어디에 많이 썼지?”를 다룬다. 여기서는 코드를 통해 먼저 카테고리별·기간별 통계를 계산하고, LLM은 계산된 결과를 설명하는 역할을 맡길 수 있다.

더 발전하면 “이번 달 편의점에서 얼마나 썼지?”, “이번 주 식비가 지난주보다 늘었나?” 같은 질문도 할 수 있을 것이다.

여기서도 원칙은 같다.

> **모델이 모든 데이터를 기억하는 것이 아니라, 필요할 때 장부를 읽고 의미를 연결한다.**

---

## 16. Fresh phase를 끝내며

처음에 내가 상상한 개인 회계 에이전트는 “사용자 → 똑똑한 LLM → 알아서 장부 관리”에 가까웠다.

지금은 훨씬 다르게 본다.

명확한 입력은 코드가 처리하고, 애매한 입력만 semantic controller가 해석한다. 그 뒤의 상태 변화와 잔액, 검증은 다시 deterministic core가 책임진다.

Fresh phase에서 얻은 가장 중요한 산출물은 특정 모델의 승패가 아니었다.

**어떤 문제를 모델에게 맡기고, 어떤 문제는 모델에게 맡기지 말아야 하는지에 대한 지도**가 생긴 것이 가장 컸다.

그리고 Observer의 역할도 조금 달라 보이기 시작했다. 처음에는 모델을 감시하는 도구라고 생각했지만, 지금은 오히려 다음 질문을 반복해서 던지는 도구에 가깝다.

- 어디서 실패했는가?
- 왜 실패했는가?
- 그 실패는 모델의 책임인가?
- 인터페이스나 실험 장치의 책임인가?
- 코드로 옮길 수 있는가?
- 그래도 모델이 필요한 것은 무엇인가?

그래서 다음 Persistent phase에서도 목표는 “더 많은 것을 에이전트에게 맡기기”가 아니다.

오히려 반대다.

> **상태가 이어지는 실제 생활 workflow에서도, 모델이 꼭 필요한 지점을 계속 좁혀가는 것.**

Fresh session 실험은 여기서 일단 닫는다.
