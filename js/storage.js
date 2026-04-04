/**
 * FinTrack Pro — Storage Module v2.0
 * • Quota detection & graceful error handling
 * • Schema versioning & v1 migration
 * • Data integrity validation
 * • Storage usage monitoring
 * • Change event broadcasting
 */

const Storage = (() => {
  const PREFIX  = 'ftp_';
  const VER_KEY = '_ftp_version';
  const VERSION = '2.0';

  // ── Migrate v1 keys (fintrack_ → ftp_) ────────────────
  const migrate = () => {
    try {
      if (localStorage.getItem(VER_KEY) === VERSION) return;
      const oldPrefix = 'fintrack_';
      Object.keys(localStorage)
        .filter(k => k.startsWith(oldPrefix))
        .forEach(k => {
          const newKey = PREFIX + k.slice(oldPrefix.length);
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, localStorage.getItem(k));
          }
        });
      localStorage.setItem(VER_KEY, VERSION);
    } catch (_) { /* silent — private browsing etc. */ }
  };

  // ── get ────────────────────────────────────────────────
  const get = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn(`[Storage] get("${key}"):`, e.message);
      return fallback;
    }
  };

  // ── set (with QuotaExceededError handling) ─────────────
  const set = (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('ftp:change', { detail: { key, value } }));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.error('[Storage] Quota exceeded.');
        setTimeout(() => {
          if (window.Utils) Utils.toast('⚠ Storage full. Export & clear old data.', 'error', 7000);
        }, 100);
      } else {
        console.warn(`[Storage] set("${key}"):`, e.message);
      }
      return false;
    }
  };

  // ── remove ─────────────────────────────────────────────
  const remove = (key) => {
    try { localStorage.removeItem(PREFIX + key); return true; }
    catch (e) { console.warn(`[Storage] remove("${key}"):`, e.message); return false; }
  };

  // ── clear all app keys ─────────────────────────────────
  const clear = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) { return false; }
  };

  // ── exportAll ──────────────────────────────────────────
  const exportAll = () => {
    const data = { _meta: { version: VERSION, exportedAt: new Date().toISOString() } };
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => {
        try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch (_) { data[k.slice(PREFIX.length)] = localStorage.getItem(k); }
      });
    return data;
  };

  // ── importAll ──────────────────────────────────────────
  const importAll = (data) => {
    if (!data || typeof data !== 'object') return 0;
    let count = 0;
    // Strip meta keys before import
    Object.entries(data)
      .filter(([k]) => !k.startsWith('_'))
      .forEach(([key, value]) => { if (set(key, value)) count++; });
    return count;
  };

  // ── getUsage (bytes estimate) ──────────────────────────
  const getUsage = () => {
    try {
      let bytes = 0;
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => { bytes += ((localStorage.getItem(k) || '').length + k.length) * 2; });
      const kb = bytes / 1024;
      const pct = Math.min((kb / 5120) * 100, 100); // ~5MB budget
      return { bytes, kb: kb.toFixed(1), pct: pct.toFixed(1) };
    } catch (_) { return { bytes: 0, kb: '0.0', pct: '0.0' }; }
  };

  // ── init ───────────────────────────────────────────────
  const init = () => { migrate(); };

  return { get, set, remove, clear, exportAll, importAll, getUsage, init };
})();

window.Storage = Storage;
