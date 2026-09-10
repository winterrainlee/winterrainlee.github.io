from __future__ import annotations

import classify_word_game_vocab as base

# 원자료 category 표기와 규칙표의 문장부호 차이를 흡수한다.
CATEGORY_ALIASES = {
    "日常起居": "日常、起居",
}

for source_name, rule_name in CATEGORY_ALIASES.items():
    if rule_name in base.TOPIC_RULES:
        base.TOPIC_RULES[source_name] = base.TOPIC_RULES[rule_name]

base.RULE_VERSION = "2026-09-v0.2"
base.main()

# v0.1 보고서의 표현을 실제 상태에 맞게 정교화한다.
text = base.REPORT.read_text(encoding="utf-8")
text = text.replace(
    "현재 아무 프로젝트 태그도 붙지 않은 어휘는",
    "현재 assisted 세부 주제·의미 후보가 아직 붙지 않은 어휘는",
)
text = text.replace(
    "이 단어들은 억지로 자동 태깅하지 않고, 이후 의미 자료나 사람 검토를 통해 분류한다.",
    "이 중 다수는 TBCL 상황 또는 그 상황을 나눈 broad topic 정보는 이미 가지고 있다. 세부 주제·의미 후보를 억지로 채우지 않고 이후 의미 자료나 사람 검토를 통해 보강한다.",
)
base.REPORT.write_text(text, encoding="utf-8")
