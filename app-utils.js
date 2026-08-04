function getTodaySummary(date = todayKey()) {
  const dayRecords = records.filter((record) => record.date === date);
  const independentMoneyRecords = moneyRecords.filter((record) => record.date === date && !record.linkedRecordId);
  return {
    records: dayRecords,
    count: dayRecords.length,
    observationCount: dayRecords.length + independentMoneyRecords.length,
    escapeMinutes: sumBy(dayRecords, (record) => record.type === "escape" ? record.amountMinutes : 0),
    buildMinutes: sumBy(dayRecords, (record) => record.type === "build" ? record.amountMinutes : 0),
    mindRecords: dayRecords.filter((record) => record.type === "mind" || record.type === "health")
  };
}

function getMoneySummary() {
  const today = todayKey();
  const month = monthKey();
  const todayExpense = sumBy(moneyRecords, (record) => record.date === today && isSpendingType(record.type) ? record.amount : 0);
  const monthExpense = sumBy(moneyRecords, (record) => record.date.startsWith(month) && isSpendingType(record.type) ? record.amount : 0);
  const netWorth = sumBy(accounts, (account) => account.isDebt ? -Number(account.balance || 0) : Number(account.balance || 0));
  const latest = accounts
    .map((account) => account.updatedAt)
    .filter(Boolean)
    .sort()
    .pop();
  return {
    todayExpense,
    monthExpense,
    netWorth,
    budgetLeft: Number(settings.monthlyBudget || 0) - monthExpense,
    lastBalanceDate: latest ? formatDateShort(latest) : "未設定"
  };
}

function getExpenseForDate(date) {
  return sumBy(moneyRecords, (record) => record.date === date && isSpendingType(record.type) ? record.amount : 0);
}

function getMindLabel(summary, review) {
  if (review && review.mentalState) return review.mentalState;
  if (summary.mindRecords.length === 0) return "未観測";
  return summary.mindRecords[summary.mindRecords.length - 1].categoryLabel;
}

function getPlusMessage(summary, observed) {
  if (!observed) return "未記録は失敗ではなく未観測です。1件だけでも見えれば前進です。";
  if (summary.escapeMinutes > 0) return "逃避も観測済みです。責める材料ではなく、次の選択を軽くする材料です。";
  return "今日を観測できています。記録したこと自体がプラスです。";
}

function recordAmountText(record) {
  if (record.amountMinutes) return `${record.amountMinutes}分`;
  if (record.amountYen) return formatYen(record.amountYen);
  return "状態";
}

