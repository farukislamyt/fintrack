/**
 * BackupManager v1.0 — Data Backup & Import Management
 * Handles export, import, validation, and recovery of user financial data
 * Provides atomic operations and conflict resolution
 */
const BackupManager = (() => {
  const BACKUP_VERSION = '1.0';
  const MAX_BACKUPS = 5;
  
  // ════════════════════════════════════════════════════════════════
  // BACKUP CREATION
  // ════════════════════════════════════════════════════════════════

  const createBackup = () => {
    try {
      const backup = {
        meta: {
          version: BACKUP_VERSION,
          appVersion: window.APP_CONFIG?.VERSION || '3.1.0',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          locale: navigator.language
        },
        data: Storage.exportAll(),
        stats: {
          transactions: Transactions?.getAll()?.length || 0,
          budgets: Budget?.getAll()?.length || 0,
          goals: Goals?.getAll()?.length || 0,
          loans: Loans?.getAll()?.length || 0,
          storageUsage: Storage.getUsage()
        }
      };

      // Store backup metadata
      const backups = Storage.get('backups', []) || [];
      if (!Array.isArray(backups)) backups.length = 0;
      
      backups.unshift({
        id: Date.now(),
        timestamp: backup.meta.timestamp,
        size: JSON.stringify(backup).length,
        stats: backup.stats
      });

      // Keep only last N backups
      if (backups.length > MAX_BACKUPS) {
        backups.pop();
      }

      Storage.set('backups', backups);
      Logger.info('Backup created', { size: backup.meta.timestamp, count: backups.length });

      return backup;
    } catch (err) {
      Logger.error('Backup creation failed', { error: err.message });
      return null;
    }
  };

  // ════════════════════════════════════════════════════════════════
  // EXPORT OPERATIONS
  // ════════════════════════════════════════════════════════════════

  const export_json = () => {
    try {
      const backup = createBackup();
      if (!backup) {
        Logger.error('Export failed - could not create backup');
        return null;
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      Logger.info('Data exported to JSON', { filename: a.download });
      return backup;
    } catch (err) {
      Logger.error('JSON export failed', { error: err.message });
      return null;
    }
  };

  const export_csv = () => {
    try {
      const txns = Transactions?.getAll() || [];
      if (txns.length === 0) {
        Logger.warn('No transactions to export');
        return null;
      }

      let csv = 'Date,Type,Category,Amount,Balance,Description\n';
      txns.forEach(t => {
        const date = new Date(t.date).toISOString().split('T')[0];
        const desc = (t.description || '').replace(/"/g, '""');
        csv += `${date},${t.type},${t.category},${t.amount},${t.balance},"${desc}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      Logger.info('Transactions exported to CSV', { count: txns.length });
      return csv;
    } catch (err) {
      Logger.error('CSV export failed', { error: err.message });
      return null;
    }
  };

  // ════════════════════════════════════════════════════════════════
  // IMPORT WITH VALIDATION
  // ════════════════════════════════════════════════════════════════

  const validate_backup = (backup) => {
    const errors = [];
    const warnings = [];

    // Check structure
    if (!backup.meta) errors.push('Missing backup metadata');
    if (!backup.data) errors.push('Missing backup data');
    if (!backup.meta || !backup.meta.version) errors.push('Invalid backup version');

    // Check version compatibility
    if (backup.meta?.version !== BACKUP_VERSION) {
      warnings.push(`Backup version mismatch (${backup.meta?.version} vs ${BACKUP_VERSION})`);
    }

    // Validate data structure
    if (backup.data) {
      const requiredKeys = ['transactions', 'budget', 'goals', 'loans', 'settings'];
      requiredKeys.forEach(key => {
        if (!(key in backup.data)) {
          warnings.push(`Missing data section: ${key}`);
        }
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  };

  const importFromJSON = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          const validation = validate_backup(backup);

          if (!validation.valid) {
            Logger.error('Invalid backup file', { errors: validation.errors });
            resolve({
              success: false,
              errors: validation.errors,
              warnings: validation.warnings
            });
            return;
          }

          // Ask for confirmation (will be handled by UI)
          resolve({
            success: true,
            backup,
            warnings: validation.warnings,
            stats: backup.stats
          });
        } catch (err) {
          Logger.error('JSON import parsing failed', { error: err.message });
          resolve({
            success: false,
            errors: ['Invalid JSON file format']
          });
        }
      };

      reader.onerror = () => {
        Logger.error('File read failed');
        resolve({
          success: false,
          errors: ['Failed to read file']
        });
      };

      reader.readAsText(file);
    });
  };

  const importBackupData = (backup, merge = false) => {
    try {
      if (!backup || !backup.data) {
        Logger.error('Invalid backup data');
        return { success: false, message: 'Invalid backup' };
      }

      let imported = 0;

      if (merge) {
        // Merge mode - keep existing data & add new items
        const existingTxns = Transactions?.getAll() || [];
        const backupTxns = backup.data.transactions || [];
        const merged = [...existingTxns];
        
        backupTxns.forEach(txn => {
          if (!merged.find(t => t.id === txn.id)) {
            merged.push(txn);
          }
        });
        
        if (merged.length > existingTxns.length) {
          Storage.set('transactions', merged);
          imported += merged.length - existingTxns.length;
        }
      } else {
        // Replace mode - overwrite all data
        imported = Storage.importAll(backup.data);
      }

      // Notify observers
      if (typeof DataSync !== 'undefined') {
        DataSync.notifyObservers('transactions', { type: 'import' });
        DataSync.notifyObservers('dashboard', { type: 'refresh' });
      }

      Logger.info('Data imported successfully', { count: imported, mode: merge ? 'merge' : 'replace' });
      return {
        success: true,
        imported,
        message: `Imported ${imported} records in ${merge ? 'merge' : 'replace'} mode`
      };
    } catch (err) {
      Logger.error('Import failed', { error: err.message });
      return { success: false, message: 'Import failed: ' + err.message };
    }
  };

  // ════════════════════════════════════════════════════════════════
  // BACKUP HISTORY
  // ════════════════════════════════════════════════════════════════

  const getBackupHistory = () => {
    try {
      const backups = Storage.get('backups', []);
      return Array.isArray(backups) ? backups : [];
    } catch (err) {
      Logger.error('Failed to retrieve backup history', { error: err.message });
      return [];
    }
  };

  const clearBackupHistory = () => {
    try {
      Storage.set('backups', []);
      Logger.info('Backup history cleared');
      return true;
    } catch (err) {
      Logger.error('Failed to clear backup history', { error: err.message });
      return false;
    }
  };

  // ════════════════════════════════════════════════════════════════
  // DATA CLEANUP & OPTIMIZATION
  // ════════════════════════════════════════════════════════════════

  const optimizeStorage = () => {
    try {
      let originalSize = 0, optimizedSize = 0;

      // Calculate original
      const usage = Storage.getUsage();
      originalSize = usage.bytes;

      // Remove duplicate transactions
      const txns = Transactions?.getAll() || [];
      const seen = new Set();
      const unique = txns.filter(t => {
        const key = `${t.date}-${t.type}-${t.amount}-${t.category}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (unique.length < txns.length) {
        Storage.set('transactions', unique);
        Logger.info('Removed duplicate transactions', { removed: txns.length - unique.length });
      }

      // Calculate optimized
      const newUsage = Storage.getUsage();
      optimizedSize = newUsage.bytes;

      Logger.info('Storage optimized', {
        before: usage.kb + 'KB',
        after: newUsage.kb + 'KB',
        freed: ((originalSize - optimizedSize) / 1024).toFixed(1) + 'KB'
      });

      return {
        success: true,
        before: originalSize,
        after: optimizedSize,
        freed: originalSize - optimizedSize
      };
    } catch (err) {
      Logger.error('Storage optimization failed', { error: err.message });
      return { success: false };
    }
  };

  return {
    // Backup operations
    createBackup,
    getBackupHistory,
    clearBackupHistory,
    
    // Export operations
    export_json,
    export_csv,
    
    // Import operations
    importFromJSON,
    importBackupData,
    validate_backup,
    
    // Optimization
    optimizeStorage,
    
    // Constants
    BACKUP_VERSION,
    MAX_BACKUPS
  };
})();
