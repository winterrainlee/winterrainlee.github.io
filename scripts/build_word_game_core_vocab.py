from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from pathlib import Path

MASTER = Path('data/word-game/tbcl-b1-b2-master.json')
OUT_JSON = Path('data/word-game/core-vocab-v0.1.json')
OUT_MD = Path('data/word-game/CORE-VOCAB-v0.1.md')

# 튜토리얼 직후 월드를 설계하기 위한 의미군별 후보.
# 이 목록 자체가 최종 학습 목록은 아니다. TBCL B1-B2 master와 교차한 뒤 실제 빈도를 반영해 추린다.
GROUPS = {
    '이동·공간': {
        'quota': 25,
        'words': '接近 到達 經過 通過 返回 進入 退出 離開 趕上 遇到 距離 方向 位置 路線 移動 前進 後退 轉向 經由 穿過 超過 範圍 內部 外部 中間 周圍 附近 目的地 障礙 速度 追 跟隨 帶領 引導 停止 繼續 對面'.split(),
    },
    '변화·조절': {
        'quota': 30,
        'words': '改變 改進 改善 增加 減少 加強 保持 調整 控制 分配 分散 集中 選擇 決定 限制 允許 禁止 避免 防止 保護 維持 取消 取代 代替 恢復 發展 形成 建立 破壞 消失 出現 完成 成功 失敗 解決 處理 影響 結果 原因 條件'.split(),
    },
    '자원·거래': {
        'quota': 25,
        'words': '資源 費用 價格 收入 支出 負擔 付出 投入 供應 提供 交換 交易 生產 消費 購買 銷售 推銷 競爭 合作 分配 數量 數目 比例 程度 價值 效果 效率 需要 需求 取得 獲得 擁有 缺少 剩下 足夠 額外'.split(),
    },
    '관계·의사결정': {
        'quota': 30,
        'words': '表達 說明 解釋 強調 討論 建議 同意 反對 支持 接受 拒絕 說服 投票 爭論 妥協 決定 選擇 確定 確認 判斷 認為 覺得 相信 信任 懷疑 誤會 原諒 尊重 合作 配合 幫助 負責 責任 公平 規則 規定 權利 義務 違反 維護 關係 互動 聯絡 通知 回應'.split(),
    },
    '위험·갈등': {
        'quota': 20,
        'words': '危險 安全 威脅 傷害 攻擊 防守 保衛 保護 防止 避免 救 救援 衝突 對抗 挑戰 戰爭 犯罪 事故 意外 受傷 死亡 緊急 警告 注意 小心 逃 脫離 突破 失去 損失 破壞 危機 風險 穩定 控制'.split(),
    },
    '사고·핵심추상어': {
        'quota': 30,
        'words': '思考 分析 比較 區別 判斷 證明 證實 確認 發現 了解 理解 注意 記得 忘記 經驗 資料 資訊 情況 問題 方法 方式 目的 原因 結果 影響 關係 可能 必須 應該 需要 重要 主要 特別 一般 直接 間接 正確 錯誤 真實 符合 適合 關鍵 條件 標準 程度 內容 部分 整體 方面 對象 過程 機會 能力 技術'.split(),
    },
}

# 초반 설계와 튜토리얼 연결을 위해 빈도만으로 탈락시키지 않을 고정 앵커.
REQUIRED = {
    '接近', '到達', '通過', '經過', '返回', '進入', '退出',
    '改變', '增加', '減少', '保持', '調整', '控制', '分配', '集中',
    '避免', '保護', '選擇', '決定', '比較', '支持', '反對', '接受', '拒絕',
    '說明', '解釋', '表達', '合作', '責任', '公平', '信任', '懷疑',
    '危險', '安全', '影響', '原因', '結果', '條件', '問題', '方式', '目的',
}


def clean_display_word(word: str) -> str:
    # TBCL의 好2 / 中2 같은 동형어 내부 구분 키는 화면 표시에서 숫자를 숨긴다.
    return re.sub(r'\d+$', '', word)


def n(value) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def frequency_score(row: dict) -> float:
    w = n(row.get('written_freq_per_million'))
    s = n(row.get('spoken_freq_per_million'))
    # 초반 모바일 게임은 대화·생활 맥락 비중이 높으므로 구어 빈도를 약간 더 반영한다.
    return math.log1p(w) + 1.15 * math.log1p(s)


