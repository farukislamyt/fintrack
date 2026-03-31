/**
 * FinTrack Storage Module
 * Handles all localStorage operations with fallback
 */

const Storage = (() => {
  const PREFIX = 'fintrack_';

  const get = (key) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage.get error:', e);
      return null;
    }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage.set error:', e);
      return false;
    }
  };

  const remove = (key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.error('Storage.remove error:', e);
    }
  };

  const clear = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('Storage.clear error:', e);
    }
  };

  const exportAll = () => {
    const data = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => {
        try { data[k.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(k)); }
        catch(e) {}
      });
    return data;
  };

  const importAll = (data) => {
    if (typeof data !== 'object') return false;
    Object.entries(data).forEach(([key, value]) => set(key, value));
    return true;
  };

  return { get, set, remove, clear, exportAll, importAll };
})();

window.Storage = Storage;