function exportJson() {
  const payload = {
    app: "lifeObserver",
    version: 2,
    exportedAt: new Date().toISOString(),
    records,
    dailyReviews,
    settings,
    accounts,
    moneyRecords,
    calendarMockEvents: loadArray(STORAGE_KEYS.calendarMockEvents),
    integrationSettings: loadObject(STORAGE_KEYS.integrationSettings)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `life-observer-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("JSONを書き出しました");
}

function importJson() {
  const file = els.importJsonFile.files[0];
  if (!file) {
    showToast("JSONファイルを選んでください");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const ok = payload && Array.isArray(payload.records) && payload.dailyReviews && payload.settings;
      if (!ok) {
        showToast("バックアップ形式を確認してください");
        return;
      }
      if (!window.confirm("現在のデータをバックアップJSONで置き換えます。続けますか？")) return;
      records = Array.isArray(payload.records) ? payload.records : [];
      dailyReviews = payload.dailyReviews && typeof payload.dailyReviews === "object" ? payload.dailyReviews : {};
      settings = normalizeSettings(payload.settings || {});
      accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
      moneyRecords = Array.isArray(payload.moneyRecords) ? payload.moneyRecords : [];
      saveArray(STORAGE_KEYS.calendarMockEvents, Array.isArray(payload.calendarMockEvents) ? payload.calendarMockEvents : []);
      saveObject(STORAGE_KEYS.integrationSettings, payload.integrationSettings || {});
      ensureDefaultAccount();
      saveArray(STORAGE_KEYS.records, records);
      saveObject(STORAGE_KEYS.dailyReviews, dailyReviews);
      saveObject(STORAGE_KEYS.settings, settings);
      saveArray(STORAGE_KEYS.accounts, accounts);
      saveArray(STORAGE_KEYS.moneyRecords, moneyRecords);
      renderAll();
      loadCalendarAgenda();
      showToast("JSONを読み込みました");
    } catch {
      showToast("JSONを読み込めませんでした");
    }
  };
  reader.readAsText(file);
}

function loadArray(key) {
  return storage.getArray(key);
}

function loadObject(key) {
  return storage.getObject(key);
}

function loadSettings() {
  return normalizeSettings(loadObject(STORAGE_KEYS.settings));
}

function normalizeSettings(stored) {
  return {
    version: 2,
    createdAt: stored.createdAt || new Date().toISOString(),
    monthlyBudget: Number(stored.monthlyBudget || 0),
    quickDefaults: {
      sns: 15,
      av: 15,
      game: 30,
      youtube: 15,
      webWandering: 15,
      sleepEscape: 30,
      reading: 15,
      study: 15,
      testStudy: 15,
      universityTask: 15,
      festival: 15,
      internship: 15,
      jobHunt: 15,
      exercise: 15,
      expense: 500,
      incomeRecord: 1000,
      transferRecord: 1000,
      creditExpense: 1000,
      creditPayment: 1000,
      shinoAnxiety: 0,
      badHealth: 0,
      fatigue: 0,
      anxiety: 0,
      sleepiness: 0,
      selfDisgust: 0,
      recovery: 0,
      ...(stored.quickDefaults || {})
    },
    moneyTemplates: Array.isArray(stored.moneyTemplates) && stored.moneyTemplates.length
      ? stored.moneyTemplates
      : [
          { name: "昼食", amount: 700, category: "食費", meaning: "必要", futureValue: "今を保つために必要" },
          { name: "交通費", amount: 300, category: "交通", meaning: "必要", futureValue: "今を保つために必要" },
          { name: "コンビニ", amount: 500, category: "食費", meaning: "逃避", futureValue: "逃避だったが観測できた" },
          { name: "デート", amount: 2000, category: "交際", meaning: "交際", futureValue: "今を保つために必要" },
          { name: "書籍", amount: 1000, category: "書籍", meaning: "投資", futureValue: "未来の自分を強くした" }
        ]
  };
}

function ensureSettings() {
  saveObject(STORAGE_KEYS.settings, settings);
}

function ensureDefaultAccount() {
  if (accounts.length > 0) return;
  const now = new Date().toISOString();
  accounts.push({
    id: makeId(),
    name: "現金",
    type: "cash",
    balance: 0,
    isDebt: false,
    updatedAt: now,
    createdAt: now
  });
  saveArray(STORAGE_KEYS.accounts, accounts);
}

function ensureDefaultCreditAccount() {
  if (accounts.some((account) => account.type === "credit" && account.isDebt)) return;
  const now = new Date().toISOString();
  accounts.push({
    id: makeId(),
    name: "クレカ利用額",
    type: "credit",
    balance: 0,
    isDebt: true,
    updatedAt: now,
    createdAt: now
  });
  saveArray(STORAGE_KEYS.accounts, accounts);
}

function getDefaultAccountId() {
  ensureDefaultAccount();
  const asset = accounts.find((account) => !account.isDebt);
  return (asset || accounts[0]).id;
}

function getDefaultCreditAccountId() {
  ensureDefaultCreditAccount();
  const credit = accounts.find((account) => account.type === "credit" && account.isDebt);
  return credit ? credit.id : "";
}

function getDefaultMoneyAccountId(type) {
  if (type === "creditExpense") return getDefaultCreditAccountId();
  return getDefaultAccountId();
}

function getDefaultMoneyToAccountId(type, fromId) {
  if (type === "creditPayment") return getDefaultCreditAccountId();
  if (type === "transfer") {
    const target = accounts.find((account) => account.id !== fromId);
    return target ? target.id : fromId || getDefaultAccountId();
  }
  return "";
}

function getAccountName(id) {
  const account = accounts.find((item) => item.id === id);
  return account ? account.name : "口座未設定";
}

function saveArray(key, value) {
  storage.set(key, value);
}

function saveObject(key, value) {
  storage.set(key, value);
}

function sumBy(items, fn) {
  return items.reduce((total, item) => total + fn(item), 0);
}

function formatToday() {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
}

function todayKey() {
  return dateKey(new Date());
}

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function dateKeyFromOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return dateKey(date);
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeKey() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatClock(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDurationBetween(from, to) {
  const minutes = Math.max(0, Math.ceil((to - from) / 60000));
  return formatMinutes(minutes);
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}分`;
  if (rest === 0) return `${hours}時間`;
  return `${hours}時間${rest}分`;
}

function formatTimeRange(event) {
  return `${formatClock(event.startDate)}-${formatClock(event.endDate)}`;
}

function formatYen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}

function formatDateShort(value) {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

let toastTimer = 0;
function showToast(message, actionLabel = "", action = null) {
  window.clearTimeout(toastTimer);
  els.toastText.textContent = message;
  els.toastAction.textContent = actionLabel;
  els.toastAction.style.display = actionLabel ? "block" : "none";
  els.toastAction.onclick = () => {
    if (action) action();
    els.toast.classList.remove("show");
  };
  els.toast.classList.add("show");
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, actionLabel ? 4200 : 1800);
}
