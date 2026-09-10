from __future__ import annotations

import json
import re
from pathlib import Path

MASTER = Path("data/word-game/tbcl-b1-b2-master.json")
CANDIDATES = Path("data/word-game/word-game-classification-candidates.json")
OUT = Path("data/word-game/classification-review-queue.json")


def n(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def display_word(raw: str) -> str:
    # TBCL 원자료에는 好2, 中2처럼 항목 구분용 숫자 접미사가 존재한다.
    # 내부 key는 보존하고, 검토/UI 표시에서는 접미사를 숨길 수 있도록 별도 값을 만든다.
    return re.sub(r"(?<=\D)\d+$", "", raw or "")


def main():
    master = json.loads(MASTER.read_text(encoding="utf-8"))
    payload = json.loads(CANDIDATES.read_text(encoding="utf-8"))
    candidates = payload["items"]

    master_by_word = {row["word"]: row for row in master}

    def enrich(item):
        src = master_by_word.get(item["word"], {})
        w = n(src.get("written_freq_per_million"))
        s = n(src.get("spoken_freq_per_million"))
        return {
            "lexeme_key": item["word"],
            "display_word": display_word(item["word"]),
            "tbcl_level": item.get("tbcl_level"),
            "cefr": item.get("cefr"),
            "source_category": item.get("source_category"),
            "zhuyin": src.get("zhuyin", ""),
            "written_freq_per_million": w,
            "spoken_freq_per_million": s,
            "frequency_score": max(w, s),
            "topic_tags": item.get("topic_tags", []),
            "semantic_tags": item.get("semantic_tags", []),
            "mechanic_tags": item.get("mechanic_tags", []),
            "classification_status": item.get("classification_status"),
        }

    enriched = [enrich(item) for item in candidates]

    core_unreviewed = sorted(
        [x for x in enriched if x["source_category"] == "核心詞" and x["classification_status"] == "unreviewed"],
        key=lambda x: (-x["frequency_score"], x["lexeme_key"]),
    )[:250]

    semantic_needs_topic = sorted(
        [
            x for x in enriched
            if x["semantic_tags"] and not any(tag not in {"核心詞"} for tag in x["topic_tags"])
        ],
        key=lambda x: (-x["frequency_score"], -len(x["semantic_tags"]), x["lexeme_key"]),
    )[:150]

    multi_mechanic = sorted(
        [x for x in enriched if len(x["semantic_tags"]) >= 2 or len(x["mechanic_tags"]) >= 2],
        key=lambda x: (-len(x["mechanic_tags"]), -len(x["semantic_tags"]), -x["frequency_score"], x["lexeme_key"]),
    )[:150]

    common_nonmechanic = sorted(
        [x for x in enriched if not x["mechanic_tags"]],
        key=lambda x: (-x["frequency_score"], x["lexeme_key"]),
    )[:250]

    out = {
        "schema_version": 2,
        "description": "전체 4,070개를 한 번에 사람이 검토하지 않고, 학습 가치와 분류 필요도가 높은 단어부터 검토하기 위한 작업 큐.",
        "key_policy": "lexeme_key는 TBCL 원문 키를 보존한다. display_word는 숫자 접미사 같은 내부 구분 표기를 숨긴 학습/UI 표시 후보다.",
        "buckets": {
            "core_unreviewed_high_frequency": core_unreviewed,
            "semantic_tagged_but_topic_weak": semantic_needs_topic,
            "multi_semantic_or_mechanic": multi_mechanic,
            "high_frequency_nonmechanic": common_nonmechanic,
        },
        "review_policy": [
            "각 항목은 후보이며 사람이 뜻과 용도를 확인한다.",
            "검토가 끝난 단어만 curated word-game-overlay.json에서 reviewed로 승격한다.",
            "전술 기믹 적합 여부와 어휘 학습 중요도를 별개로 판단한다.",
            "동일 표기라도 발음·의미가 다른 항목이 있을 수 있으므로 display_word만으로 항목을 합치지 않는다."
        ]
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("review_queue_sizes", {k: len(v) for k, v in out["buckets"].items()})


if __name__ == "__main__":
    main()
