function resetAccountForm() {
  els.accountFormTitle.textContent = "口座を追加";
  els.accountEditId.value = "";
  els.accountName.value = "";
  els.accountType.value = "cash";
  els.accountBalance.value = "0";
  els.accountIsDebt.checked = false;
}

function editAccount(id) {
  const account = accounts.find((item) => item.id === id);
  if (!account) return;
  els.accountFormTitle.textContent = "口座を編集";
  els.accountEditId.value = account.id;
  els.accountName.value = account.name;
  els.accountType.value = account.type;
  els.accountBalance.value = account.balance;
  els.accountIsDebt.checked = Boolean(account.isDebt);
  showView("money");
}

function saveAccount() {
  const name = els.accountName.value.trim() || "名称未設定";
  const now = new Date().toISOString();
  const editingId = els.accountEditId.value;
  const payload = {
    name,
    type: els.accountType.value,
    balance: Number(els.accountBalance.value || 0),
    isDebt: els.accountType.value === "credit" ? true : els.accountIsDebt.checked,
    updatedAt: now
  };
  if (editingId) {
    const account = accounts.find((item) => item.id === editingId);
    if (account) Object.assign(account, payload);
  } else {
    accounts.push({
      id: makeId(),
      createdAt: now,
      ...payload
    });
  }
  saveArray(STORAGE_KEYS.accounts, accounts);
  resetAccountForm();
  renderAll();
  showToast("残高を観測しました");
}

function saveMonthlyBudget() {
  settings.monthlyBudget = Math.max(0, Number(els.monthlyBudgetInput.value || 0));
  saveObject(STORAGE_KEYS.settings, settings);
  renderAll();
  showToast("月予算を保存しました");
}

function resetMoneyForm() {
  els.moneyFormTitle.textContent = "お金の動きを記録";
  els.moneyEditId.value = "";
  selectedMoneyType = "expense";
  selectedMoneyMeaning = "必要";
  selectedMoneyFuture = "今を保つために必要";
  els.moneyAmount.value = "0";
  els.moneyCategory.value = "食費";
  els.moneyNote.value = "";
  buildMoneyChoiceControls();
  renderAccountSelects();
}

function saveMoneyRecordFromForm() {
  const amount = Math.max(0, Number(els.moneyAmount.value || 0));
  if (amount <= 0) {
    showToast("金額を入れてください");
    return;
  }
  if (!els.moneyAccount.value) {
    showToast("口座を1つ追加してください");
    return;
  }
  if (["transfer", "creditPayment"].includes(selectedMoneyType) && !els.moneyToAccount.value) {
    showToast(selectedMoneyType === "creditPayment" ? "返済先クレカ口座を選んでください" : "振替先を選んでください");
    return;
  }
  if (selectedMoneyType === "creditExpense" && !isCreditDebtAccount(els.moneyAccount.value)) {
    showToast("クレカ負債口座を選んでください");
    return;
  }
  if (selectedMoneyType === "creditPayment" && !isCreditDebtAccount(els.moneyToAccount.value)) {
    showToast("返済先にはクレカ負債口座を選んでください");
    return;
  }
  const now = new Date().toISOString();
  const editingId = els.moneyEditId.value;
  if (editingId) {
    const existing = moneyRecords.find((item) => item.id === editingId);
    if (!existing) return;
    applyMoneyRecordEffect(existing, -1);
    Object.assign(existing, moneyRecordPayload(amount, now), { updatedAt: now });
    applyMoneyRecordEffect(existing, 1);
    syncLinkedObservation(existing);
    showToast("お金の動きを修正しました");
  } else {
    const record = {
      id: makeId(),
      date: todayKey(),
      time: timeKey(),
      createdAt: now,
      updatedAt: now,
      ...moneyRecordPayload(amount, now)
    };
    applyMoneyRecordEffect(record, 1);
    moneyRecords.push(record);
    showToast(isSpendingType(record.type) ? "支出を観測しました。今日のお金の動きが見えました" : "お金の動きを観測しました", "修正", () => editMoneyRecord(record.id));
  }
  saveArray(STORAGE_KEYS.moneyRecords, moneyRecords);
  saveArray(STORAGE_KEYS.accounts, accounts);
  resetMoneyForm();
  renderAll();
}

