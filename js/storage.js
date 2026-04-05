/**
 * FinTrack Pro — Storage v3.0
 * Fixed: proper key prefixing, v1 migration, quota handling
 */
const Storage = (() => {
  const PREFIX  = 'ftp_';
  const VER_KEY = '_ftp_ver';
  const VERSION = '3';

  const migrate = () => {
    try {
      if (localStorage.getItem(VER_KEY) === VERSION) return;
      ['fintrack_'].forEach(old => {
        Object.keys(localStorage).filter(k => k.startsWith(old)).forEach(k => {
          const nk = PREFIX + k.slice(old.length);
          if (!localStorage.getItem(nk)) localStorage.setItem(nk, localStorage.getItem(k));
        });
      });
      localStorage.setItem(VER_KEY, VERSION);
    } catch (_) {}
  };

  const get = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[Storage] get:', key, e.message);
      return fallback;
    }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        setTimeout(() => { if (window.Utils) Utils.toast('Storage full! Export data to free space.', 'error', 7000); }, 100);
      }
      console.warn('[Storage] set:', key, e.message);
      return false;
    }
  };

  const remove = (key) => {
    try { localStorage.removeItem(PREFIX + key); return true; } catch (_) { return false; }
  };

  const clear = () => {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
      return true;
    } catch (_) { return false; }
  };

  const exportAll = () => {
    const data = { _meta: { version: VERSION, exportedAt: new Date().toISOString() } };
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => {
      try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch (_) {}
    });
    return data;
  };

  const importAll = (data) => {
    if (!data || typeof data !== 'object') return 0;
    let n = 0;
    Object.entries(data).filter(([k]) => !k.startsWith('_')).forEach(([k, v]) => { if (set(k, v)) n++; });
    return n;
  };

  const getUsage = () => {
    try {
      let bytes = 0;
      Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
        .forEach(k => { bytes += ((localStorage.getItem(k) || '').length + k.length) * 2; });
      const kb = bytes / 1024;
      return { bytes, kb: kb.toFixed(1), pct: Math.min((kb / 5120) * 100, 100).toFixed(1) };
    } catch (_) { return { bytes: 0, kb: '0.0', pct: '0.0' }; }
  };

  const init = () => { migrate(); };
  return { get, set, remove, clear, exportAll, importAll, getUsage, init };
})();
window.Storage = Storage;