def main():
    master = json.loads(MASTER.read_text(encoding='utf-8'))

    # 원문 키와 화면 표기를 모두 인덱싱한다. 같은 표기 동형어가 있으면 각각 후보로 남긴다.
    by_display = defaultdict(list)
    for row in master:
        by_display[clean_display_word(row['word'])].append(row)
        if '/' in row['word']:
            for part in row['word'].split('/'):
                by_display[clean_display_word(part)].append(row)

    selected = []
    used_lexemes = set()
    missing = defaultdict(list)

    for group_name, config in GROUPS.items():
        pool = []
        for seed_order, surface in enumerate(config['words']):
            rows = by_display.get(surface, [])
            if not rows:
                missing[group_name].append(surface)
                continue
            for row in rows:
                lexeme = row['word']
                if lexeme in used_lexemes:
                    continue
                score = frequency_score(row)
                # B1은 튜토리얼 직후에 바로 쓰기 조금 더 쉽다는 정도의 작은 보정만 준다.
                if row.get('cefr') == 'B1':
                    score += 0.35
                if surface in REQUIRED or clean_display_word(lexeme) in REQUIRED:
                    score += 5.0
                # 후보 목록 앞쪽은 게임 진행상 조금 더 중요하게 배치한 순서다.
                score += max(0, 1.2 - seed_order * 0.025)
                pool.append((score, seed_order, surface, row))

        # 필요한 앵커가 이 그룹에 있다면 먼저 넣고, 나머지는 빈도+진행 점수로 채운다.
        pool.sort(key=lambda x: (-x[0], x[1], x[2]))
        chosen = []
        for item in pool:
            row = item[3]
            if row['word'] in used_lexemes:
                continue
            chosen.append(item)
            used_lexemes.add(row['word'])
            if len(chosen) >= config['quota']:
                break

        for rank, (score, seed_order, surface, row) in enumerate(chosen, start=1):
            selected.append({
                'lexeme_key': row['word'],
                'display_word': clean_display_word(row['word']),
                'zhuyin': row.get('zhuyin', ''),
                'pinyin': row.get('pinyin', ''),
                'tbcl_level': row.get('tbcl_level'),
                'cefr': row.get('cefr'),
                'source_category': row.get('category'),
                'written_freq_per_million': n(row.get('written_freq_per_million')),
                'spoken_freq_per_million': n(row.get('spoken_freq_per_million')),
                'selection_score': round(score, 3),
                'core_group': group_name,
                'group_rank': rank,
                'required_anchor': surface in REQUIRED or clean_display_word(row['word']) in REQUIRED,
            })

    # 혹시 동형어 중 같은 display_word가 여러 개 뽑히면 발음/뜻 검토 전이므로 그대로 보존한다.
    counts = defaultdict(int)
    for item in selected:
        counts[item['core_group']] += 1

    payload = {
        'schema_version': 1,
        'name': '튜토리얼 직후 핵심 어휘 풀 v0.1',
        'target_size': sum(v['quota'] for v in GROUPS.values()),
        'actual_size': len(selected),
        'selection_principles': [
            'TBCL B1-B2 전체 목록 안에서만 뽑는다.',
            '실제 사용 빈도만으로 순위를 정하지 않고 초반 게임 재사용성과 의미 관계를 먼저 고려한다.',
            '구어 빈도를 서면 빈도보다 조금 더 반영한다.',
            '튜토리얼과 바로 연결되는 핵심 앵커는 빈도가 상대적으로 낮아도 보존한다.',
            '이 목록은 4,070개 전체 학습 풀을 대체하지 않는다. 초반 세계와 스테이지 설계를 위한 우선 학습 풀이다.',
        ],
        'group_counts': dict(counts),
        'items': selected,
        'missing_seed_words': dict(missing),
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    lines = [
        '# 튜토리얼 직후 핵심 어휘 풀 v0.1', '',
        f'- 목표 크기: **{payload["target_size"]}개**',
        f'- 실제 선발: **{payload["actual_size"]}개**',
        '- 기준: 게임 진행 적합성 + 의미 재사용성 + TBCL 구어/서면 빈도',
        '- 주의: 전체 B1-B2 4,070개 중 초반 설계 우선순위일 뿐, 최종 어휘 범위를 줄인 것이 아니다.', '',
        '## 왜 이렇게 뽑는가', '',
        '단순 빈도순으로 뽑으면 접속어·기능어처럼 자주 쓰이지만 초반 전술 스테이지의 세계와 행동을 만들기 어려운 단어가 상위를 차지한다. 반대로 기믹에 좋은 단어만 고르면 실제 생활에서 자주 쓰는 핵심 추상어가 빠진다.', '',
        '그래서 먼저 초반 게임에서 반복 가능한 의미군을 정하고, 그 후보 안에서 TBCL의 구어·서면 빈도를 이용해 우선순위를 조정했다. 튜토리얼과 직접 이어지는 일부 단어는 앵커로 고정했다.', '',
        '## 그룹별 목록', ''
    ]
    for group in GROUPS:
        lines.append(f'### {group} ({counts[group]}개)')
        lines.append('')
        group_items = [x for x in selected if x['core_group'] == group]
        for x in group_items:
            anchor = ' ★' if x['required_anchor'] else ''
            freq = f"서면 {x['written_freq_per_million']:g} / 구어 {x['spoken_freq_per_million']:g}"
            lines.append(f"- **{x['display_word']}** {x['zhuyin']} · {x['cefr']} · {freq}{anchor}")
        lines.append('')

    lines += [
        '## 사용 원칙', '',
        '1. ★는 튜토리얼과의 연결 또는 초반 시스템 설계를 위해 우선 보존한 앵커다.',
        '2. 한 마을이 이 목록의 한 그룹을 그대로 독점하지 않는다. 같은 단어를 여러 맥락에서 재사용할 수 있다.',
        '3. 첫 월드에서는 이 160개를 한꺼번에 가르치지 않는다. 3~4개 지역에 20~40개씩 겹쳐 배치하고, 일반 어휘 스테이지가 사이를 메운다.',
        '4. 플레이 로그가 쌓이면 실제 정답률·재확인 횟수·재등장 효과를 반영해 v0.2에서 교체한다.', '',
    ]
    if any(missing.values()):
        lines += ['## TBCL B1-B2 master에서 바로 일치하지 않은 후보', '', '이 항목들은 후보 설계어였지만 현재 master의 동일 표기와 직접 일치하지 않았다. 보조어인지, 다른 표기인지, 다른 급수인지 나중에 확인한다.', '']
        for group, words in missing.items():
            if words:
                lines.append(f"- {group}: {', '.join(words)}")

    OUT_MD.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('selected', len(selected))
    print('groups', dict(counts))
    print('missing', sum(len(v) for v in missing.values()))


if __name__ == '__main__':
    main()
