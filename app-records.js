document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  ensureSettings();
  ensureDefaultAccount();
  buildCategoryButtons();
  buildQuickForm(selectedCategory);
  buildMoneyChoiceControls();
  bindEvents();
  resetAccountForm();
  resetMoneyForm();
  renderAll();
  loadCalendarAgenda();
  window.setInterval(renderCalendarCockpit, 30000);
  window.setInterval(loadCalendarAgenda, 5 * 60 * 1000);
});

function cacheElements() {
      [
        "todayLabel", "observePill", "stateText", "homeNetWorth", "homeLastBalance",
        "calendarSource", "calendarNow", "calendarCount", "nextEventLabel",
        "nextEventTitle", "nextEventCountdown", "freeTimeList", "calendarEventList",
        "homePriority",
        "homeMonthExpense", "homeBudgetLeft", "homeEscape", "homeBuild", "homeExpense",
    "homeMind", "observeCount", "unobservedAvoided", "escapeObserved",
    "todayPlusShort", "todayPlusMessage", "reviewWarning", "todayRecords",
    "categorySections", "quickTitle", "amountField", "amountLabel", "amountChips",
    "amountInput", "reasonChips", "moodChips", "expenseExtraBlock",
    "quickMeaningChips", "quickFutureChips", "shinoDetailBlock", "shinoFact",
    "shinoInterpretation", "shinoReaction", "noteInput", "saveQuick",
    "moneyNetWorth", "moneyLastBalance", "moneyMonthExpense", "moneyBudgetLeft",
    "monthlyBudgetInput", "saveMonthlyBudget", "newAccountBtn", "accountList", "accountFormTitle", "accountEditId",
    "accountName", "accountType", "accountBalance", "accountIsDebt",
    "saveAccount", "moneyFormTitle", "moneyEditId", "moneyTypeChips",
    "moneyAmount", "fromAccountLabel", "moneyAccount", "toAccountField", "toAccountLabel",
    "moneyToAccount", "moneyCategoryField", "moneyCategory", "moneyMeaningChips", "moneyFutureChips",
    "moneyNote", "saveMoneyRecord", "moneyTemplates", "monthMoneyRecords",
    "historyList", "exportJson", "importJsonFile", "importJson",
    "reviewEscape", "reviewBuild", "reviewExpense", "reviewMindChips",
    "causeChips", "winChips", "fixChips", "reviewNote", "saveReview",
    "recordEditor", "recordEditTitle", "recordEditAmountField",
    "recordEditAmountLabel", "recordEditAmount", "recordEditReason",
    "recordEditMood", "recordEditShinoBlock", "recordEditShinoFact",
    "recordEditShinoInterpretation", "recordEditShinoReaction",
    "recordEditNote", "cancelRecordEdit", "saveRecordEdit", "toast",
    "toastText", "toastAction"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.go));
  });

  document.querySelectorAll("[data-fast]").forEach((button) => {
    button.addEventListener("click", () => saveFastRecord(button.dataset.fast));
  });

  els.saveQuick.addEventListener("click", saveQuickRecord);
  els.saveReview.addEventListener("click", saveDailyReview);
  els.saveMonthlyBudget.addEventListener("click", saveMonthlyBudget);
  els.newAccountBtn.addEventListener("click", resetAccountForm);
  els.accountType.addEventListener("change", () => {
    if (els.accountType.value === "credit") els.accountIsDebt.checked = true;
  });
  els.saveAccount.addEventListener("click", saveAccount);
  els.saveMoneyRecord.addEventListener("click", saveMoneyRecordFromForm);
  els.exportJson.addEventListener("click", exportJson);
  els.importJson.addEventListener("click", importJson);
  els.cancelRecordEdit.addEventListener("click", closeRecordEditor);
  els.saveRecordEdit.addEventListener("click", saveRecordEdit);
}

function showView(name) {
  closeRecordEditor();
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `${name}View`);
  });
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === name);
  });
  renderAll();
}

