from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

MASTER = Path("data/word-game/tbcl-b1-b2-master.json")
OUT = Path("data/word-game/word-game-classification-candidates.json")
REPORT = Path("data/word-game/CLASSIFICATION-REPORT.md")

RULE_VERSION = "2026-09-v0.1"


def rx(*patterns: str):
    return [re.compile(p) for p in patterns]


# TBCL 情境 안에서 비교적 높은 확률로 좁힐 수 있는 세부 주제 후보.
# 이 값들은 '공식 단어별 세부 분류'가 아니라 프로젝트의 assisted 후보 태그다.
TOPIC_RULES = {
    "個人資料": {
        "친족·가족": rx(r"父|母|爸|媽|祖|阿公|阿嬤|兄|弟|姊|姐|妹|夫妻|配偶|親戚|家人|家庭|婚|嫁|娶|兒女|子女|離婚|單身"),
        "언어·언어배경": rx(r"語言|母語|外語|中文|華語|方言|口音|腔|翻譯|發音"),
        "학력·직업정보": rx(r"學歷|畢業|職業|工作|就業|失業|職稱"),
        "연락·신원정보": rx(r"姓名|名字|地址|電話|手機|聯絡|號碼|身分|證件|國籍"),
        "습관·개인특성": rx(r"習慣|嗜好|興趣|個性|性格"),
        "종교·신앙": rx(r"宗教|信仰|佛|神|教會|寺|廟"),
    },
    "日常、起居": {
        "주거환경": rx(r"房|屋|公寓|住宅|宿舍|房間|家具|客廳|廚房|陽台"),
        "이사·임대": rx(r"搬家|搬遷|房東|房客|租|押金|合約"),
        "일상생활": rx(r"起床|睡|洗澡|刷牙|打掃|清潔|家事|作息|日常"),
    },
    "職業": {
        "구직·채용": rx(r"求職|應徵|面試|履歷|錄取|聘|招聘|失業|就業"),
        "급여·대우": rx(r"薪|工資|待遇|獎金|加薪|收入|津貼"),
        "업무·직장": rx(r"上班|下班|加班|同事|主管|老闆|員工|職員|業務|工作|職場"),
    },
    "休閒、娛樂": {
        "스포츠": rx(r"球|比賽|運動|游泳|跑步|健身|球員|球隊|冠軍"),
        "공연·관람": rx(r"演出|表演|演唱會|音樂會|戲劇|電影|觀眾|舞台"),
        "디지털오락": rx(r"遊戲|電玩|網路|影片|直播|社群|節目"),
        "문화관람": rx(r"展覽|博物館|美術館|展出|參觀"),
    },
    "交通、旅遊": {
        "대중교통": rx(r"公車|捷運|火車|高鐵|車站|月台|班次|車票|船|飛機|機場|航班"),
        "개인교통": rx(r"汽車|機車|自行車|駕駛|開車|停車|車道|駕照"),
        "여행·숙박": rx(r"旅行|旅遊|旅館|飯店|住宿|行李|訂房|民宿|旅客"),
        "관광정보": rx(r"觀光|景點|導遊|地圖|路線|風景|行程|旅遊資訊"),
    },
    "社交、人際": {
        "사교·관계": rx(r"朋友|友誼|人際|交往|約會|聚會|邀請|拜訪|認識|相處"),
        "통신·연락": rx(r"聯絡|電話|簡訊|訊息|郵件|通話|回覆|通知"),
        "식사예절": rx(r"請客|招待|敬酒|餐桌|禮貌|禮儀|客氣"),
    },
    "身體、醫療": {
        "신체": rx(r"頭|臉|眼|耳|鼻|口|嘴|牙|手|腳|腿|身體|皮膚|血|骨|肌肉"),
        "증상·질병": rx(r"病|痛|發燒|咳|感冒|受傷|症狀|過敏|感染|不舒服"),
        "의료·치료": rx(r"醫|醫院|診所|看病|治療|手術|藥|檢查|急診|護士|復健"),
    },
    "教育、學習": {
        "학교생활": rx(r"學生|老師|同學|上課|下課|考試|成績|作業|畢業|學期|請假"),
        "학교환경": rx(r"學校|教室|校園|圖書館|辦公室|宿舍|系|科|大學|中學"),
        "학습·학습도구": rx(r"學習|讀書|念書|課本|教材|筆記|練習|複習|研究|資料"),
    },
    "購物、商店": {
        "상품·구매": rx(r"商品|產品|買|購買|退貨|換貨|尺寸|品質|品牌|包裝"),
        "가격·결제": rx(r"價格|價錢|便宜|貴|折扣|付款|刷卡|現金|發票|收據"),
        "상점·서비스": rx(r"商店|百貨|超市|市場|店員|顧客|服務|櫃台"),
    },
    "餐飲、烹飪": {
        "식재료·음식": rx(r"菜|肉|魚|飯|麵|湯|水果|蔬菜|食物|材料|調味|飲料"),
        "조리": rx(r"煮|炒|煎|炸|烤|蒸|切|烹飪|料理|食譜|火候"),
        "식당·식사": rx(r"餐廳|飯店|菜單|點菜|結帳|用餐|吃飯|外帶|訂位|服務生"),
    },
    "公共服務": {
        "은행·금융서비스": rx(r"銀行|存款|提款|匯款|帳戶|利息|貸款|金融"),
        "우편·배송": rx(r"郵局|郵件|包裹|寄|郵票|快遞|配送"),
        "차량정비·주유": rx(r"加油|汽油|修車|維修|保養|輪胎"),
        "행정·증명": rx(r"辦理|申請|證明|文件|護照|簽證|戶籍|機關"),
    },
    "安全": {
        "경찰·소방": rx(r"警察|警方|消防|救護|報警|火警|滅火|救援"),
        "범죄": rx(r"犯罪|犯人|小偷|搶|偷|騙|詐騙|毒品|逮捕|監獄"),
        "사고·재난": rx(r"事故|意外|災|地震|颱風|火災|爆炸|受傷|死亡"),
        "충돌·위험": rx(r"危險|威脅|攻擊|衝突|打架|暴力|防止|保護|避難"),
    },
    "自然環境": {
        "동물": rx(r"動物|鳥|魚|狗|貓|蟲|昆蟲|野生|生物"),
        "식물": rx(r"植物|花|樹|草|森林|葉|種子|農作物"),
        "날씨·기후": rx(r"天氣|氣候|溫度|下雨|雨|風|颱風|乾旱|潮濕|寒冷|炎熱"),
        "환경보호": rx(r"環境|污染|垃圾|回收|節能|保育|生態|環保"),
        "지리·지형": rx(r"山|河|海|島|地理|地區|地形|土地|平原|海岸"),
    },
    "社會": {
        "정치": rx(r"政府|政治|總統|選舉|投票|政黨|民主|政策|官員|立法"),
        "경제": rx(r"經濟|市場|企業|公司|產業|投資|消費|生產|收入|物價|金融"),
        "법률": rx(r"法律|法院|法官|律師|違法|合法|規定|權利|義務|案件"),
        "국제": rx(r"國際|外交|外國|國家|全球|世界|移民|邊境|戰爭"),
        "성별·사회정체성": rx(r"性別|女性|男性|男女|性別平等|身分|族群"),
    },
    "文化": {
        "민속·전통": rx(r"傳統|習俗|民俗|節慶|節日|祭|婚禮|文化"),
        "종교": rx(r"宗教|佛|神|教會|寺|廟|信仰|祈禱"),
        "역사": rx(r"歷史|古代|年代|朝代|古蹟|遺跡|人物"),
        "예술": rx(r"藝術|美術|音樂|舞蹈|畫|攝影|作品|設計|雕刻"),
        "문학·출판": rx(r"文學|小說|詩|作者|作家|文章|出版|讀者|書"),
    },
    "情緒、態度": {
        "감정": rx(r"高興|開心|快樂|難過|悲傷|生氣|憤怒|害怕|恐怖|緊張|焦慮|擔心|失望|滿意|感動|興奮|孤單|寂寞"),
        "태도": rx(r"態度|積極|消極|客觀|主觀|認真|隨便|耐心|尊重|誠實|勇敢|自信"),
        "반응": rx(r"反應|接受|拒絕|同意|反對|抱怨|感謝|道歉|原諒|支持"),
    },
    "科技": {
        "과학·연구": rx(r"科學|研究|實驗|理論|技術|發明|發現|數據|分析"),
        "디지털·인터넷": rx(r"網路|網站|社群|線上|下載|上傳|帳號|密碼|電子|數位|程式"),
        "기기·장치": rx(r"電腦|手機|機器|設備|螢幕|鍵盤|系統|裝置|軟體|硬體"),
    },
}


