function renderAll() {
  const date = todayKey();
  const summary = getTodaySummary(date);
  const moneySummary = getMoneySummary();
  const review = dailyReviews[date];
  const observed = summary.observationCount > 0 || Boolean(review);

  els.todayLabel.textContent = formatToday();
  els.observePill.textContent = observed ? "観測済み" : "未観測";
  els.observePill.classList.toggle("observed", observed);
  els.observePill.classList.toggle("unobserved", !observed);
  els.stateText.textContent = observed ? "観測済み" : "未観測";
  renderCalendarCockpit(summary, moneySummary, review);

  els.homeNetWorth.textContent = formatYen(moneySummary.netWorth);
  els.homeLastBalance.textContent = `最終残高更新: ${moneySummary.lastBalanceDate}`;
  els.homeMonthExpense.textContent = formatYen(moneySummary.monthExpense);
  els.homeExpense.textContent = formatYen(moneySummary.todayExpense);
  els.homeBudgetLeft.textContent = settings.monthlyBudget > 0 ? formatYen(moneySummary.budgetLeft) : "未設定";
  els.homeEscape.textContent = `${summary.escapeMinutes}分`;
  els.homeBuild.textContent = `${summary.buildMinutes}分`;
  els.homeMind.textContent = getMindLabel(summary, review);

  els.observeCount.textContent = `${summary.observationCount}件`;
  els.unobservedAvoided.textContent = observed ? "見えている" : "未観測";
  els.escapeObserved.textContent = summary.escapeMinutes > 0 ? "逃避も観測済み" : "まだ未観測";
  els.todayPlusShort.textContent = observed ? "見えた" : "1件でOK";
  els.todayPlusMessage.textContent = getPlusMessage(summary, observed);
  els.reviewWarning.classList.toggle("show", !review);

  els.reviewEscape.textContent = `${summary.escapeMinutes}分`;
  els.reviewBuild.textContent = `${summary.buildMinutes}分`;
  els.reviewExpense.textContent = formatYen(moneySummary.todayExpense);

  els.moneyNetWorth.textContent = formatYen(moneySummary.netWorth);
  els.moneyLastBalance.textContent = `最終残高更新: ${moneySummary.lastBalanceDate}`;
  els.moneyMonthExpense.textContent = formatYen(moneySummary.monthExpense);
  els.moneyBudgetLeft.textContent = settings.monthlyBudget > 0 ? formatYen(moneySummary.budgetLeft) : "未設定";
  els.monthlyBudgetInput.value = String(settings.monthlyBudget || 0);

  renderTodayRecords(summary.records);
  renderReviewForm(review);
  renderAccounts();
  renderAccountSelects();
  renderMoneyTemplates();
  renderMonthMoneyRecords();
  renderHistory();
}

async function loadCalendarAgenda() {
  if (!calendarProvider) {
    calendarStatus = "error";
    calendarError = "予定取得の設定がありません";
    renderCalendarCockpit();
    return;
  }
  calendarStatus = "loading";
  calendarError = "";
  renderCalendarCockpit();
  try {
    const events = await calendarProvider.getTodayEvents(new Date());
    calendarEvents = Array.isArray(events) ? events : [];
    calendarStatus = "ready";
    calendarUpdatedAt = timeKey();
  } catch (error) {
    calendarEvents = [];
    calendarStatus = "error";
    calendarError = error.message || "予定を取得できませんでした";
  }
  renderCalendarCockpit();
}

function renderCalendarCockpit(summary = getTodaySummary(), moneySummary = getMoneySummary(), review = dailyReviews[todayKey()]) {
  if (!els.calendarNow) return;
  const now = new Date();
  const agenda = getAgendaState(calendarEvents, now);
  const sourceLabel = calendarProvider?.sourceLabel || "Calendar";
  els.calendarSource.textContent = calendarStatus === "ready" && calendarUpdatedAt
    ? `${sourceLabel} / ${calendarUpdatedAt}更新`
    : sourceLabel;
  els.calendarNow.textContent = formatClock(now);
  els.calendarCount.textContent = calendarStatus === "loading" ? "読込中" : `${agenda.events.length}件`;

  if (calendarStatus === "error") {
    els.nextEventLabel.textContent = "予定取得";
    els.nextEventTitle.textContent = "予定は未観測";
    els.nextEventCountdown.textContent = calendarError || "予定連携の準備中です";
  } else if (calendarStatus === "loading") {
    els.nextEventLabel.textContent = "予定取得";
    els.nextEventTitle.textContent = "読み込み中";
    els.nextEventCountdown.textContent = "今日の予定を確認しています";
  } else if (agenda.currentEvent) {
    els.nextEventLabel.textContent = "進行中";
    els.nextEventTitle.textContent = agenda.currentEvent.title;
    els.nextEventCountdown.textContent = `終了まであと${formatDurationBetween(now, agenda.currentEvent.endDate)}`;
  } else if (agenda.nextEvent) {
    els.nextEventLabel.textContent = "次の予定";
    els.nextEventTitle.textContent = agenda.nextEvent.title;
    els.nextEventCountdown.textContent = `開始まであと${formatDurationBetween(now, agenda.nextEvent.startDate)} / ${formatTimeRange(agenda.nextEvent)}`;
  } else {
    els.nextEventLabel.textContent = "次の予定";
    els.nextEventTitle.textContent = "今日はこの先の予定なし";
    els.nextEventCountdown.textContent = "空いている時間を積み上げか回復に使えます";
  }

  renderFreeTime(agenda.freeWindows);
  renderCalendarEvents(agenda.events);
  els.homePriority.textContent = getPriorityHint(summary, moneySummary, review, agenda);
}

