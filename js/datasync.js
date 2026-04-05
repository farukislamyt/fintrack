/**
 * DataSync v1.0 — Real-time Data Synchronization
 * Manages instant data updates across all modules with no delay
 * Coordinates storage writes, event broadcasts, and UI refreshes
 */
const DataSync = (() => {
  const observers = {};
  const SYNC_KEYS = ['transactions', 'budget', 'goals', 'loans', 'settings'];
  
  // ════════════════════════════════════════════════════════════════
  // EVENT SYSTEM - Subscribe to data changes
  // ════════════════════════════════════════════════════════════════
  
  const subscribe = (key, callback) => {
    if (!observers[key]) observers[key] = [];
    observers[key].push(callback);
    
    return () => {
      // Unsubscribe function
      observers[key] = observers[key].filter(cb => cb !== callback);
    };
  };

  const notifyObservers = (key, data) => {
    if (observers[key]) {
      observers[key].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          Logger.error('Observer notification failed', { key, error: err.message });
        }
      });
    }
  };

  // ════════════════════════════════════════════════════════════════
  // SYNC OPERATIONS - Write to storage and notify instantly
  // ════════════════════════════════════════════════════════════════

  const syncTransaction = (txn) => {
    if (typeof Transactions === 'undefined') return false;
    const success = Storage.set('transactions', Transactions.getAll());
    if (success) {
      notifyObservers('transactions', { type: 'update', data: Transactions.getAll() });
      notifyObservers('dashboard', { type: 'refresh' });
      Logger.debug('Transaction synced', { txnId: txn.id });
    }
    return success;
  };

  const syncBudget = () => {
    if (typeof Budget === 'undefined') return false;
    const success = Storage.set('budget', Budget.getAll());
    if (success) {
      notifyObservers('budget', { type: 'update' });
      Logger.debug('Budget synced');
    }
    return success;
  };

  const syncGoal = () => {
    if (typeof Goals === 'undefined') return false;
    const success = Storage.set('goals', Goals.getAll());
    if (success) {
      notifyObservers('goals', { type: 'update' });
      Logger.debug('Goals synced');
    }
    return success;
  };

  const syncLoan = () => {
    if (typeof Loans === 'undefined') return false;
    const success = Storage.set('loans', Loans.getAll());
    if (success) {
      notifyObservers('loans', { type: 'update' });
      notifyObservers('dashboard', { type: 'refresh' });
      Logger.debug('Loans synced');
    }
    return success;
  };

  const syncSettings = () => {
    const success = Storage.set('settings', AppState.settings);
    if (success) {
      notifyObservers('settings', { type: 'update' });
      Logger.debug('Settings synced');
    }
    return success;
  };

  // ════════════════════════════════════════════════════════════════
  // BATCH OPERATIONS - Sync multiple modules at once
  // ════════════════════════════════════════════════════════════════

  const batchSync = (keys) => {
    const results = {};
    keys.forEach(key => {
      switch (key) {
        case 'transactions':
          results.transactions = syncTransaction({});
          break;
        case 'budget':
          results.budget = syncBudget();
          break;
        case 'goals':
          results.goals = syncGoal();
          break;
        case 'loans':
          results.loans = syncLoan();
          break;
        case 'settings':
          results.settings = syncSettings();
          break;
      }
    });
    return results;
  };

  const syncAll = () => {
    Logger.info('Syncing all data modules');
    return batchSync(SYNC_KEYS);
  };

  // ════════════════════════════════════════════════════════════════
  // AUTO-SYNC - Periodic synchronization for data integrity
  // ════════════════════════════════════════════════════════════════

  let syncInterval = null;
  
  const startAutoSync = (intervalMs = 5000) => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
      try {
        syncAll();
      } catch (err) {
        Logger.error('Auto-sync failed', { error: err.message });
      }
    }, intervalMs);
    Logger.info('Auto-sync started', { interval: intervalMs });
  };

  const stopAutoSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
      Logger.info('Auto-sync stopped');
    }
  };

  // ════════════════════════════════════════════════════════════════
  // CONFLICT RESOLUTION - Handle sync conflicts
  // ════════════════════════════════════════════════════════════════

  const resolveConflict = (key, localData, remoteData) => {
    // Timestamp-based conflict resolution
    const localTs = localData._lastModified || 0;
    const remoteTs = remoteData._lastModified || 0;
    
    if (remoteTs > localTs) {
      Logger.warn('Sync conflict resolved - remote wins', { key });
      return remoteData;
    }
    Logger.warn('Sync conflict resolved - local wins', { key });
    return localData;
  };

  return {
    // Event system
    subscribe,
    notifyObservers,
    
    // Individual syncs
    syncTransaction,
    syncBudget,
    syncGoal,
    syncLoan,
    syncSettings,
    
    // Batch operations
    batchSync,
    syncAll,
    
    // Auto-sync
    startAutoSync,
    stopAutoSync,
    
    // Conflict resolution
    resolveConflict
  };
})();
