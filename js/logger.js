/**
 * FinTrack Pro — Logger v1.0
 * PRODUCTION GRADE: Comprehensive logging and monitoring
 */
const Logger = (() => {
  const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  const currentLevel = LEVELS.INFO; // Set to DEBUG for development
  const logs = [];
  const maxLogs = 500; // Keep last 500 logs in memory

  const format = (level, message, data) => {
    const timestamp = new Date().toISOString();
    const dataStr = data ? JSON.stringify(data) : '';
    return { timestamp, level, message, data: dataStr };
  };

  const log = (level, levelName, message, data = null) => {
    if (level < currentLevel) return;

    const entry = format(level, message, data);
    logs.push(entry);

    // Keep only last 500 logs
    if (logs.length > maxLogs) {
      logs.shift();
    }

    // Console output in development
    const style = {
      DEBUG: 'color:#7c3aed;font-weight:bold',
      INFO: 'color:#3b82f6;font-weight:bold',
      WARN: 'color:#f5b800;font-weight:bold',
      ERROR: 'color:#f03e5e;font-weight:bold'
    }[levelName];

    const consoleMessage = `%c[${levelName}] ${message}`;
    if (data) {
      console.log(consoleMessage, style, data);
    } else {
      console.log(consoleMessage, style);
    }
  };

  const debug = (message, data) => log(LEVELS.DEBUG, 'DEBUG', message, data);
  const info = (message, data) => log(LEVELS.INFO, 'INFO', message, data);
  const warn = (message, data) => log(LEVELS.WARN, 'WARN', message, data);
  const error = (message, data) => log(LEVELS.ERROR, 'ERROR', message, data);

  const getLogs = () => [...logs];

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    logs.length = 0;
    console.log('%c[Logger] Logs cleared', 'color:#3b82f6;font-weight:bold');
  };

  // Expose to global
  window.Logger = { debug, info, warn, error, getLogs, exportLogs, clear };

  return { debug, info, warn, error, getLogs, exportLogs, clear };
})();