function renderFreeTime(freeWindows) {
  els.freeTimeList.innerHTML = "";
  if (calendarStatus === "loading") {
    renderEmpty(els.freeTimeList, "予定データを確認しています");
    return;
  }
  if (calendarStatus === "error") {
    renderEmpty(els.freeTimeList, "予定の取得先を確認中です");
    return;
  }
  const visibleWindows = freeWindows.filter((windowItem) => windowItem.minutes >= 15).slice(0, 3);
  if (visibleWindows.length === 0) {
    renderEmpty(els.freeTimeList, "この先のまとまった空き時間は少なめです");
    return;
  }
  visibleWindows.forEach((windowItem) => {
    const item = document.createElement("div");
    item.className = "free-time-item";
    item.textContent = `${formatClock(windowItem.start)}-${formatClock(windowItem.end)} / ${formatMinutes(windowItem.minutes)}`;
    els.freeTimeList.appendChild(item);
  });
}

function renderCalendarEvents(events) {
  els.calendarEventList.innerHTML = "";
  if (calendarStatus === "loading" || calendarStatus === "error") return;
  if (events.length === 0) {
    renderEmpty(els.calendarEventList, "今日の予定はまだ未観測です");
    return;
  }
  const now = new Date();
  events.forEach((event) => {
    const item = document.createElement("div");
    item.className = "agenda-item";
    const status = getEventStatus(event, now);
    if (status) item.classList.add(status);
    const time = document.createElement("div");
    time.className = "agenda-time";
    time.textContent = formatTimeRange(event);
    const main = document.createElement("div");
    main.className = "agenda-main";
    const title = document.createElement("div");
    title.className = "agenda-title";
    title.textContent = event.title;
    const meta = document.createElement("div");
    meta.className = "agenda-meta";
    meta.textContent = [event.calendarName, event.location].filter(Boolean).join(" / ");
    main.append(title, meta);
    item.append(time, main);
    els.calendarEventList.appendChild(item);
  });
}

function getEventStatus(event, now) {
  if (event.startDate <= now && event.endDate > now) return "current";
  if (event.startDate > now) return "upcoming";
  return "past";
}

function getAgendaState(events, now) {
  const normalized = events
    .map((event) => ({
      ...event,
      startDate: new Date(event.start),
      endDate: new Date(event.end)
    }))
    .filter((event) => !Number.isNaN(event.startDate.getTime()) && !Number.isNaN(event.endDate.getTime()))
    .sort((a, b) => a.startDate - b.startDate);
  const currentEvent = normalized.find((event) => event.startDate <= now && event.endDate > now);
  const nextEvent = normalized.find((event) => event.startDate > now);
  return {
    events: normalized,
    currentEvent,
    nextEvent,
    freeWindows: getFreeWindows(normalized, now)
  };
}

function getFreeWindows(events, now) {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  let cursor = new Date(now);
  const windows = [];
  events.forEach((event) => {
    if (event.endDate <= now) return;
    const start = event.startDate > now ? event.startDate : now;
    if (start > cursor) {
      windows.push({
        start: new Date(cursor),
        end: new Date(start),
        minutes: Math.max(0, Math.round((start - cursor) / 60000))
      });
    }
    if (event.endDate > cursor) cursor = new Date(event.endDate);
  });
  if (cursor < endOfDay) {
    windows.push({
      start: new Date(cursor),
      end: endOfDay,
      minutes: Math.max(0, Math.round((endOfDay - cursor) / 60000))
    });
  }
  return windows;
}

