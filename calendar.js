(function () {
  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function at(date, time) {
    return new Date(`${dateKey(date)}T${time}:00`);
  }

  function normalizeEvent(event) {
    return {
      id: event.id || `${event.title}-${event.start}`,
      title: event.title || "名称未設定の予定",
      start: event.start,
      end: event.end,
      location: event.location || "",
      calendarName: event.calendarName || "Personal",
      source: event.source || "mock"
    };
  }

  function buildDefaultMockEvents(date) {
    return [
      {
        id: "mock-morning-review",
        title: "朝の状態確認",
        start: at(date, "09:30").toISOString(),
        end: at(date, "09:45").toISOString(),
        calendarName: "Personal OS"
      },
      {
        id: "mock-campus-work",
        title: "大学課題 / 勉強ブロック",
        start: at(date, "13:00").toISOString(),
        end: at(date, "14:30").toISOString(),
        calendarName: "積み上げ"
      },
      {
        id: "mock-evening-review",
        title: "夜レビュー",
        start: at(date, "22:30").toISOString(),
        end: at(date, "22:45").toISOString(),
        calendarName: "生活観測"
      }
    ];
  }

  function createMockProvider({ storage } = {}) {
    const adapter = storage || window.LifeObserverStorage?.adapter;
    const keys = window.LifeObserverStorage?.KEYS || {
      calendarMockEvents: "lifeObserver.calendar.mockEvents"
    };
    return {
      sourceLabel: "予定メモ",
      async getTodayEvents(date = new Date()) {
        const stored = adapter ? adapter.getArray(keys.calendarMockEvents) : [];
        const events = stored.length ? stored : buildDefaultMockEvents(date);
        return events.map(normalizeEvent);
      }
    };
  }

  function createGoogleCalendarProvider() {
    return {
      sourceLabel: "Google Calendar",
      async getTodayEvents() {
        throw new Error("Google Calendar連携はまだ準備中です。");
      }
    };
  }

  function getProvider() {
    if (window.lifeObserverCalendarProvider) return window.lifeObserverCalendarProvider;
    return createMockProvider();
  }

  window.LifeObserverCalendar = {
    createMockProvider,
    createGoogleCalendarProvider,
    getProvider
  };
})();