# 의미 기능은 전술/학습 재사용을 위한 프로젝트 태그다.
SEMANTIC_RULES = {
    "공간": rx(r"位置|地方|附近|周圍|中央|中間|之間|內部|外部|範圍|距離"),
    "이동": rx(r"到達|進入|退出|返回|經過|通過|趕上|前往|移動|離開|逃離|搬運|運送|轉移|出發"),
    "거리": rx(r"接近|靠近|遠離|距離|遠近"),
    "방향": rx(r"方向|朝向|轉向|向前|向後|往返|前進|後退|左|右"),
    "변화": rx(r"改變|變化|轉變|改進|改善|調整|轉換|發展|成為|恢復|惡化"),
    "증가·감소": rx(r"增加|減少|提高|降低|上升|下降|擴大|縮小|加強|減弱|增長|下降"),
    "유지": rx(r"保持|維持|保留|繼續|持續|保存|穩定"),
    "분배·집합": rx(r"分配|分散|集中|平均|分組|分開|集合|聚集|分享"),
    "비교": rx(r"比較|相比|相同|不同|差別|區別|類似|相似|超過|不如|優於|勝過"),
    "선택·결정": rx(r"選擇|決定|挑選|取捨|優先|決策|方案|選項"),
    "원인·결과": rx(r"原因|因素|結果|造成|導致|影響|因此|由於|後果"),
    "판단·평가": rx(r"判斷|確定|確認|評估|評價|標準|正確|錯誤|合理|適合|值得"),
    "인지·사고": rx(r"思考|了解|理解|發現|注意|記得|忘記|認識|想像|研究|分析|觀察|考慮|意識"),
    "정보": rx(r"資料|資訊|消息|報告|說明|證明|統計|數據|紀錄|通知"),
    "감정": rx(r"高興|開心|快樂|難過|悲傷|生氣|憤怒|害怕|緊張|焦慮|擔心|失望|滿意|感動|興奮|孤單|寂寞|情緒|感覺"),
    "관계": rx(r"關係|朋友|友誼|信任|懷疑|誤會|原諒|尊重|欺騙|接受|拒絕|相處|人際"),
    "협력": rx(r"合作|配合|幫助|協助|支持|團結|分享|共同|聯合"),
    "갈등": rx(r"反對|爭論|爭議|衝突|對抗|競爭|攻擊|批評|抗議|打架"),
    "설득·협상": rx(r"說服|建議|勸|解釋|表達|強調|討論|協商|妥協|談判|溝通"),
    "규칙·의무": rx(r"規定|規則|法律|制定|違反|遵守|允許|禁止|要求|義務|權利|限制"),
    "위험·보호": rx(r"危險|風險|威脅|避免|避開|防止|保護|保衛|傷害|破壞|救援|安全|意外|防守"),
    "자원·거래": rx(r"資源|費用|成本|預算|投入|供應|需求|交換|交易|消費|購買|生產|收入"),
    "수량·측정": rx(r"數量|比例|百分比|多數|少數|程度|範圍|平均|統計|測量"),
    "순서·과정": rx(r"順序|步驟|階段|過程|接著|然後|最後|首先|同時|先後"),
    "조건·제약": rx(r"條件|限制|前提|除非|只要|如果|否則|資格|必須|必要"),
    "소통": rx(r"說明|解釋|表達|強調|溝通|聯絡|通知|回答|回覆|詢問|討論|發表"),
}


