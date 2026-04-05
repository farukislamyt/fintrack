/**
 * FinTrack Pro — Onboarding v1.0
 * First-time user setup wizard
 */
const Onboarding = (() => {
  const VERSION = '3.0.1';
  const AUTHOR = 'FinTrack Team';
  const LAUNCH_DATE = '2026';

  const hasSeenOnboarding = () => {
    return Storage.get('_onboarding_completed', false);
  };

  const show = () => {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;
    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus on name input
    const nameInput = document.getElementById('onboardingName');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }
  };

  const hide = () => {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const complete = () => {
    const nameInput = document.getElementById('onboardingName')?.value.trim();
    const currencySelect = document.getElementById('onboardingCurrency')?.value;

    if (!nameInput) {
      Utils.toast('Please enter your name', 'error');
      document.getElementById('onboardingName')?.focus();
      return;
    }

    // Save settings
    AppState.settings.userName = nameInput;
    AppState.settings.currency = currencySelect || 'USD';
    Storage.set('settings', AppState.settings);
    Storage.set('_onboarding_completed', true);

    hide();
    
    // Refresh UI
    App.refreshDashboard();
    
    Utils.toast(`Welcome, ${nameInput}! 👋`, 'success');
  };

  const selectCurrency = (code) => {
    document.querySelectorAll('.currency-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.currency === code);
    });
    document.getElementById('onboardingCurrency').value = code;
  };

  const init = () => {
    if (hasSeenOnboarding()) {
      hide();
      return;
    }

    // Show onboarding on first launch
    show();

    // Event listeners
    document.getElementById('onboardingGetStartedBtn')?.addEventListener('click', complete);
    document.getElementById('onboardingName')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') complete();
    });

    document.querySelectorAll('.currency-option').forEach(btn => {
      btn.addEventListener('click', () => {
        selectCurrency(btn.dataset.currency);
      });
    });

    // Set default currency
    selectCurrency('USD');
  };

  return { init, show, hide, complete, hasSeenOnboarding };
})();
window.Onboarding = Onboarding;