function buildCategoryButtons() {
  els.categorySections.innerHTML = "";
  CATEGORY_SECTIONS.forEach((section) => {
    const wrapper = document.createElement("div");
    wrapper.className = "category-section";
    const title = document.createElement("h3");
    title.className = "sub-title";
    title.textContent = section.title;
    const note = document.createElement("p");
    note.className = "sub-note";
    note.textContent = section.note;
    const grid = document.createElement("div");
    grid.className = "category-grid";
    section.keys.forEach((key) => {
      const def = CATEGORY_DEFS[key];
      if (!def) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-btn";
      button.dataset.category = key;
      button.dataset.group = def.group;
      button.textContent = def.label;
      button.addEventListener("click", () => buildQuickForm(key));
      grid.appendChild(button);
    });
    wrapper.append(title, note, grid);
    els.categorySections.appendChild(wrapper);
  });
}

function buildQuickForm(category) {
  selectedCategory = category;
  const def = CATEGORY_DEFS[category];
  selectedReason = CHIPS.reason[def.group][0];
  selectedMood = def.group === "mind" || def.group === "health" ? "不安" : "安定";
  selectedQuickMeaning = "必要";
  selectedQuickFuture = "今を保つために必要";
  els.noteInput.value = "";
  els.shinoFact.value = "";
  els.shinoInterpretation.value = "";
  els.shinoReaction.value = "";
  els.quickTitle.textContent = `${def.label}を記録`;

  document.querySelectorAll(".category-btn").forEach((button) => {
    button.classList.toggle("selected", button.dataset.category === category);
  });

  els.amountField.style.display = def.kind === "state" ? "none" : "grid";
  els.expenseExtraBlock.style.display = ["expense", "creditExpense"].includes(def.moneyType) ? "grid" : "none";
  els.shinoDetailBlock.style.display = category === "shinoAnxiety" ? "grid" : "none";

  if (def.kind !== "state") {
    els.amountLabel.textContent = def.kind === "money" ? "金額" : "時間";
    els.amountInput.value = String(settings.quickDefaults[category] || def.defaultValue);
    els.amountInput.placeholder = def.kind === "money" ? "円" : "分";
    els.amountChips.innerHTML = "";
    const values = def.kind === "money" ? CHIPS.money : CHIPS.duration;
    values.forEach((value) => {
      const chip = createChip(def.kind === "money" ? `${value}円` : `${value}分`, false, () => {
        els.amountInput.value = value;
        markAmountChip(value);
      });
      chip.dataset.value = value;
      els.amountChips.appendChild(chip);
    });
    markAmountChip(Number(els.amountInput.value));
  }

  renderSingleChoice(els.reasonChips, CHIPS.reason[def.group], selectedReason, (value) => {
    selectedReason = value;
  });
  renderSingleChoice(els.moodChips, CHIPS.moods, selectedMood, (value) => {
    selectedMood = value;
  });
  renderSingleChoice(els.quickMeaningChips, CHIPS.meanings, selectedQuickMeaning, (value) => {
    selectedQuickMeaning = value;
  });
  renderSingleChoice(els.quickFutureChips, CHIPS.futureValues, selectedQuickFuture, (value) => {
    selectedQuickFuture = value;
  });
}

function buildMoneyChoiceControls() {
  renderSingleChoice(els.moneyTypeChips, CHIPS.moneyTypes, MONEY_TYPE_LABELS[selectedMoneyType] || "支出", (value) => {
    selectedMoneyType = MONEY_TYPE_MAP[value];
    renderMoneyTypeState();
  });
  renderSingleChoice(els.moneyMeaningChips, CHIPS.meanings, selectedMoneyMeaning, (value) => {
    selectedMoneyMeaning = value;
  });
  renderSingleChoice(els.moneyFutureChips, CHIPS.futureValues, selectedMoneyFuture, (value) => {
    selectedMoneyFuture = value;
  });
  renderMoneyTypeState();
}

function markAmountChip(value) {
  els.amountChips.querySelectorAll(".chip").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.value) === Number(value));
  });
}

function renderSingleChoice(container, values, current, onSelect) {
  container.innerHTML = "";
  values.forEach((value) => {
    const chip = createChip(value, value === current, () => {
      onSelect(value);
      renderSingleChoice(container, values, value, onSelect);
    });
    container.appendChild(chip);
  });
}

function renderMultiChoice(container, values, selected, onChange) {
  container.innerHTML = "";
  values.forEach((value) => {
    const chip = createChip(value, selected.includes(value), () => {
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : selected.concat(value);
      onChange(next);
      renderMultiChoice(container, values, next, onChange);
    });
    container.appendChild(chip);
  });
}