MECHANIC_BY_SEMANTIC = {
    "공간": ["position"],
    "이동": ["move"],
    "거리": ["distance"],
    "방향": ["move"],
    "변화": ["state_change"],
    "증가·감소": ["state_change"],
    "유지": ["state_change"],
    "분배·집합": ["resource_allocation"],
    "비교": ["compare"],
    "선택·결정": ["choose"],
    "판단·평가": ["choose"],
    "협력": ["cooperate"],
    "갈등": ["conflict"],
    "설득·협상": ["negotiate"],
    "규칙·의무": ["constraint"],
    "위험·보호": ["avoid", "protect"],
    "자원·거래": ["resource_allocation"],
    "순서·과정": ["sequence"],
    "조건·제약": ["constraint"],
}

# 첫 검토 때 특히 유용한 대표 대비쌍. 자동으로 무한 확장하지 않는다.
CONTRAST_PAIRS = [
    ("接近", "遠離"), ("進入", "退出"), ("增加", "減少"), ("提高", "降低"),
    ("上升", "下降"), ("擴大", "縮小"), ("集中", "分散"), ("改變", "保持"),
    ("支持", "反對"), ("同意", "拒絕"), ("信任", "懷疑"), ("合作", "競爭"),
    ("安全", "危險"), ("允許", "禁止"), ("正確", "錯誤"), ("相同", "不同"),
]
CONTRAST = defaultdict(list)
for a, b in CONTRAST_PAIRS:
    CONTRAST[a].append(b)
    CONTRAST[b].append(a)


