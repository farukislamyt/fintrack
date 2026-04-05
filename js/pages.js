/**
 * Pages v1.0 — Professional Static Pages Manager
 * Manages About, Privacy Policy, Terms of Service, Contact, Help & FAQ
 * Provides modal and full-page display modes
 */
const Pages = (() => {
  // ════════════════════════════════════════════════════════════════
  // PAGE CONTENT DEFINITIONS
  // ════════════════════════════════════════════════════════════════

  const pageContent = {
    about: {
      title: 'About FinTrack Pro',
      icon: 'ℹ️',
      content: `
        <div class="page-content">
          <h2>About FinTrack Pro</h2>
          <p class="intro-text">
            FinTrack Pro is a modern, privacy-first personal finance management application 
            designed to help you take control of your financial life.
          </p>

          <section>
            <h3>Our Mission</h3>
            <p>
              We believe everyone deserves powerful financial tools that respect their privacy. 
              FinTrack Pro operates entirely on your device with zero data collection, zero servers, 
              and zero external tracking. Your financial data is YOUR financial data.
            </p>
          </section>

          <section>
            <h3>Key Features</h3>
            <div class="feature-grid">
              <div class="feature-card">
                <strong>💰 Transaction Tracking</strong>
                <p>Track income and expenses with unlimited custom categories</p>
              </div>
              <div class="feature-card">
                <strong>📊 Smart Analytics</strong>
                <p>Visualize spending patterns with beautiful charts and reports</p>
              </div>
              <div class="feature-card">
                <strong>🎯 Budget Planning</strong>
                <p>Set budgets and track progress toward financial goals</p>
              </div>
              <div class="feature-card">
                <strong>🏦 Loan Management</strong>
                <p>Track loans given or taken with payment management</p>
              </div>
              <div class="feature-card">
                <strong>📱 Offline-First</strong>
                <p>Works completely offline - no internet required</p>
              </div>
              <div class="feature-card">
                <strong>🔒 100% Private</strong>
                <p>All data stays on your device, encrypted locally</p>
              </div>
            </div>
          </section>

          <section>
            <h3>Technology</h3>
            <p>
              Built with vanilla JavaScript and modern web standards. FinTrack Pro is a Progressive 
              Web App (PWA) that works on desktop, tablet, and mobile devices.
            </p>
            <ul>
              <li>💻 <strong>Framework:</strong> Vanilla JavaScript (no dependencies)</li>
              <li>📦 <strong>Storage:</strong> Browser localStorage (encrypted)</li>
              <li>📈 <strong>Charts:</strong> Chart.js library</li>
              <li>⚡ <strong>Performance:</strong> Optimized for speed and responsiveness</li>
              <li>🌐 <strong>Platform:</strong> Progressive Web App (PWA)</li>
            </ul>
          </section>

          <section>
            <h3>Development</h3>
            <p>
              FinTrack Pro is actively maintained with regular updates, bug fixes, and new features. 
              The application is designed with modern best practices in mind including accessibility, 
              security, and user experience.
            </p>
            <p>
              Version <strong>${window.APP_CONFIG?.VERSION || '3.1.0'}</strong> · 
              Build <strong>${window.APP_CONFIG?.BUILD_DATE || '2026-04-05'}</strong>
            </p>
          </section>

          <section>
            <h3>License</h3>
            <p>
              ${window.APP_CONFIG?.LICENSE || 'MIT © 2026'}
            </p>
          </section>
        </div>
      `
    },

    privacy: {
      title: 'Privacy Policy',
      icon: '🔒',
      content: `
        <div class="page-content">
          <h2>Privacy Policy</h2>
          <p class="last-updated">Last Updated: April 5, 2026</p>

          <section>
            <h3>1. Data Collection</h3>
            <p>
              <strong>FinTrack Pro collects NO personal data.</strong>
            </p>
            <p>
              All your financial information (transactions, budgets, goals, loans) is stored exclusively 
              on your device in your browser's localStorage. We do not collect, transmit, or store any 
              of your financial data on our servers.
            </p>
          </section>

          <section>
            <h3>2. How Your Data is Stored</h3>
            <ul>
              <li>All data is stored in browser localStorage (local storage only)</li>
              <li>No cloud backup automatically (unless you export)</li>
              <li>No third-party services have access to your data</li>
              <li>No cookies are set for tracking purposes</li>
              <li>No analytics or telemetry collection</li>
            </ul>
          </section>

          <section>
            <h3>3. Data Security</h3>
            <p>
              Since all data remains on your device:
            </p>
            <ul>
              <li>Your data is only as secure as your device's security</li>
              <li>Use device security features (password, PIN, biometric) to protect access</li>
              <li>Regularly export backups to external storage</li>
              <li>Clear data before selling/discarding your device</li>
            </ul>
          </section>

          <section>
            <h3>4. Third-Party Services</h3>
            <p>
              FinTrack Pro uses minimal external resources:
            </p>
            <ul>
              <li>Chart.js (from CDN) - for data visualization</li>
              <li>Google Fonts - for typography</li>
              <li>No analytics platforms (Google Analytics, Mixpanel, etc.)</li>
              <li>No social media tracking</li>
            </ul>
          </section>

          <section>
            <h3>5. What You Export</h3>
            <p>
              When you manually export your data as JSON or CSV:
            </p>
            <ul>
              <li>The file is created on your device</li>
              <li>You control where the file goes (download folder, cloud drive, etc.)</li>
              <li>We have no access to exported files</li>
            </ul>
          </section>

          <section>
            <h3>6. Service Worker (PWA)</h3>
            <p>
              FinTrack Pro uses a service worker to enable offline functionality. 
              This service worker:
            </p>
            <ul>
              <li>Only caches static assets (HTML, CSS, JavaScript)</li>
              <li>Does not transmit any of your financial data</li>
              <li>Is entirely local to your browser</li>
            </ul>
          </section>

          <section>
            <h3>7. Browser Permissions</h3>
            <p>
              FinTrack Pro requests or uses:
            </p>
            <ul>
              <li>💾 <strong>localStorage:</strong> To store your financial data on your device</li>
              <li>📥 <strong>File API:</strong> To import backup files you select</li>
              <li>📤 <strong>Download:</strong> To export your data when you request it</li>
            </ul>
          </section>

          <section>
            <h3>8. Updates & Changes</h3>
            <p>
              This privacy policy may be updated from time to time. The latest version is always 
              available in your app. Significant changes will be noted in app notifications.
            </p>
          </section>

          <section>
            <h3>9. Contact</h3>
            <p>
              Have privacy questions? Email us at: <strong>${window.APP_CONFIG?.EMAIL || 'support@fintrackpro.com'}</strong>
            </p>
          </section>
        </div>
      `
    },

    terms: {
      title: 'Terms of Service',
      icon: '⚖️',
      content: `
        <div class="page-content">
          <h2>Terms of Service</h2>
          <p class="last-updated">Last Updated: April 5, 2026</p>

          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By using FinTrack Pro, you agree to these Terms of Service. If you do not agree, 
              do not use the application.
            </p>
          </section>

          <section>
            <h3>2. Use License</h3>
            <p>
              FinTrack Pro is licensed to you for personal, non-commercial use. You may:
            </p>
            <ul>
              <li>✓ Use FinTrack Pro to manage your personal finances</li>
              <li>✓ Export your data in JSON or CSV format</li>
              <li>✓ Create backups of your financial data</li>
              <li>✓ Use offline with no internet connection</li>
            </ul>
            <p>You may NOT:</p>
            <ul>
              <li>✗ Reverse engineer or decompile the application</li>
              <li>✗ Use the app for commercial purposes without permission</li>
              <li>✗ Resell, redistribute, or modify FinTrack Pro</li>
              <li>✗ Use it to process financial data on behalf of others for profit</li>
            </ul>
          </section>

          <section>
            <h3>3. Data Ownership</h3>
            <p>
              <strong>You own all of your financial data.</strong>
            </p>
            <p>
              We do not claim any ownership of the data you enter into FinTrack Pro. 
              You are free to export it at any time in standard formats (JSON, CSV).
            </p>
          </section>

          <section>
            <h3>4. Disclaimer of Warranties</h3>
            <p>
              FinTrack Pro is provided "AS IS" without any warranties:
            </p>
            <ul>
              <li>No warranty of accuracy or completeness</li>
              <li>No warranty of fitness for a particular purpose</li>
              <li>No warranty of error-free operation</li>
              <li>No warranty of uninterrupted service</li>
            </ul>
          </section>

          <section>
            <h3>5. Limitation of Liability</h3>
            <p>
              In no event shall we be liable for:
            </p>
            <ul>
              <li>Loss of financial data</li>
              <li>Financial decisions made based on the app</li>
              <li>Device damage or data loss</li>
              <li>Any indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section>
            <h3>6. Backup Responsibility</h3>
            <p>
              Since FinTrack Pro stores data only on your device, <strong>you are responsible 
              for creating regular backups.</strong> We recommend:
            </p>
            <ul>
              <li>Export data weekly to external storage</li>
              <li>Keep encrypted backups in safe places</li>
              <li>Never rely on a single copy of your data</li>
              <li>Test your backups to ensure they work</li>
            </ul>
          </section>

          <section>
            <h3>7. Browser Compatibility</h3>
            <p>
              FinTrack Pro works on modern browsers supporting:
            </p>
            <ul>
              <li>ES6+ JavaScript</li>
              <li>localStorage API</li>
              <li>Service Workers</li>
              <li>CSS Grid and Flexbox</li>
            </ul>
            <p>
              We recommend keeping your browser updated to the latest version.
            </p>
          </section>

          <section>
            <h3>8. Changes to Terms</h3>
            <p>
              We may update these terms at any time. Your continued use of FinTrack Pro 
              means you accept the updated terms.
            </p>
          </section>

          <section>
            <h3>9. Governing Law</h3>
            <p>
              These terms are governed by applicable laws. Any disputes shall be resolved 
              through mutual agreement.
            </p>
          </section>
        </div>
      `
    },

    help: {
      title: 'Help & FAQ',
      icon: '❓',
      content: `
        <div class="page-content">
          <h2>Help & Frequently Asked Questions</h2>

          <section>
            <h3>Getting Started</h3>
            <div class="faq-item">
              <strong>Q: How do I add a transaction?</strong>
              <p>
                Click the "Transactions" page → Click "Add Transaction" button → 
                Select type (income/expense), choose category, enter amount, description, 
                and date → Click Save.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Can I edit or delete transactions?</strong>
              <p>
                Yes! Go to Transactions → Every transaction has edit (✏️) and delete (🗑️) buttons. 
                Click them to modify or remove. Changes take effect immediately.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: How do I set a budget?</strong>
              <p>
                Go to Budget page → Click "Add Budget" → Select category, set your monthly limit → 
                Save. You'll see progress bars showing spending vs budget.
              </p>
            </div>
          </section>

          <section>
            <h3>Data Management</h3>
            <div class="faq-item">
              <strong>Q: Where is my data stored?</strong>
              <p>
                All your data is stored in your browser's localStorage on your device. 
                Nothing goes to any server. It's completely offline and private.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: How do I backup my data?</strong>
              <p>
                Settings → Data Management → Click "↓ JSON" to download your complete backup 
                as a JSON file. Keep this file safe! You can also export as CSV for spreadsheet use.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: How do I restore from a backup?</strong>
              <p>
                Settings → Data Management → Click "↑ Import" → Select your JSON backup file → 
                Choose "Replace" or "Merge" mode → Confirm. Data restores instantly.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: What's the difference between "Replace" and "Merge" import mode?</strong>
              <p>
                <strong>Replace:</strong> Overwrites all current data with the backup. Use to restore completely.
                <br/>
                <strong>Merge:</strong> Keeps your current data and adds new items from backup. Use to add old data back.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: How much data can I store?</strong>
              <p>
                Most browsers allow ~5-10 MB per domain. FinTrack Pro stores data efficiently, 
                so you can store years of financial data. Check Settings → Storage Info for usage.
              </p>
            </div>
          </section>

          <section>
            <h3>Features & Usage</h3>
            <div class="faq-item">
              <strong>Q: Can I change the currency?</strong>
              <p>
                Yes! Settings → Display Settings → Currency Select → Choose your currency. 
                This is visual only; change does not affect existing transaction amounts.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: How do I use the Goals feature?</strong>
              <p>
                Goals → Click "Add Goal" → Set goal name, target amount, and deadline → Save. 
                Track your progress as you contribute. Completed goals can be marked as achieved.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: How do loans work?</strong>
              <p>
                Loans → Click "Add Loan" → Choose if you're lending or borrowing → Enter person name, 
                amount, date → Save. You can then add payments and track remaining balance.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Can I customize categories?</strong>
              <p>
                Yes! Settings → Categories → Add or remove custom income/expense categories. 
                Categories help organize your transactions.
              </p>
            </div>
          </section>

          <section>
            <h3>Display & Theme</h3>
            <div class="faq-item">
              <strong>Q: How do I switch between light and dark themes?</strong>
              <p>
                Settings → Theme & Appearance → Choose Light, Dark, or Auto (follows OS preference). 
                Changes apply instantly.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Does FinTrack Pro work offline?</strong>
              <p>
                Yes! All features work completely offline. Once you visit the app once, 
                it's cached and works without internet. Perfect for travel!
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Can I install FinTrack Pro as an app?</strong>
              <p>
                Yes! FinTrack Pro is a Progressive Web App (PWA). On most browsers, 
                click "Install" in the address bar, or use your browser's "Add to Home Screen" option.
              </p>
            </div>
          </section>

          <section>
            <h3>Troubleshooting</h3>
            <div class="faq-item">
              <strong>Q: Data disappeared! What happened?</strong>
              <p>
                Check if you're browsing in private/incognito mode—data doesn't persist there. 
                Clear browser cache only clears app files, not localStorage. If data is truly gone, 
                restore from your backup JSON file.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Storage is full. What can I do?</strong>
              <p>
                Settings → Advanced → Click "Optimize Storage" to remove duplicates. Or export old 
                transactions to CSV and delete them to free space. Maintain regular backups!
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Transactions aren't syncing across my devices.</strong>
              <p>
                FinTrack Pro stores data only on each device independently. To sync between devices, 
                export your backup from one device and import it on another.
              </p>
            </div>

            <div class="faq-item">
              <strong>Q: Is my data encrypted?</strong>
              <p>
                Your data is encrypted by your browser's localStorage system. For additional security, 
                store exported JSON backups in password-protected cloud storage or encrypted drives.
              </p>
            </div>
          </section>

          <section>
            <h3>Still need help?</h3>
            <p>
              Contact us at: <strong>${window.APP_CONFIG?.EMAIL || 'support@fintrackpro.com'}</strong>
            </p>
            <p>
              Or check the other pages: About, Privacy Policy, Terms of Service, and Contact.
            </p>
          </section>
        </div>
      `
    },

    contact: {
      title: 'Contact Us',
      icon: '✉️',
      content: `
        <div class="page-content">
          <h2>Contact & Support</h2>

          <section>
            <h3>Get in Touch</h3>
            <p>
              Have a question, suggestion, or found a bug? We'd love to hear from you!
            </p>

            <div class="contact-methods">
              <div class="contact-card">
                <strong>📧 Email</strong>
                <p>
                  <a href="mailto:${window.APP_CONFIG?.EMAIL || 'support@fintrackpro.com'}">
                    ${window.APP_CONFIG?.EMAIL || 'support@fintrackpro.com'}
                  </a>
                </p>
              </div>

              <div class="contact-card">
                <strong>🤔 Report a Bug</strong>
                <p>
                  Found an issue? Email us with:
                  <ul>
                    <li>Description of the problem</li>
                    <li>Steps to reproduce</li>
                    <li>Your browser and OS</li>
                    <li>Logs (Settings → Advanced → View Logs)</li>
                  </ul>
                </p>
              </div>

              <div class="contact-card">
                <strong>💡 Feature Request</strong>
                <p>
                  Have an idea? We consider all feature requests. Email us with your suggestion 
                  and explain how it would help you manage finances better.
                </p>
              </div>

              <div class="contact-card">
                <strong>🤝 Partnerships</strong>
                <p>
                  Interested in partnering with FinTrack Pro? 
                  <a href="mailto:${window.APP_CONFIG?.EMAIL || 'support@fintrackpro.com'}?subject=Partnership">
                    Tell us more</a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3>Response Time</h3>
            <p>
              We aim to respond to all inquiries within 48 hours. For technical issues, 
              provide as much detail as possible to speed up resolution.
            </p>
          </section>

          <section>
            <h3>Follow Updates</h3>
            <p>
              Check the app regularly for updates. New features and improvements are released continuously.
            </p>
            <p>
              <strong>Current Version:</strong> ${window.APP_CONFIG?.VERSION || '3.1.0'}<br/>
              <strong>Build Date:</strong> ${window.APP_CONFIG?.BUILD_DATE || '2026-04-05'}
            </p>
          </section>

          <section>
            <h3>Made with ❤️</h3>
            <p>
              FinTrack Pro is developed with passion by the ${window.APP_CONFIG?.DEVELOPER || 'FinTrack Team'} 
              to provide the best personal finance management experience.
            </p>
          </section>
        </div>
      `
    }
  };

  // ════════════════════════════════════════════════════════════════
  // PAGE RENDERING
  // ════════════════════════════════════════════════════════════════

  const render = (pageKey) => {
    const page = pageContent[pageKey];
    if (!page) {
      Logger.error('Page not found', { pageKey });
      return false;
    }

    const main = document.querySelector('main');
    if (!main) {
      Logger.error('Main element not found');
      return false;
    }

    // Hide all pages first
    document.querySelectorAll('[data-page]').forEach(el => {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
    });

    // Show the requested page
    const pageEl = document.querySelector(`[data-page="${pageKey}"]`);
    if (pageEl) {
      pageEl.hidden = false;
      pageEl.setAttribute('aria-hidden', 'false');
      window.scrollTo(0, 0);
      Logger.info('Page rendered', { page: pageKey });
      return true;
    }

    Logger.error('Page element not found', { pageKey });
    return false;
  };

  const showModal = (pageKey) => {
    const page = pageContent[pageKey];
    if (!page) {
      Logger.error('Page modal not found', { pageKey });
      return false;
    }

    try {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal modal-page">
          <div class="modal-header">
            <h2>${page.icon} ${page.title}</h2>
            <button class="modal-close" aria-label="Close">${page.icon === '✉️' ? '✕' : '✕'}</button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            ${page.content}
          </div>
          <div class="modal-footer">
            <button class="btn-primary modal-close-btn">Close</button>
          </div>
        </div>
      `;

      modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
      modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      document.body.appendChild(modal);
      Logger.info('Page modal opened', { page: pageKey });
      return true;
    } catch (err) {
      Logger.error('Failed to show modal', { pageKey, error: err.message });
      return false;
    }
  };

  // ════════════════════════════════════════════════════════════════
  // NAVIGATION & LINKS
  // ════════════════════════════════════════════════════════════════

  const getPageList = () => {
    return Object.keys(pageContent).map(key => ({
      key,
      title: pageContent[key].title,
      icon: pageContent[key].icon
    }));
  };

  const init = () => {
    // Add click handlers for page links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-page-link]');
      if (!link) return;

      const pageKey = link.dataset.pageLink;
      const mode = link.dataset.mode || 'page';

      if (mode === 'modal') {
        showModal(pageKey);
      } else {
        // Navigate to page using app router
        if (typeof Nav !== 'undefined' && Nav.goTo) {
          Nav.goTo('pages');
          setTimeout(() => render(pageKey), 100);
        } else {
          render(pageKey);
        }
      }

      e.preventDefault();
    });

    Logger.info('Pages module initialized', { pages: Object.keys(pageContent).length });
  };

  return {
    // Rendering
    render,
    showModal,
    getPageList,
    pageContent,

    // Lifecycle
    init
  };
})();
