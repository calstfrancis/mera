const DEFAULT_LIMIT = 22;

// ── Storage helpers ────────────────────────────────────────────────────────

async function getSettings() {
  const r = await browser.storage.local.get(["tabLimit", "perWindow", "blockedToday"]);
  return {
    limit:        r.tabLimit    ?? DEFAULT_LIMIT,
    perWindow:    r.perWindow   ?? false,
    blockedToday: r.blockedToday ?? { date: null, count: 0 }
  };
}

async function countTabs(windowId = null) {
  const query = { pinned: false };
  if (windowId !== null) query.windowId = windowId;
  const tabs = await browser.tabs.query(query);
  return tabs.length;
}

// ── Badge ──────────────────────────────────────────────────────────────────

async function updateBadge() {
  const { limit, perWindow } = await getSettings();

  let count;
  if (perWindow) {
    try {
      const win = await browser.windows.getLastFocused({ populate: false });
      count = await countTabs(win.id);
    } catch {
      count = await countTabs();
    }
  } else {
    count = await countTabs();
  }

  const atLimit = count >= limit;
  browser.action.setBadgeText({ text: String(count) });
  browser.action.setBadgeBackgroundColor({ color: atLimit ? "#c50042" : "#555566" });
}

// ── Block counting ─────────────────────────────────────────────────────────

async function recordBlock() {
  const today = new Date().toISOString().slice(0, 10);
  const r = await browser.storage.local.get("blockedToday");
  const prev = r.blockedToday ?? { date: null, count: 0 };
  const count = prev.date === today ? prev.count + 1 : 1;
  await browser.storage.local.set({
    blockedToday: { date: today, count },
    wasBlocked: true
  });
}

// ── Enforcement ────────────────────────────────────────────────────────────

async function enforceLimitOnTab(tab) {
  const { limit, perWindow } = await getSettings();
  const windowId = perWindow ? tab.windowId : null;
  const count = await countTabs(windowId);

  if (count <= limit) {
    await updateBadge();
    return;
  }

  await browser.tabs.remove(tab.id);
  await recordBlock();
  await updateBadge();

  const scope = perWindow ? "This window has" : "You have";
  browser.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-48.png",
    title: "Tab Cap — limit reached",
    message: `${scope} ${limit} tabs open. Close one to open a new tab.`
  });
}

// ── Listeners ──────────────────────────────────────────────────────────────

browser.tabs.onCreated.addListener((tab) => enforceLimitOnTab(tab));
browser.tabs.onRemoved.addListener(() => updateBadge());
browser.windows.onFocusChanged.addListener(() => updateBadge());

updateBadge();