function getPriorityHint(summary, moneySummary, review, agenda) {
  if (agenda.currentEvent) return `今は「${agenda.currentEvent.title}」の時間です。終わったら1件だけ状態を観測します。`;
  if (agenda.nextEvent && agenda.freeWindows[0]?.minutes >= 30) return `次の予定まで${agenda.freeWindows[0].minutes}分。短い積み上げか準備に使えます。`;
  if (summary.observationCount === 0) return "まず1件だけ観測。未記録は失敗ではなく未観測です。";
  if (summary.escapeMinutes > summary.buildMinutes) return "逃避は観測済み。次は15分だけ積み上げに戻す候補です。";
  if (moneySummary.todayExpense > 0 && moneySummary.budgetLeft < 0) return "支出が予算を超えています。責めずに、次の買い物前に一度見る日です。";
  if (!review) return "夜に30秒レビューで今日を閉じると、明日の判断材料が増えます。";
  return "今日の観測は進んでいます。次の予定か回復を優先して大丈夫です。";
}

function renderTodayRecords(todayItems) {
  els.todayRecords.innerHTML = "";
  if (todayItems.length === 0) {
    renderEmpty(els.todayRecords, "まだ記録はありません");
    return;
  }

  todayItems.slice().reverse().forEach((record) => {
    const item = document.createElement("div");
    item.className = "record-item";
    const main = document.createElement("div");
    main.className = "record-main";
    const title = document.createElement("div");
    title.className = "record-title";
    title.textContent = `${record.time} ${record.categoryLabel} ${recordAmountText(record)}`;
    const meta = document.createElement("div");
    meta.className = "record-meta";
    const shino = record.shinoDetail && (record.shinoDetail.fact || record.shinoDetail.interpretation || record.shinoDetail.reaction)
      ? "詩乃への自分の反応を詳細観測"
      : "";
    meta.textContent = [record.contextTag, record.reason, record.mood, record.expenseMeaning, record.futureValue, shino, record.note].filter(Boolean).join(" / ");
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "修正";
    edit.addEventListener("click", () => openRecordEditor(record.id));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "削除";
    del.addEventListener("click", () => deleteRecord(record.id));
    main.append(title, meta);
    actions.append(edit, del);
    item.append(main, actions);
    els.todayRecords.appendChild(item);
  });
}

function renderAccounts() {
  els.accountList.innerHTML = "";
  if (accounts.length === 0) {
    renderEmpty(els.accountList, "口座を追加すると総資産が見えます");
    return;
  }
  accounts.forEach((account) => {
    const item = document.createElement("div");
    item.className = "account-item";
    const main = document.createElement("div");
    main.className = "account-main";
    const title = document.createElement("div");
    title.className = "account-title";
    title.textContent = `${account.name} ${formatYen(account.balance)}`;
    const meta = document.createElement("div");
    meta.className = "account-meta";
    meta.textContent = `${ACCOUNT_TYPE_LABELS[account.type] || account.type} / ${account.isDebt ? "負債" : "資産"} / 更新 ${formatDateShort(account.updatedAt)}`;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "編集";
    edit.addEventListener("click", () => editAccount(account.id));
    main.append(title, meta);
    item.append(main, edit);
    els.accountList.appendChild(item);
  });
}

function renderAccountSelects() {
  const currentFrom = els.moneyAccount.value;
  const currentTo = els.moneyToAccount.value;
  const fromAccounts = selectedMoneyType === "creditExpense"
    ? accounts.filter((account) => account.type === "credit" && account.isDebt)
    : selectedMoneyType === "creditPayment"
      ? accounts.filter((account) => !account.isDebt)
      : accounts;
  const toAccounts = selectedMoneyType === "creditPayment"
    ? accounts.filter((account) => account.type === "credit" && account.isDebt)
    : accounts;
  fillAccountSelect(els.moneyAccount, fromAccounts, currentFrom);
  fillAccountSelect(els.moneyToAccount, toAccounts, currentTo);
}

function fillAccountSelect(select, items, current) {
  select.innerHTML = "";
  items.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = `${account.name} (${formatYen(account.balance)})`;
    select.appendChild(option);
  });
  if (items.some((account) => account.id === current)) select.value = current;
}

