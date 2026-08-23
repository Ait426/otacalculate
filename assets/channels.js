/* ══════════════════════════════════════════════════════════════
   채널 데이터 — 이 파일만 고치면 채널이 늘어난다.

   status
     "live"     계산까지 검증 완료. 계산기에서 선택 가능.
     "partial"  CMS 구조는 파악, 입금가 공식 미검증. 계산기에서 경고와 함께 선택 가능.
     "planned"  CMS 상품 매핑만 확인. 계산기 비활성.

   숫자는 전부 실측이다. 모르는 값은 null 로 두고 절대 추정치를 넣지 마라.
   조회일이 바뀌면 각 채널의 asOf 를 갱신할 것.
   ══════════════════════════════════════════════════════════════ */

const HOTEL = { name: "평택 스테이 호텔", floor: 40000 };

/* ★ CMS 요금세트 값 — 요금세트의 단일 소스다.
   스탠다드 Room Only 기준, 2026-08-24 WINGSCMS 요금표 화면 실측.
   요일이 아니라 날짜에 세트가 붙는다. 아래는 세트의 대표값일 뿐이다.

   계산기(index.html)의 요일별 표도 여기를 참조한다. 다른 파일에 CMS 숫자를
   다시 적지 마라 — 예전에 SUN이 여기 170,000 / 계산기 140,000으로 갈려서
   같은 요금세트를 한 화면은 '하한 미달', 다른 화면은 '여유'로 판정했다.
   화면에서 읽지 못한 세트는 null 로 둔다. 추정치 금지. */
const RATE_SET_VALUES = {
  WEEK: 160000, FRI: 190000, SAT: 220000, SUN: 140000,
  "1224": 430000, "1231": 430000,
  F1: 195000, F2: null,
  W1: 165000, W2: 170000, W3: 175000, W4: 180000,
  S1: 225000, S2: null,
};

/* 채널별 CMS — 스탠다드, 2026-08-23 조회 (10/26~11/09 구간에서 읽음).
   같은 객실을 채널마다 얼마에 보내고 있는지. 커미션·프로모션 구조가 달라서
   CMS가 다른 게 정상이지만, 차이가 이 정도로 벌어져 있다는 건 알고 있어야 한다. */
const CHANNEL_CMS = {
  domestic: { WEEK:  70000, FRI:  80000, SAT: 100000 },
  expedia:  { WEEK: 110000, FRI: 140000, SAT: 155000 },
  booking:  { WEEK: 121000, FRI: 132000, SAT: 140000 },
  trip:     { WEEK: 145000, FRI: 180000, SAT: 210000 },
  agoda:    { WEEK: 160000, FRI: 190000, SAT: 220000 },
};
/* 조식 그룹은 별도 상품그룹으로 붙는다 */
const BREAKFAST_CMS = {
  "아고 조식 1인":   { WEEK: 112000, FRI: 133000, SAT: 154000 },
  "아고 조식 2인":   { WEEK: 115200, FRI: 136800, SAT: 158400 },
  "트립 조식 2인":   { WEEK: 170000, FRI: 205000, SAT: null },
};

