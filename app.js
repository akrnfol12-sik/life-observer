const storage = window.LifeObserverStorage?.adapter || {
  memory: {},
  getArray(key) {
    const value = this.memory[key];
    return Array.isArray(value) ? value : [];
  },
  getObject(key) {
    const value = this.memory[key];
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  },
  set(key, value) {
    this.memory[key] = value;
  }
};

const STORAGE_KEYS = window.LifeObserverStorage?.KEYS || {
  records: "lifeObserver.records",
  dailyReviews: "lifeObserver.dailyReviews",
  settings: "lifeObserver.settings",
  accounts: "lifeObserver.accounts",
  moneyRecords: "lifeObserver.moneyRecords",
  calendarMockEvents: "lifeObserver.calendar.mockEvents",
  integrationSettings: "lifeObserver.integrationSettings"
};

const CATEGORY_DEFS = {
  sns: { label: "SNS", group: "escape", kind: "duration", defaultValue: 15, contextTag: "逃避" },
  av: { label: "AV", group: "escape", kind: "duration", defaultValue: 15, contextTag: "逃避" },
  game: { label: "ゲーム", group: "escape", kind: "duration", defaultValue: 30, contextTag: "逃避" },
  youtube: { label: "YouTube / 動画", group: "escape", kind: "duration", defaultValue: 15, contextTag: "逃避" },
  webWandering: { label: "無意味な検索", group: "escape", kind: "duration", defaultValue: 15, contextTag: "逃避" },
  sleepEscape: { label: "寝逃げ", group: "escape", kind: "duration", defaultValue: 30, contextTag: "健康" },
  reading: { label: "読書", group: "build", kind: "duration", defaultValue: 15, contextTag: "読書" },
  study: { label: "資格勉強", group: "build", kind: "duration", defaultValue: 15, contextTag: "勉強" },
  testStudy: { label: "テスト勉強", group: "build", kind: "duration", defaultValue: 15, contextTag: "大学" },
  universityTask: { label: "大学課題", group: "build", kind: "duration", defaultValue: 15, contextTag: "大学" },
  festival: { label: "学祭", group: "build", kind: "duration", defaultValue: 15, contextTag: "学祭" },
  internship: { label: "インターン", group: "build", kind: "duration", defaultValue: 15, contextTag: "インターン" },
  jobHunt: { label: "就活", group: "build", kind: "duration", defaultValue: 15, contextTag: "就活" },
  exercise: { label: "運動 / 散歩", group: "build", kind: "duration", defaultValue: 15, contextTag: "健康" },
  expense: { label: "支出", group: "money", kind: "money", defaultValue: 500, moneyType: "expense", contextTag: "お金" },
  incomeRecord: { label: "収入", group: "money", kind: "money", defaultValue: 1000, moneyType: "income", contextTag: "お金" },
  transferRecord: { label: "振替", group: "money", kind: "money", defaultValue: 1000, moneyType: "transfer", contextTag: "お金" },
  creditExpense: { label: "クレカ利用", group: "money", kind: "money", defaultValue: 1000, moneyType: "creditExpense", contextTag: "お金" },
  creditPayment: { label: "クレカ返済", group: "money", kind: "money", defaultValue: 1000, moneyType: "creditPayment", contextTag: "お金" },
  shinoAnxiety: { label: "詩乃不安", group: "mind", kind: "state", defaultValue: 0, contextTag: "詩乃" },
  badHealth: { label: "体調悪い", group: "health", kind: "state", defaultValue: 0, contextTag: "健康" },
  fatigue: { label: "疲労", group: "health", kind: "state", defaultValue: 0, contextTag: "健康" },
  anxiety: { label: "不安", group: "mind", kind: "state", defaultValue: 0, contextTag: "健康" },
  sleepiness: { label: "眠気", group: "health", kind: "state", defaultValue: 0, contextTag: "健康" },
  selfDisgust: { label: "自己嫌悪", group: "mind", kind: "state", defaultValue: 0, contextTag: "健康" },
  recovery: { label: "回復", group: "mind", kind: "state", defaultValue: 0, contextTag: "健康" }
};