function renderMoneyTypeState() {
  if (["creditExpense", "creditPayment"].includes(selectedMoneyType)) ensureDefaultCreditAccount();
  renderAccountSelects();
  els.toAccountField.style.display = ["transfer", "creditPayment"].includes(selectedMoneyType) ? "grid" : "none";
  els.fromAccountLabel.textContent = selectedMoneyType === "income"
    ? "入金先口座"
    : selectedMoneyType === "creditExpense"
      ? "クレカ口座"
      : "支払い元口座";
  els.toAccountLabel.textContent = selectedMoneyType === "creditPayment" ? "返済先クレカ口座" : "振替先口座";
  if (selectedMoneyType === "creditExpense") {
    if (!isCreditDebtAccount(els.moneyAccount.value)) els.moneyAccount.value = getDefaultCreditAccountId();
  }
  if (selectedMoneyType === "creditPayment") {
    if (!els.moneyAccount.value || isCreditDebtAccount(els.moneyAccount.value)) els.moneyAccount.value = getDefaultAccountId();
    if (!isCreditDebtAccount(els.moneyToAccount.value)) els.moneyToAccount.value = getDefaultCreditAccountId();
  }
  if (selectedMoneyType === "transfer") {
    const from = els.moneyAccount.value || getDefaultAccountId();
    if (!els.moneyToAccount.value) els.moneyToAccount.value = getDefaultMoneyToAccountId("transfer", from);
  }
  els.moneyCategoryField.style.display = selectedMoneyType === "creditPayment" ? "none" : "grid";
  els.moneyMeaningChips.parentElement.style.display = isSpendingType(selectedMoneyType) ? "grid" : "none";
  els.moneyFutureChips.parentElement.style.display = isSpendingType(selectedMoneyType) ? "grid" : "none";
}

function renderMoneyTemplates() {
  els.moneyTemplates.innerHTML = "";
  settings.moneyTemplates.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-btn";
    button.innerHTML = `<span>${escapeHtml(template.name)} ${formatYen(template.amount)}</span><small>${escapeHtml(template.category)} / ${escapeHtml(template.meaning)}</small>`;
    button.addEventListener("click", () => saveMoneyTemplate(template));
    els.moneyTemplates.appendChild(button);
  });
}

function renderMonthMoneyRecords() {
  els.monthMoneyRecords.innerHTML = "";
  const month = monthKey();
  const items = moneyRecords.filter((record) => record.date.startsWith(month));
  if (items.length === 0) {
    renderEmpty(els.monthMoneyRecords, "今月のお金の動きはまだ未観測です");
    return;
  }
  items.slice().reverse().forEach((record) => {
    const item = document.createElement("div");
    item.className = "record-item";
    const main = document.createElement("div");
    main.className = "record-main";
    const title = document.createElement("div");
    title.className = "record-title";
    title.textContent = `${record.date} ${MONEY_TYPE_LABELS[record.type]} ${formatYen(record.amount)}`;
    const meta = document.createElement("div");
    meta.className = "record-meta";
    meta.textContent = [
      getAccountName(record.accountId),
      record.type === "transfer" ? `-> ${getAccountName(record.toAccountId)}` : "",
      record.category,
      record.meaning,
      record.futureValue,
      record.note
    ].filter(Boolean).join(" / ");
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "修正";
    edit.addEventListener("click", () => editMoneyRecord(record.id));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "削除";
    del.addEventListener("click", () => deleteMoneyRecord(record.id));
    main.append(title, meta);
    actions.append(edit, del);
    item.append(main, actions);
    els.monthMoneyRecords.appendChild(item);
  });
}

function renderReviewForm(review) {
  if (review) {
    reviewState = {
      mentalState: review.mentalState || "安定",
      escapeCauses: review.escapeCauses || [],
      wins: review.wins || [],
      tomorrowFix: review.tomorrowFix || "寝る前スマホを置く"
    };
    els.reviewNote.value = review.note || "";
  }

  renderSingleChoice(els.reviewMindChips, CHIPS.reviewMind, reviewState.mentalState, (value) => {
    reviewState.mentalState = value;
  });
  renderMultiChoice(els.causeChips, CHIPS.causes, reviewState.escapeCauses, (value) => {
    reviewState.escapeCauses = value;
  });
  renderMultiChoice(els.winChips, CHIPS.wins, reviewState.wins, (value) => {
    reviewState.wins = value;
  });
  renderSingleChoice(els.fixChips, CHIPS.fixes, reviewState.tomorrowFix, (value) => {
    reviewState.tomorrowFix = value;
  });
}

function renderHistory() {
  els.historyList.innerHTML = "";
  for (let offset = 0; offset < 7; offset++) {
    const date = dateKeyFromOffset(offset);
    const summary = getTodaySummary(date);
    const review = dailyReviews[date];
    const expense = getExpenseForDate(date);
    const item = document.createElement("div");
    item.className = "history-item";
    const title = document.createElement("div");
    title.className = "history-title";
    title.textContent = `${date} ${summary.observationCount > 0 || review ? "観測済み" : "未観測"}`;
    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = [
      `逃避 ${summary.escapeMinutes}分`,
      `積み上げ ${summary.buildMinutes}分`,
      `支出 ${formatYen(expense)}`,
      `精神 ${getMindLabel(summary, review)}`,
      `夜レビュー ${review ? "済" : "未"}`
    ].join(" / ");
    item.append(title, meta);
    els.historyList.appendChild(item);
  }
}

function renderEmpty(container, message) {
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = message;
  container.appendChild(empty);
}
