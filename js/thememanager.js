/**
 * ThemeManager v1.0 — Intelligent Theme Management
 * Handles system preference detection, theme persistence, and smooth transitions
 * Supports automatic, light, and dark themes with accessibility improvements
 */
const ThemeManager = (() => {
  const THEME_KEY = 'theme_preference';
  const SYSTEM_DARK = '(prefers-color-scheme: dark)';
  const SYSTEM_LIGHT = '(prefers-color-scheme: light)';
  
  // ════════════════════════════════════════════════════════════════
  // INITIALIZATION & DETECTION
  // ════════════════════════════════════════════════════════════════

  const detectSystemTheme = () => {
    if (window.matchMedia) {
      if (window.matchMedia(SYSTEM_DARK).matches) return 'dark';
      if (window.matchMedia(SYSTEM_LIGHT).matches) return 'light';
    }
    // Fallback to dark theme
    return 'dark';
  };

  const getSavedTheme = () => {
    try {
      return Storage.get('themePreference') || 'auto';
    } catch (err) {
      Logger.warn('Failed to retrieve saved theme', { error: err.message });
      return 'auto';
    }
  };

  const getEffectiveTheme = (preference) => {
    if (preference === 'auto') {
      return detectSystemTheme();
    }
    return preference;
  };

  // ════════════════════════════════════════════════════════════════
  // THEME APPLICATION
  // ════════════════════════════════════════════════════════════════

  const applyTheme = (theme) => {
    try {
      const effective = getEffectiveTheme(theme);
      const html = document.documentElement;
      
      // Add transition class for smooth changes
      html.classList.add('theme-transitioning');
      
      // Apply data attribute
      html.setAttribute('data-theme', effective);
      
      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const color = effective === 'dark' ? '#07090f' : '#ffffff';
        metaThemeColor.setAttribute('content', color);
      }

      // Update color-scheme meta
      const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
      if (metaColorScheme) {
        metaColorScheme.setAttribute('content', `${effective} light`);
      }

      // Remove transition class after animation
      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 300);

      Logger.debug('Theme applied', { preference: theme, effective });
      return true;
    } catch (err) {
      Logger.error('Theme application failed', { error: err.message });
      return false;
    }
  };

  const setTheme = (theme) => {
    if (!['auto', 'light', 'dark'].includes(theme)) {
      Logger.error('Invalid theme value', { theme });
      return false;
    }

    try {
      Storage.set('themePreference', theme);
      applyTheme(theme);
      
      // Notify observers
      if (typeof DataSync !== 'undefined') {
        DataSync.notifyObservers('theme', { type: 'changed', theme });
      }

      Logger.info('Theme changed', { theme });
      return true;
    } catch (err) {
      Logger.error('Theme change failed', { error: err.message });
      return false;
    }
  };

  const toggleTheme = () => {
    const current = getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    return setTheme(next);
  };

  // ════════════════════════════════════════════════════════════════
  // SYSTEM PREFERENCE MONITORING
  // ════════════════════════════════════════════════════════════════

  const setupSystemPreferenceListener = () => {
    try {
      if (!window.matchMedia) return;

      const darkModeQuery = window.matchMedia(SYSTEM_DARK);
      
      darkModeQuery.addEventListener('change', (e) => {
        const savedTheme = getSavedTheme();
        // Only apply system change if theme is set to 'auto'
        if (savedTheme === 'auto') {
          const newTheme = e.matches ? 'dark' : 'light';
          applyTheme('auto');
          Logger.info('System theme changed', { detected: newTheme });
        }
      });

      Logger.debug('System theme preference listener enabled');
    } catch (err) {
      Logger.warn('System preference listener setup failed', { error: err.message });
    }
  };

  // ════════════════════════════════════════════════════════════════
  // CSS CUSTOM PROPERTIES ADJUSTMENT
  // ════════════════════════════════════════════════════════════════

  const adjustContrast = (level = 'normal') => {
    // level: 'normal', 'high', 'extra'
    try {
      const root = document.documentElement;
      const values = {
        normal: { opacity: '1', saturation: '100%' },
        high: { opacity: '0.95', saturation: '120%' },
        extra: { opacity: '0.9', saturation: '140%' }
      };

      const val = values[level] || values.normal;
      root.style.setProperty('--contrast-opacity', val.opacity);
      root.style.setProperty('--contrast-saturation', val.saturation);

      Logger.debug('Contrast adjusted', { level });
      return true;
    } catch (err) {
      Logger.warn('Contrast adjustment failed', { error: err.message });
      return false;
    }
  };

  const enableReducedMotion = (enable = true) => {
    try {
      const root = document.documentElement;
      if (enable) {
        root.style.setProperty('--t-fast', '0ms');
        root.style.setProperty('--t-base', '50ms');
        root.style.setProperty('--t-slow', '100ms');
      } else {
        root.style.removeProperty('--t-fast');
        root.style.removeProperty('--t-base');
        root.style.removeProperty('--t-slow');
      }

      Logger.debug('Reduced motion', { enabled: enable });
      return true;
    } catch (err) {
      Logger.warn('Reduced motion setting failed', { error: err.message });
      return false;
    }
  };

  const respects_prefers_reduced_motion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // ════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════════════════════

  const init = () => {
    try {
      const savedTheme = getSavedTheme();
      applyTheme(savedTheme);
      setupSystemPreferenceListener();

      // Apply accessibility preferences
      if (respects_prefers_reduced_motion()) {
        enableReducedMotion(true);
      }

      Logger.info('ThemeManager initialized', { theme: savedTheme });
      return true;
    } catch (err) {
      Logger.error('ThemeManager initialization failed', { error: err.message });
      return false;
    }
  };

  return {
    // Theme management
    init,
    setTheme,
    getTheme: getSavedTheme,
    getEffectiveTheme,
    toggleTheme,
    applyTheme,
    detectSystemTheme,
    
    // Accessibility
    adjustContrast,
    enableReducedMotion,
    respects_prefers_reduced_motion,
    
    // Constants
    THEME_KEY
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}