const CHANNELS = {

  /* ─────────────────────────────────────────── 아고다 */
  agoda: {
    key: "agoda", name: "아고다", en: "Agoda",
    status: "live", asOf: "2026-08-23",
    propertyId: "5834782",
    cmsGroups: ["아고다 (9642920501)", "아고 조식 1인", "아고 조식 2인"],

    tax: 1.1,
    taxNote: "할인은 세전 금액에 붙는다. 노출가 × 1.1 = 고객 결제. 메가세일 할인액이 (CMS÷1.1)×10%와 원 단위로 일치해 확정.",

    rateSets: ["WEEK","FRI","SAT","SUN","1224","1231","F1","F2","W1","W2","W3","W4","S1","S2"],
    rateSetNote: "test · A · 8wek 세트는 이 채널에 없다 (부킹·히카리, 익스 전용).",
    rateInputEditable: false,
    rateInputNote: "요금관리 그리드의 요금 입력칸은 disabled. 값은 요금세트가 정한다.",

    /* 요금제 — ratio 는 Room Only 대비 비율. 2026-08-23 ARI 실측, 7개 객실 예외 없음 */
    products: [
      { name: "Room Only (연박 가능)",      id: "10095865", ratio: 1.00 },
      { name: "Room Only (연박 불가)",      id: "21070762", ratio: 1.00 },
      { name: "BREAKFAST ( FOR 2 PERSON)",  id: "8193723",  ratio: 0.72 },
      { name: "BREAKFAST ( FOR 1 PERSON )", id: "2276544",  ratio: 0.70 },
    ],

    /* 객실 — 2026-10-28 ARI 실측 Room Only 기준요금(세금포함) */
    rooms: [
      { name: "스탠다드",         id: "64532268",   ro: 160000, bf1: 112000, bf2: 115200 },
      { name: "Premium",          id: "64532322",   ro: 170000, bf1: 119000, bf2: 122400 },
      { name: "디럭스 더블룸",     id: "1188254696", ro: 180000, bf1: null,   bf2: 129600 },
      { name: "패밀리 트윈",      id: "64532296",   ro: 210000, bf1: 147000, bf2: 151200 },
      { name: "로얄 스위트 더블", id: "64539398",   ro: 210000, bf1: null,   bf2: 151200 },
      { name: "패밀리 트리플",    id: "64537627",   ro: 250000, bf1: null,   bf2: 180000 },
      { name: "파티 스위트",      id: "64540015",   ro: 260000, bf1: null,   bf2: 187200 },
    ],

    commission: {
      total: 18,
      parts: [
        { name: "계약 수수료",       cur: 10, range: "고정" },
        { name: "AGP",               cur: 8,  range: "무료 체험 / 8 / 17 — 포털에 조작 수단 없음" },
        { name: "AGX 캠페인 #1455190", cur: 2, range: "1 ~ 40 (4%가 순위 1위 최소값, 그 위는 낭비)" },
        { name: "Sponsored Listing", cur: 0,  range: "미적용 · Top 3 = 10.3 / Top 15 = 7.2" },
      ],
      note: "8/28~9/1 투숙분은 38%일 수 있다 (구 AGX 20% 캠페인). 9월 정산서가 판정 시점.",
    },

    /* 중복 규칙 — 아고다 포털 원문 기준. 카테고리를 세지 개수를 세지 않는다. */
    dupRule: "시즌 최대 1개 · 타겟팅은 카테고리당 1개 · 알뜰은 개수 제한 없음 · Maximum Gain은 항상 얹힘",

    sigmaTheory: 65,
    sigmaMeasured: 54.37,
    measuredNote: "한국 IP 조회. International Rate 10%가 안 붙은 값이다.",

    /* ★ 실제 예약으로 확인 — 지역 타겟팅은 손님 국적에 따라 실제로 붙는다 */
    bookingEvidence: {
      id: "685235275",
      guestCountry: "미국",
      booked: "2026-08-02", stay: "2026-08-04", leadDays: 2,
      room: "스탠다드 - 주차불가", plan: "Room Only (연박 불가)",
      baseRate: 67500,
      promos: ["Maximum Gain", "US (IP only)", "Hot Deal - 27-Jul-2026"],
      note: "미국 거주 손님에게 US (IP only)가 실제로 붙었다. 한국 IP 조회에서 지역 프로모션이 " +
            "빠져 보였던 이유가 이것으로 설명된다. 얼리버드는 리드타임 2일이라 미적용(6일 조건과 일치), " +
            "메가세일은 8/2 예약이라 미적용(판매기간 8/22~와 일치) — 두 규칙 모두 실제 예약에서 재확인됐다.",
    },

    extraDeduction: {
      name: "쿠폰(AGODA_SPONSORED)",
      range: "노출가의 14 ~ 16%",
      bearer: null,
      note: "이름상 아고다 부담이나 정산서 미확인. 우리 부담이면 입금가가 그만큼 더 빠진다.",
    },
  },

  /* ─────────────────────────────────────────── 부킹닷컴 */
  booking: {
    key: "booking", name: "부킹닷컴", en: "Booking.com",
    status: "planned", asOf: "2026-08-23",
    propertyId: "4776615",
    cmsGroups: ["부킹,히카리 (163793613101)"],
    tax: null, taxNote: null,
    rateSets: ["WEEK","FRI","SAT","SUN","1224","1231","8wek","F2","A","test"],
    rateSetNote: "★ test 세트가 여기 있다. 임시 요금 실험을 하려면 이 채널이 편하다.",
    rateInputEditable: null, rateInputNote: null,
    products: [
      { name: "ROOM ONLY - Standard", id: null, ratio: null },
      { name: "Hikari global - Standard", id: null, ratio: null },
    ],
    rooms: [], commission: null, dupRule: null,
    sigmaTheory: null, sigmaMeasured: null, extraDeduction: null,
    todo: [
      "커미션 구조 (기본 15%? Preferred/Genius 가산 여부)",
      "Genius · Mobile rate · Country rate 가 Σ처럼 더해지는지 곱해지는지",
      "부가세·봉사료 처리 — 아고다처럼 세전에 할인이 붙는지",
      "익스트라넷 캘린더에서 CMS 값이 그대로 보이는지",
    ],
  },

  /* ─────────────────────────────────────────── 익스피디아 */
  expedia: {
    key: "expedia", name: "익스피디아", en: "Expedia",
    status: "planned", asOf: "2026-08-23",
    propertyId: "30531203",
    cmsGroups: ["익스 (161898078101)"],
    tax: null, taxNote: null,
    rateSets: ["WEEK","FRI","SAT","SUN","1224","1231","8wek","F2","A","test"],
    rateSetNote: "부킹과 같은 세트 묶음을 쓴다. test 세트 있음.",
    rateInputEditable: null, rateInputNote: null,
    products: [ { name: "Room Only - Standard", id: null, ratio: null } ],
    rooms: [], commission: null, dupRule: null,
    sigmaTheory: null, sigmaMeasured: null, extraDeduction: null,
    todo: [
      "커미션 — Expedia Collect vs Hotel Collect 구분",
      "Member Only Deal · Package rate 의 할인 누적 방식",
      "Accelerator(입찰) 가 보수에 얹히는 구조인지",
      "Partner Central 의 '순 요금' 표기가 CMS 값과 같은지",
    ],
  },

  /* ─────────────────────────────────────────── 트립닷컴 */
  trip: {
    key: "trip", name: "트립닷컴", en: "Trip.com",
    status: "planned", asOf: "2026-08-23",
    propertyId: null,
    cmsGroups: ["트립 (162610309001)", "트립 조식 2인 (163971817701)"],
    tax: null, taxNote: null,
    rateSets: ["WEEK","FRI","SAT","SUN","1224","1231","F2","W1","W2","W3","W4","W5","W6","F1","S1","S2"],
    rateSetNote: "아고다와 비슷한 세트 묶음. W5·W6가 더 있고 test·A·8wek는 없다.",
    rateInputEditable: null, rateInputNote: null,
    products: [
      { name: "환불불가 - Standard", id: null, ratio: null },
      { name: "Room Only - Standard", id: null, ratio: null },
      { name: "Room Only - Room", id: null, ratio: null },
      { name: "2인 조식 - Standard", id: null, ratio: null },
    ],
    rooms: [], commission: null, dupRule: null,
    sigmaTheory: null, sigmaMeasured: null, extraDeduction: null,
    todo: [
      "커미션 구조",
      "Trip.com 은 환불불가 상품이 따로 있다 — 요금 차이가 CMS에서 오는지 채널에서 오는지",
      "조식 2인 상품이 별도 그룹이다. 아고다처럼 고정 비율인지 확인",
      "eBooking 캘린더에서 CMS 값 대조",
    ],
  },

  /* ─────────────────────────────────────────── 국내 OTA */
  domestic: {
    key: "domestic", name: "국내 OTA", en: "야놀자 · 여기어때",
    status: "planned", asOf: "2026-08-23",
    propertyId: null,
    cmsGroups: ["국내 OTA (160259612101)"],
    tax: null, taxNote: null,
    rateSets: ["WEEK","FRI","SAT","8wek","FRI30","SAT30","1224","1231","SUN","W1","W2","S1","F1","S2","W3"],
    rateSetNote: "FRI30 · SAT30 은 이 채널에만 있다.",
    rateInputEditable: null, rateInputNote: null,
    products: [
      { name: "야놀자(모텔) - 스탠다드", id: null, ratio: null },
      { name: "야놀자(모텔) - 스탠다드 + 조식 1인", id: null, ratio: null },
      { name: "야놀자(모텔) - 도보특가 + 조식 1인", id: null, ratio: null },
      { name: "야놀자(모텔) - 도보특가", id: null, ratio: null },
      { name: "여기어때 - Standard", id: null, ratio: null },
      { name: "야놀자 - 룸랜덤 배정(선착순 당일 특가)", id: null, ratio: null },
      { name: "야놀자 - Standard(룸온리, 런더리, 휘트니스)", id: null, ratio: null },
    ],
    rooms: [], commission: null, dupRule: null,
    sigmaTheory: null, sigmaMeasured: null, extraDeduction: null,
    todo: ["커미션 구조", "쿠폰·포인트 부담 주체", "도보특가 상품의 요금 결정 방식"],
  },
};

const CHANNEL_ORDER = ["agoda", "booking", "expedia", "trip", "domestic"];
