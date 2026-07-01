const DEFAULT_LIMIT = 22;
const SAVE_DEBOUNCE_MS = 600;

const shakeTarget   = document.getElementById("shake-target");
const openCountEl   = document.getElementById("open-count");
const limitDisplay  = document.getElementById("limit-display");
const progressFill  = document.getElementById("progress-fill");
const blockedRow    = document.getElementById("blocked-row");
const blockedCount  = document.getElementById("blocked-count");
const limitInput    = document.getElementById("limit-input");
const decBtn        = document.getElementById("dec-btn");
const incBtn        = document.getElementById("inc-btn");
const perWindowToggle = document.getElementById("per-window-toggle");
const toggleDesc    = document.getElementById("toggle-desc");
const statusEl      = document.getElementById("status");

// ── Theme ──────────────────────────────────────────────────────────────────

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function mixColor(hex, towardWhite, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const target = towardWhite ? 255 : 0;
  const mix = v => Math.round(v + (target - v) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function applyTheme(theme) {
  const c    = theme.colors || {};
  const root = document.documentElement;

  const bg     = c.popup        || c.toolbar        || "#f0f0f4";
  const text   = c.popup_text   || c.toolbar_text   || "#15141a";
  const border = c.popup_border || c.toolbar_field_border || "#c4c4cc";
  const accent = c.button_background_active || c.icons || "#0061e0";
  const dark   = luminance(bg) < 0.18;

  root.style.setProperty("--bg",            bg);
  root.style.setProperty("--bg-secondary",  dark ? mixColor(bg, true, 0.09) : mixColor(bg, false, 0.09));
  root.style.setProperty("--text",          text);
  root.style.setProperty("--text-muted",    dark ? mixColor(text, false, 0.4) : mixColor(text, true, 0.4));
  root.style.setProperty("--border",        border);
  root.style.setProperty("--accent",        accent);
  root.style.setProperty("--accent-text",   luminance(accent) > 0.18 ? "#000" : "#fff");
  root.style.setProperty("--button-hover",  dark ? mixColor(bg, true, 0.13) : mixColor(bg, false, 0.13));
  root.style.setProperty("--button-active", dark ? mixColor(bg, true, 0.20) : mixColor(bg, false, 0.20));
  root.style.setProperty("--success",       dark ? "#3fc675" : "#017a40");
  root.style.setProperty("--warn",          dark ? "#ff9440" : "#cd4800");
  root.style.setProperty("--danger",        dark ? "#ff4f5e" : "#c50042");
}

async function initTheme() {
  const theme = await browser.theme.getCurrent();
  applyTheme(theme);
  browser.theme.onUpdated.addListener(({ theme: t }) => applyTheme(t));
}

// ── Progress ───────────────────────────────────────────────────────────────

function updateProgress(open, limit) {
  const pct = Math.min(100, (open / limit) * 100);
  progressFill.style.width = `${pct}%`;
  progressFill.className = pct >= 100 ? "full" : pct >= 80 ? "warn" : "";
  document.querySelector(".progress-bar").setAttribute("aria-valuenow", Math.round(pct));
}

// ── Auto-save ──────────────────────────────────────────────────────────────

let saveTimer = null;

async function doSave(value) {
  if (!Number.isFinite(value) || value < 1) {
    showStatus("Enter a number ≥ 1.", "err");
    return;
  }
  await browser.storage.local.set({ tabLimit: value });

  const tabs = await browser.tabs.query({ pinned: false });
  const open = tabs.length;
  limitDisplay.textContent = value;
  updateProgress(open, value);
  showStatus("Saved.", "ok", 1500);
}

function scheduleSave(value) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => doSave(value), SAVE_DEBOUNCE_MS);
}

// ── Status feedback ────────────────────────────────────────────────────────

let statusTimer = null;

function showStatus(msg, cls, clearAfter = 0) {
  clearTimeout(statusTimer);
  statusEl.textContent = msg;
  statusEl.className   = cls;
  if (clearAfter) statusTimer = setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className   = "";
  }, clearAfter);
}

// ── Shake ──────────────────────────────────────────────────────────────────

async function maybeShake() {
  const r = await browser.storage.local.get("wasBlocked");
  if (!r.wasBlocked) return;
  await browser.storage.local.remove("wasBlocked");
  shakeTarget.classList.add("shake");
  shakeTarget.addEventListener("animationend", () => shakeTarget.classList.remove("shake"), { once: true });
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  const [storageResult, tabs] = await Promise.all([
    browser.storage.local.get(["tabLimit", "perWindow", "blockedToday"]),
    browser.tabs.query({ pinned: false })
  ]);

  const limit     = storageResult.tabLimit  ?? DEFAULT_LIMIT;
  const perWindow = storageResult.perWindow ?? false;
  const open      = tabs.length;

  // Tab count + progress
  openCountEl.textContent  = open;
  limitDisplay.textContent = limit;
  limitInput.value         = limit;
  updateProgress(open, limit);

  // Block count
  const today   = new Date().toISOString().slice(0, 10);
  const blocked = storageResult.blockedToday;
  if (blocked && blocked.date === today && blocked.count > 0) {
    blockedCount.textContent = blocked.count;
    blockedRow.hidden = false;
  }

  // Per-window toggle
  perWindowToggle.checked = perWindow;
  updateToggleDesc(perWindow);
}

function updateToggleDesc(perWindow) {
  toggleDesc.textContent = perWindow
    ? "Limit applies to each window separately."
    : "Limit applies to all windows combined.";
}

// ── Controls ───────────────────────────────────────────────────────────────

decBtn.addEventListener("click", () => {
  const v = parseInt(limitInput.value, 10);
  if (v > 1) {
    limitInput.value = v - 1;
    doSave(v - 1);
  }
});

incBtn.addEventListener("click", () => {
  const v = parseInt(limitInput.value, 10);
  if (v < 200) {
    limitInput.value = v + 1;
    doSave(v + 1);
  }
});

limitInput.addEventListener("input", () => {
  scheduleSave(parseInt(limitInput.value, 10));
});

perWindowToggle.addEventListener("change", async () => {
  const perWindow = perWindowToggle.checked;
  await browser.storage.local.set({ perWindow });
  updateToggleDesc(perWindow);
  showStatus("Saved.", "ok", 1500);
});

// ── Start ──────────────────────────────────────────────────────────────────

initTheme();
init();
maybeShake();