const CATEGORY_SECTIONS = [
  {
    title: "逃避を観測",
    note: "責めずに見る",
    keys: ["sns", "av", "game", "youtube", "webWandering", "sleepEscape"]
  },
  {
    title: "積み上げを記録",
    note: "できた分だけ積む",
    keys: ["reading", "study", "testStudy", "universityTask", "festival", "internship", "jobHunt", "exercise"]
  },
  {
    title: "お金を記録",
    note: "お金の動きを見える化",
    keys: ["expense", "incomeRecord", "transferRecord", "creditExpense", "creditPayment"]
  },
  {
    title: "メンタル・体調",
    note: "反応と状態を観測",
    keys: ["shinoAnxiety", "badHealth", "fatigue", "anxiety", "sleepiness", "selfDisgust", "recovery"]
  }
];

const CHIPS = {
  duration: [5, 15, 30, 60, 90],
  money: [300, 500, 1000, 3000, 5000],
  reason: {
    escape: ["疲れ", "不安", "暇", "先延ばし", "寝る前", "習慣"],
    build: ["予定通り", "少しだけ", "代替行動", "朝", "移動中", "回復"],
    money: ["食費", "交通", "必要", "衝動買い", "固定費", "交際"],
    mind: ["詩乃不安", "睡眠不足", "対人", "仕事", "孤独", "波"],
    health: ["体調悪い", "睡眠不足", "頭痛", "疲労", "腹痛", "休息"]
  },
  moods: ["安定", "不安", "疲れ", "落ち込み", "少し回復"],
  reviewMind: ["安定", "不安", "低調", "回復", "体調悪い"],
  causes: ["疲れ", "不安", "暇", "先延ばし", "寝る前", "孤独", "刺激不足"],
  wins: ["記録した", "読めた", "勉強した", "支出を見た", "休めた", "やめられた"],
  fixes: ["寝る前スマホを置く", "最初に本を開く", "ゲーム前にタイマー", "支出を見てから買う", "体調優先"],
  moneyTypes: ["支出", "収入", "振替", "クレカ利用", "クレカ返済"],
  meanings: ["必要", "投資", "交際", "逃避", "衝動買い", "固定費", "その他"],
  futureValues: ["未来の自分を強くした", "今を保つために必要", "逃避だったが観測できた", "微妙"]
};

const MONEY_TYPE_MAP = {
  支出: "expense",
  収入: "income",
  振替: "transfer",
  クレカ利用: "creditExpense",
  クレカ返済: "creditPayment"
};

const MONEY_TYPE_LABELS = {
  expense: "支出",
  income: "収入",
  transfer: "振替",
  creditExpense: "クレカ利用",
  creditPayment: "クレカ返済"
};

const ACCOUNT_TYPE_LABELS = {
  cash: "現金",
  bank: "銀行",
  emoney: "電子マネー",
  credit: "クレカ",
  other: "その他"
};

let records = loadArray(STORAGE_KEYS.records);
let dailyReviews = loadObject(STORAGE_KEYS.dailyReviews);
let settings = loadSettings();
let accounts = loadArray(STORAGE_KEYS.accounts);
let moneyRecords = loadArray(STORAGE_KEYS.moneyRecords);
const calendarProvider = window.LifeObserverCalendar?.getProvider();
let calendarEvents = [];
let calendarStatus = "loading";
let calendarError = "";
let calendarUpdatedAt = "";
let selectedCategory = "sns";
let selectedReason = "疲れ";
let selectedMood = "安定";
let selectedQuickMeaning = "必要";
let selectedQuickFuture = "今を保つために必要";
let selectedMoneyType = "expense";
let selectedMoneyMeaning = "必要";
let selectedMoneyFuture = "今を保つために必要";
let editingRecordId = "";
let reviewState = {
  mentalState: "安定",
  escapeCauses: [],
  wins: [],
  tomorrowFix: "寝る前スマホを置く"
};

const els = {};
