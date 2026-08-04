(function () {
  const KEYS = {
    records: "lifeObserver.records",
    dailyReviews: "lifeObserver.dailyReviews",
    settings: "lifeObserver.settings",
    accounts: "lifeObserver.accounts",
    moneyRecords: "lifeObserver.moneyRecords",
    calendarMockEvents: "lifeObserver.calendar.mockEvents",
    integrationSettings: "lifeObserver.integrationSettings"
  };

  function parseJson(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function createLocalStorageAdapter() {
    return {
      getArray(key) {
        const value = parseJson(localStorage.getItem(key), []);
        return Array.isArray(value) ? value : [];
      },
      getObject(key) {
        const value = parseJson(localStorage.getItem(key), {});
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
      },
      set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
      },
      remove(key) {
        localStorage.removeItem(key);
      }
    };
  }

  window.LifeObserverStorage = {
    KEYS,
    createLocalStorageAdapter,
    adapter: createLocalStorageAdapter()
  };
})();