function createChip(label, selected, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = selected ? "chip selected" : "chip";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function saveFastRecord(category) {
  const def = CATEGORY_DEFS[category];
  const value = settings.quickDefaults[category] ?? def.defaultValue;
  const reason = def.group === "build" ? "少しだけ" :
    def.group === "money" ? "食費" :
    def.group === "mind" ? "詩乃不安" :
    def.group === "health" ? "体調悪い" : "観測";
  const mood = def.group === "mind" || def.group === "health" ? "不安" : "未選択";
  const extra = category === "expense"
    ? { expenseMeaning: "必要", futureValue: "今を保つために必要" }
    : {};
  const record = addRecord(category, value, reason, mood, "ホーム即時記録", extra);
  if (def.group === "money") {
    createMoneyRecordFromObservation(record, value, "食費", "必要", "今を保つために必要", "ホーム即時記録", def.moneyType || "expense");
  }
  showToast(`${def.label}を観測しました。未記録より前進です`, "修正", () => openRecordEditor(record.id));
}

function saveQuickRecord() {
  const def = CATEGORY_DEFS[selectedCategory];
  const value = def.kind === "state" ? 0 : Math.max(0, Number(els.amountInput.value || 0));
  if (def.kind !== "state" && value <= 0) {
    showToast("0より大きい値を入れてください");
    return;
  }
  settings.quickDefaults[selectedCategory] = value || def.defaultValue;
  saveObject(STORAGE_KEYS.settings, settings);

  const extra = {};
  if (["expense", "creditExpense"].includes(def.moneyType)) {
    extra.expenseMeaning = selectedQuickMeaning;
    extra.futureValue = selectedQuickFuture;
  }
  if (selectedCategory === "shinoAnxiety") {
    extra.shinoDetail = {
      fact: els.shinoFact.value.trim(),
      interpretation: els.shinoInterpretation.value.trim(),
      reaction: els.shinoReaction.value.trim()
    };
  }

  const record = addRecord(selectedCategory, value, selectedReason, selectedMood, els.noteInput.value.trim(), extra);
  if (def.group === "money") {
    createMoneyRecordFromObservation(record, value, selectedReason, selectedQuickMeaning, selectedQuickFuture, els.noteInput.value.trim(), def.moneyType || "expense");
  }
  els.noteInput.value = "";
  showToast(`${def.label}を保存しました`, "修正", () => openRecordEditor(record.id));
}

function addRecord(category, value, reason, mood, note, extra = {}) {
  const def = CATEGORY_DEFS[category];
  const record = {
    id: makeId(),
    date: todayKey(),
    time: timeKey(),
    category,
    categoryLabel: def.label,
    type: def.group,
    amountMinutes: def.kind === "duration" ? value : 0,
    amountYen: def.kind === "money" ? value : 0,
    reason,
    mood,
    note: note || "",
    contextTag: extra.contextTag || def.contextTag || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...extra
  };
  records.push(record);
  saveArray(STORAGE_KEYS.records, records);
  renderAll();
  return record;
}

function createMoneyRecordFromObservation(record, amount, category, meaning, futureValue, note, moneyType = "expense") {
  ensureDefaultAccount();
  if (["creditExpense", "creditPayment"].includes(moneyType)) ensureDefaultCreditAccount();
  const accountId = getDefaultMoneyAccountId(moneyType);
  const toAccountId = getDefaultMoneyToAccountId(moneyType, accountId);
  const moneyRecord = {
    id: makeId(),
    date: record.date,
    time: record.time,
    type: moneyType,
    accountId,
    toAccountId,
    amount: Number(amount || 0),
    category: category || "食費",
    meaning: ["expense", "creditExpense"].includes(moneyType) ? (meaning || "必要") : "その他",
    futureValue: ["expense", "creditExpense"].includes(moneyType) ? (futureValue || "今を保つために必要") : "今を保つために必要",
    note: note || "生活観測から記録",
    linkedRecordId: record.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  applyMoneyRecordEffect(moneyRecord, 1);
  moneyRecords.push(moneyRecord);
  record.moneyRecordId = moneyRecord.id;
  saveArray(STORAGE_KEYS.moneyRecords, moneyRecords);
  saveArray(STORAGE_KEYS.records, records);
  saveArray(STORAGE_KEYS.accounts, accounts);
  renderAll();
  return moneyRecord;
}

function saveDailyReview() {
  const summary = getTodaySummary();
  const moneySummary = getMoneySummary();
  const date = todayKey();
  dailyReviews[date] = {
    date,
    escapeMinutes: summary.escapeMinutes,
    buildMinutes: summary.buildMinutes,
    expenseYen: moneySummary.todayExpense,
    mentalState: reviewState.mentalState,
    escapeCauses: reviewState.escapeCauses,
    wins: reviewState.wins,
    tomorrowFix: reviewState.tomorrowFix,
    note: els.reviewNote.value.trim(),
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveObject(STORAGE_KEYS.dailyReviews, dailyReviews);
  showToast("今日を責めずに確定しました");
  renderAll();
  showView("home");
}

function openRecordEditor(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;
  editingRecordId = id;
  els.recordEditTitle.textContent = `${record.categoryLabel}を修正`;
  const isState = !record.amountMinutes && !record.amountYen;
  els.recordEditAmountField.style.display = isState ? "none" : "grid";
  els.recordEditAmountLabel.textContent = record.amountYen ? "金額" : "時間";
  els.recordEditAmount.value = record.amountYen || record.amountMinutes || 0;
  els.recordEditReason.value = record.reason || "";
  els.recordEditMood.value = record.mood || "";
  els.recordEditNote.value = record.note || "";
  const shinoDetail = record.shinoDetail || {};
  els.recordEditShinoBlock.style.display = record.category === "shinoAnxiety" ? "grid" : "none";
  els.recordEditShinoFact.value = shinoDetail.fact || "";
  els.recordEditShinoInterpretation.value = shinoDetail.interpretation || "";
  els.recordEditShinoReaction.value = shinoDetail.reaction || "";
  els.recordEditor.classList.add("show");
}

function closeRecordEditor() {
  editingRecordId = "";
  els.recordEditor.classList.remove("show");
}

function saveRecordEdit() {
  const record = records.find((item) => item.id === editingRecordId);
  if (!record) return;
  const oldAmountYen = record.amountYen;
  const oldAmountMinutes = record.amountMinutes;
  const nextAmount = Number(els.recordEditAmount.value || 0);
  if (record.amountYen) record.amountYen = Math.max(0, nextAmount);
  if (record.amountMinutes) record.amountMinutes = Math.max(0, nextAmount);
  record.reason = els.recordEditReason.value.trim();
  record.mood = els.recordEditMood.value.trim();
  record.note = els.recordEditNote.value.trim();
  record.updatedAt = new Date().toISOString();
  if (record.category === "shinoAnxiety") {
    record.shinoDetail = {
      fact: els.recordEditShinoFact.value.trim(),
      interpretation: els.recordEditShinoInterpretation.value.trim(),
      reaction: els.recordEditShinoReaction.value.trim()
    };
  }
  if (record.moneyRecordId) {
    const moneyRecord = moneyRecords.find((item) => item.id === record.moneyRecordId);
    if (moneyRecord) {
      applyMoneyRecordEffect(moneyRecord, -1);
      moneyRecord.amount = record.amountYen || moneyRecord.amount;
      moneyRecord.category = record.reason || moneyRecord.category;
      moneyRecord.note = record.note || moneyRecord.note;
      moneyRecord.updatedAt = new Date().toISOString();
      applyMoneyRecordEffect(moneyRecord, 1);
      saveArray(STORAGE_KEYS.moneyRecords, moneyRecords);
      saveArray(STORAGE_KEYS.accounts, accounts);
    }
  }
  if (oldAmountYen !== record.amountYen || oldAmountMinutes !== record.amountMinutes) {
    settings.quickDefaults[record.category] = record.amountYen || record.amountMinutes || settings.quickDefaults[record.category];
    saveObject(STORAGE_KEYS.settings, settings);
  }
  saveArray(STORAGE_KEYS.records, records);
  closeRecordEditor();
  renderAll();
  showToast("記録を修正しました");
}

function deleteRecord(id) {
  const record = records.find((item) => item.id === id);
  if (record && record.moneyRecordId) {
    deleteMoneyRecord(record.moneyRecordId, false);
  }
  records = records.filter((item) => item.id !== id);
  saveArray(STORAGE_KEYS.records, records);
  renderAll();
  showToast("記録を削除しました");
}