def match_tags(word: str, rules: dict[str, list[re.Pattern]]) -> list[str]:
    return [tag for tag, pats in rules.items() if any(p.search(word) for p in pats)]


def generic_topic_tags(category: str) -> list[str]:
    if not category or category == "核心詞":
        return []
    return [x.strip() for x in re.split(r"[、,/]+", category) if x.strip()]


def classify_word(row: dict) -> dict:
    word = row["word"]
    category = row.get("category", "")

    specific_topics = match_tags(word, TOPIC_RULES.get(category, {}))
    topics = specific_topics or generic_topic_tags(category)
    topic_conf = "high" if specific_topics else ("low" if topics else "none")

    semantics = match_tags(word, SEMANTIC_RULES)
    semantic_conf = "high" if semantics else "none"

    mechanics = []
    for tag in semantics:
        mechanics.extend(MECHANIC_BY_SEMANTIC.get(tag, []))
    mechanics = list(dict.fromkeys(mechanics))

    # 전술 적합 여부는 의미 태그가 실제 행동/상태 기믹으로 연결된 경우에만 true.
    mechanic_eligible = bool(mechanics)

    stage_modes = ["meaning_choice", "context_choice", "zhuyin_link"]
    if word in CONTRAST:
        stage_modes.append("contrast")
    if mechanic_eligible:
        stage_modes.append("tactical")

    if specific_topics or semantics:
        status = "assisted"
    else:
        status = "unreviewed"

    confidence = "high" if semantic_conf == "high" and topic_conf == "high" else (
        "medium" if semantic_conf == "high" or topic_conf == "high" else "low"
    )

    return {
        "word": word,
        "tbcl_level": row.get("tbcl_level", ""),
        "cefr": row.get("cefr", ""),
        "source_category": category,
        "topic_tags": topics,
        "semantic_tags": semantics,
        "mechanic_eligible": mechanic_eligible,
        "mechanic_tags": mechanics,
        "stage_modes": stage_modes,
        "contrast_words": CONTRAST.get(word, []),
        "classification_status": status,
        "classification_method": f"rule:{RULE_VERSION}",
        "classification_confidence": confidence,
        "topic_confidence": topic_conf,
        "semantic_confidence": semantic_conf,
    }