function moneyRecordPayload(amount) {
  return {
    type: selectedMoneyType,
    accountId: els.moneyAccount.value,
    toAccountId: ["transfer", "creditPayment"].includes(selectedMoneyType) ? els.moneyToAccount.value : "",
    amount,
    category: els.moneyCategory.value.trim() || "未分類",
    meaning: isSpendingType(selectedMoneyType) ? selectedMoneyMeaning : "その他",
    futureValue: isSpendingType(selectedMoneyType) ? selectedMoneyFuture : "今を保つために必要",
    note: els.moneyNote.value.trim()
  };
}

function saveMoneyTemplate(template) {
  ensureDefaultAccount();
  const now = new Date().toISOString();
  const record = {
    id: makeId(),
    date: todayKey(),
    time: timeKey(),
    type: "expense",
    accountId: getDefaultAccountId(),
    toAccountId: "",
    amount: template.amount,
    category: template.category,
    meaning: template.meaning,
    futureValue: template.futureValue,
    note: template.name,
    createdAt: now,
    updatedAt: now
  };
  applyMoneyRecordEffect(record, 1);
  moneyRecords.push(record);
  saveArray(STORAGE_KEYS.moneyRecords, moneyRecords);
  saveArray(STORAGE_KEYS.accounts, accounts);
  renderAll();
  showToast(`${template.name}を観測しました`, "修正", () => editMoneyRecord(record.id));
}

function editMoneyRecord(id) {
  const record = moneyRecords.find((item) => item.id === id);
  if (!record) return;
  showView("money");
  els.moneyFormTitle.textContent = "お金の動きを修正";
  els.moneyEditId.value = record.id;
  selectedMoneyType = record.type;
  selectedMoneyMeaning = record.meaning || "必要";
  selectedMoneyFuture = record.futureValue || "今を保つために必要";
  els.moneyAmount.value = record.amount;
  els.moneyCategory.value = record.category || "";
  els.moneyNote.value = record.note || "";
  buildMoneyChoiceControls();
  renderAccountSelects();
  els.moneyAccount.value = record.accountId || "";
  els.moneyToAccount.value = record.toAccountId || "";
  renderMoneyTypeState();
}

function deleteMoneyRecord(id, render = true) {
  const record = moneyRecords.find((item) => item.id === id);
  if (record) {
    applyMoneyRecordEffect(record, -1);
    if (record.linkedRecordId) {
      const linked = records.find((item) => item.id === record.linkedRecordId);
      if (linked) linked.moneyRecordId = "";
    }
  }
  moneyRecords = moneyRecords.filter((item) => item.id !== id);
  saveArray(STORAGE_KEYS.moneyRecords, moneyRecords);
  saveArray(STORAGE_KEYS.accounts, accounts);
  saveArray(STORAGE_KEYS.records, records);
  if (render) {
    renderAll();
    showToast("お金の記録を削除しました");
  }
}

function syncLinkedObservation(moneyRecord) {
  if (!moneyRecord.linkedRecordId) return;
  const linked = records.find((item) => item.id === moneyRecord.linkedRecordId);
  if (!linked) return;
  linked.amountYen = moneyRecord.amount;
  linked.reason = moneyRecord.category;
  linked.expenseMeaning = moneyRecord.meaning;
  linked.futureValue = moneyRecord.futureValue;
  linked.note = moneyRecord.note;
  linked.updatedAt = new Date().toISOString();
  saveArray(STORAGE_KEYS.records, records);
}

function applyMoneyRecordEffect(record, direction) {
  const from = accounts.find((account) => account.id === record.accountId);
  const to = accounts.find((account) => account.id === record.toAccountId);
  if (record.type === "expense" && from) {
    applyAccountDelta(from, -record.amount * direction);
  }
  if (record.type === "income" && from) {
    applyAccountDelta(from, record.amount * direction);
  }
  if (record.type === "transfer") {
    if (from) applyAccountDelta(from, -record.amount * direction);
    if (to) applyAccountDelta(to, record.amount * direction);
  }
  if (record.type === "creditExpense" && from) {
    applyAccountDelta(from, -record.amount * direction);
  }
  if (record.type === "creditPayment") {
    if (from) applyAccountDelta(from, -record.amount * direction);
    if (to) applyAccountDelta(to, record.amount * direction);
  }
}

function applyAccountDelta(account, normalDelta) {
  account.balance = Number(account.balance || 0) + (account.isDebt ? -normalDelta : normalDelta);
  account.updatedAt = new Date().toISOString();
}

function isSpendingType(type) {
  return ["expense", "creditExpense"].includes(type);
}

function isCreditDebtAccount(id) {
  const account = accounts.find((item) => item.id === id);
  return Boolean(account && account.type === "credit" && account.isDebt);
}