def write_report(items: list[dict]) -> None:
    total = len(items)
    assisted = sum(x["classification_status"] == "assisted" for x in items)
    mechanic = sum(x["mechanic_eligible"] for x in items)
    specific_topic = sum(x["topic_confidence"] == "high" for x in items)
    semantic = sum(bool(x["semantic_tags"]) for x in items)

    by_category = Counter(x["source_category"] or "(없음)" for x in items)
    by_topic = Counter(t for x in items for t in x["topic_tags"])
    by_sem = Counter(t for x in items for t in x["semantic_tags"])
    by_mech = Counter(t for x in items for t in x["mechanic_tags"])

    lines = [
        "# 단어게임 1차 자동 분류 보고서",
        "",
        f"규칙 버전: `{RULE_VERSION}`",
        "",
        "이 보고서는 공식 TBCL 분류 결과가 아니라 **프로젝트용 assisted 후보 분류**의 품질과 범위를 확인하기 위한 것이다.",
        "TBCL `source_category`는 원자료에서 가져오며, `topic_tags`와 `semantic_tags`는 규칙 기반 후보이므로 사람이 검토하기 전에는 확정값으로 취급하지 않는다.",
        "",
        "## 전체 범위",
        "",
        f"- 전체 어휘: **{total:,}개**",
        f"- assisted 후보가 하나 이상 붙은 어휘: **{assisted:,}개 ({assisted/total:.1%})**",
        f"- 세부 주제 규칙이 직접 맞은 어휘: **{specific_topic:,}개 ({specific_topic/total:.1%})**",
        f"- 의미 태그가 붙은 어휘: **{semantic:,}개 ({semantic/total:.1%})**",
        f"- 전술 기믹 후보: **{mechanic:,}개 ({mechanic/total:.1%})**",
        "",
        "## TBCL 상황별 어휘 수",
        "",
    ]
    for k, v in by_category.most_common():
        lines.append(f"- {k}: {v:,}")

    lines += ["", "## 많이 붙은 세부 주제 태그", ""]
    for k, v in by_topic.most_common(30):
        lines.append(f"- {k}: {v:,}")

    lines += ["", "## 의미 태그 분포", ""]
    for k, v in by_sem.most_common():
        lines.append(f"- {k}: {v:,}")

    lines += ["", "## 전술 기믹 후보 분포", ""]
    for k, v in by_mech.most_common():
        lines.append(f"- `{k}`: {v:,}")

    unreviewed = [x for x in items if x["classification_status"] == "unreviewed"]
    lines += [
        "",
        "## 다음 검토 우선순위",
        "",
        f"현재 아무 프로젝트 태그도 붙지 않은 어휘는 **{len(unreviewed):,}개**다.",
        "이 단어들은 억지로 자동 태깅하지 않고, 이후 의미 자료나 사람 검토를 통해 분류한다.",
        "",
        "우선순위는 다음 순서가 좋다.",
        "",
        "1. `核心詞` 중 B1/B2 핵심 추상어",
        "2. 세부 주제는 잡혔지만 의미 태그가 없는 단어",
        "3. 의미 태그가 둘 이상 붙어 기믹 조합 후보가 된 단어",
        "4. 전술 기믹으로 쓰기 어렵지만 빈도가 높은 일반 학습 단어",
        "",
        "## 해석 주의",
        "",
        "- 규칙은 단어 표면형만 사용하므로 다의어·동형어를 완전히 처리하지 못한다.",
        "- `topic_tags`가 TBCL 공식 단어별 세부 분류라는 뜻은 아니다.",
        "- `mechanic_eligible=true`는 학습 중요도가 아니라 게임판에서 표현 가능성이 있다는 뜻이다.",
        "- 사람이 확인한 값은 추후 curated overlay에서 `reviewed`로 승격한다.",
        "",
    ]
    REPORT.write_text("\n".join(lines), encoding="utf-8")


def main():
    master = json.loads(MASTER.read_text(encoding="utf-8"))
    items = [classify_word(row) for row in master]

    payload = {
        "schema_version": 1,
        "rule_version": RULE_VERSION,
        "description": "TBCL B1–B2 전체 어휘에 대한 프로젝트용 1차 assisted 분류 후보. 공식 분류가 아니며 검토 전 확정값으로 사용하지 않는다.",
        "items": items,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_report(items)

    print(f"classified={len(items)}")
    print(f"assisted={sum(x['classification_status']=='assisted' for x in items)}")
    print(f"semantic_tagged={sum(bool(x['semantic_tags']) for x in items)}")
    print(f"mechanic_eligible={sum(x['mechanic_eligible'] for x in items)}")
    print(f"wrote={OUT} {REPORT}")


if __name__ == "__main__":
    main()
