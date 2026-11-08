/**
 * Mani Mobile Services - Main Application Controller
 * Handles UI interactions, tabs, invoice creation, dashboard metrics, search/filtering, UPI QR generation, and modal actions
 */

let activeInvoiceId = null;
let currentEditingInvoiceId = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Setup popstate & pageshow guards to prevent browser back button from restoring dashboard
  window.addEventListener('popstate', (e) => {
    if (!window.storage.isAuthenticated()) {
      window.history.pushState({ auth: false, locked: true }, '', window.location.pathname);
      checkAuth();
    }
  });

  window.addEventListener('pageshow', (e) => {
    checkAuth();
  });

  // Check auth
  checkAuth();

  // Load business branding into header
  updateBrandingDisplay();

  // Setup tab routing
  setupNavigation();

  // Load initial view (Dashboard or New Invoice)
  if (window.storage.isAuthenticated()) {
    switchTab('dashboard');
  }

  // Setup form event listeners
  setupInvoiceForm();

  // Setup search listeners
  setupHistoryFilters();

  // Setup settings form
  setupSettingsForm();

  // Global keyboard shortcuts (Ctrl+N or Alt+N for New Invoice)
  document.addEventListener('keydown', (e) => {
    if (!window.storage.isAuthenticated()) return;
    if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      switchTab('new-invoice');
    }
  });
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-3 text-white opacity-70 hover:opacity-100 font-bold" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
};

// -------------------------------------------------------------
// AUTHENTICATION & LOGIN / LOGOUT
// -------------------------------------------------------------
function checkAuth() {
  const authModal = document.getElementById('auth-modal');
  const logoutBtn = document.getElementById('logout-btn');
  const isAuth = window.storage.isAuthenticated();

  if (!isAuth) {
    if (authModal) {
      authModal.classList.remove('hidden');
      const pinInput = document.getElementById('pin-input');
      if (pinInput) {
        setTimeout(() => pinInput.focus(), 150);
      }
    }
    if (logoutBtn) logoutBtn.classList.add('hidden');
  } else {
    if (authModal) authModal.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  }
}

function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (window.storage.login(pin)) {
    if (pinInput) pinInput.value = '';
    if (errorMsg) errorMsg.classList.add('hidden');
    document.getElementById('auth-modal').classList.add('hidden');
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    window.showToast('Login successful! Welcome to Mani Mobile Services.', 'success');
    switchTab('dashboard');
  } else {
    if (errorMsg) errorMsg.classList.remove('hidden');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }
}

// LOGOUT WORKFLOW
window.promptLogout = function() {
  const confirmModal = document.getElementById('logout-confirm-modal');
  if (confirmModal) {
    confirmModal.classList.remove('hidden');
  } else {
    if (confirm('Are you sure you want to logout?')) {
      window.executeLogout();
    }
  }
};

window.cancelLogoutPrompt = function() {
  const confirmModal = document.getElementById('logout-confirm-modal');
  if (confirmModal) {
    confirmModal.classList.add('hidden');
  }
};

window.executeLogout = function() {
  window.cancelLogoutPrompt();
  window.closeInvoiceModal();

  // 1. Clear session and tokens
  window.storage.logout();

  // 2. Prevent browser Back button from restoring dashboard
  window.history.pushState({ auth: false, locked: true }, '', window.location.pathname);

  // 3. Lock UI immediately
  checkAuth();

  // 4. Show success toast
  window.showToast('You have been logged out successfully.', 'info');
};

// Legacy alias
function handleLogout() {
  window.promptLogout();
}

// -------------------------------------------------------------
// BRANDING DISPLAY
// -------------------------------------------------------------
function updateBrandingDisplay() {
  const settings = window.storage.getSettings();
  const titleEls = document.querySelectorAll('.shop-name-display');
  const taglineEls = document.querySelectorAll('.shop-tagline-display');
  const phoneEls = document.querySelectorAll('.shop-phone-display');

  titleEls.forEach(el => el.innerText = settings.businessName || 'MANI MOBILE SERVICES');
  taglineEls.forEach(el => el.innerText = settings.tagline || 'Mobile Repair & Service');
  phoneEls.forEach(el => el.innerText = settings.phone || '');
}

// -------------------------------------------------------------
// NAVIGATION & TABS
// -------------------------------------------------------------
function setupNavigation() {
  const navButtons = document.querySelectorAll('[data-tab-target]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab-target');
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  // Prevent accessing protected dashboard pages if not logged in
  if (!window.storage.isAuthenticated()) {
    checkAuth();
    return;
  }

  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });

  // Remove active styling on nav items
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    btn.classList.remove('nav-active', 'bg-blue-800', 'text-white');
    btn.classList.add('text-blue-100', 'hover:bg-blue-800/50');
  });

  // Show active tab
  const activeSection = document.getElementById(`tab-${tabId}`);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Activate nav buttons for this tab
  document.querySelectorAll(`[data-tab-target="${tabId}"]`).forEach(btn => {
    btn.classList.add('nav-active', 'bg-blue-800', 'text-white');
    btn.classList.remove('text-blue-100');
  });

  // Tab specific refreshes
  if (tabId === 'dashboard') {
    renderDashboard();
  } else if (tabId === 'history') {
    renderHistoryTable();
  } else if (tabId === 'services') {
    window.serviceManager.renderServicesTable('services-table-body');
  } else if (tabId === 'settings') {
    loadSettingsIntoForm();
  } else if (tabId === 'new-invoice') {
    if (!currentEditingInvoiceId) {
      resetInvoiceForm();
    }
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// DASHBOARD VIEW & RECENT INVOICES (CLICK TO OPEN INVOICE)
// -------------------------------------------------------------
function renderDashboard() {
  const invoices = window.storage.getInvoices();
  const settings = window.storage.getSettings();
  const sym = settings.currency || '₹';

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate metrics
  let todayCount = 0;
  let todayRevenue = 0;
  let pendingBalance = 0;
  let completedCount = 0;

  invoices.forEach(inv => {
    if (inv.date === todayStr) {
      todayCount++;
      todayRevenue += parseFloat(inv.amountPaid || 0);
    }
    if (inv.status === 'Paid') {
      completedCount++;
    }
    if (inv.balance > 0) {
      pendingBalance += parseFloat(inv.balance || 0);
    }
  });

  // Update card elements
  document.getElementById('stat-today-invoices').innerText = todayCount;
  document.getElementById('stat-today-revenue').innerText = `${sym}${todayRevenue.toLocaleString('en-IN')}`;
  document.getElementById('stat-pending-payments').innerText = `${sym}${pendingBalance.toLocaleString('en-IN')}`;
  document.getElementById('stat-completed-services').innerText = completedCount;

  // Render Recent Invoices (up to 8)
  const recentContainer = document.getElementById('recent-invoices-body');
  const recentInvoices = invoices.slice(0, 8);

  if (recentInvoices.length === 0) {
    recentContainer.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-10 text-center text-sm text-gray-500">
          No invoices created yet. Click "+ Create New Invoice" to start!
        </td>
      </tr>
    `;
    return;
  }

  recentContainer.innerHTML = recentInvoices.map(inv => {
    const brandModel = [inv.device?.brand, inv.device?.model].filter(Boolean).join(' ') || 'Device';
    const statusClass = inv.status === 'Paid' 
      ? 'status-badge-paid' 
      : inv.status === 'Partially Paid' 
        ? 'status-badge-partial' 
        : 'status-badge-pending';

    const servicesSummary = (inv.services || []).map(s => s.name).join(', ') || 'Service';

    // Entire <tr> is clickable to view invoice!
    return `
      <tr class="hover:bg-blue-50/70 transition border-b border-gray-100 cursor-pointer group" onclick="viewInvoiceModal('${inv.id}')" title="Click to view full invoice details">
        <td class="px-4 py-3.5 whitespace-nowrap">
          <button type="button" onclick="event.stopPropagation(); viewInvoiceModal('${inv.id}')" class="font-mono font-black text-blue-700 group-hover:text-blue-900 group-hover:underline text-left">
            ${inv.invoiceNumber}
          </button>
          <span class="block text-xs text-gray-400 font-medium">${window.invoiceService.formatDate(inv.date)}</span>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <div class="font-bold text-gray-900 group-hover:text-blue-800 transition">${inv.customer.name}</div>
          <div class="text-xs text-gray-500 font-mono">${inv.customer.phone || 'N/A'}</div>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-semibold text-gray-800">${brandModel}</div>
          <div class="text-xs text-gray-500 truncate max-w-[200px]" title="${escapeHtml(servicesSummary)}">${servicesSummary}</div>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap font-black text-gray-900">
          ${sym}${inv.total.toLocaleString('en-IN')}
          ${inv.balance > 0 ? `<div class="text-xs text-red-500 font-bold">Bal: ${sym}${inv.balance.toLocaleString('en-IN')}</div>` : ''}
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <span class="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusClass}">
            ${inv.status}
          </span>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap text-right text-xs font-medium space-x-1" onclick="event.stopPropagation()">
          <button onclick="viewInvoiceModal('${inv.id}')" title="Open Full Invoice" class="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold transition">
            View
          </button>
          <button onclick="quickPrint('${inv.id}')" title="Direct Print" class="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded transition">
            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          </button>
          <button onclick="quickDownloadPDF('${inv.id}')" title="Download PDF" class="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded transition">
            <svg class="w-4 h-4 inline text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </button>
          <button onclick="quickSendWhatsApp('${inv.id}')" title="Send WhatsApp PDF" class="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition">
            <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.088-.177.184-.076.358.101.174.45 1.488 1.579 2.096.347.188.623.262.839.332.217.072.347.058.477-.087.13-.145.564-.653.714-.884.15-.231.299-.188.491-.116.188.072 1.2.566 1.403.667.202.101.332.159.376.246.043.086.043.506-.101.911z"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// INVOICE FORM & DYNAMIC SERVICES WITH WARRANTY
// -------------------------------------------------------------
function setupInvoiceForm() {
  const form = document.getElementById('invoice-form');
  const addServiceBtn = document.getElementById('add-service-row-btn');
  const discountInput = document.getElementById('form-discount');
  const amountPaidInput = document.getElementById('form-amount-paid');

  // Add initial service row
  addServiceRow();

  // Add row on button click
  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => addServiceRow());
  }

  // Recalculate on discount or amount paid changes
  if (discountInput) {
    discountInput.addEventListener('input', () => {
      calculateCurrentForm();
      updateFormUpiQr();
    });
  }
  if (amountPaidInput) {
    amountPaidInput.addEventListener('input', () => {
      calculateCurrentForm();
      updateFormUpiQr();
    });
  }

  // Brand quick chips
  document.querySelectorAll('.brand-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.brand-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const brand = chip.getAttribute('data-brand');
      const input = document.getElementById('form-mobile-brand');
      if (input) {
        input.value = brand === 'Other' ? '' : brand;
        if (brand === 'Other') input.focus();
        else document.getElementById('form-mobile-model')?.focus();
      }
    });
  });

  // Problem quick chips
  document.querySelectorAll('.problem-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prob = chip.getAttribute('data-problem');
      const input = document.getElementById('form-problem');
      if (input) {
        if (!input.value) {
          input.value = prob;
        } else if (!input.value.includes(prob)) {
          input.value += `, ${prob}`;
        }
      }
    });
  });

  // Payment Mode radio buttons & toggle UPI QR
  document.querySelectorAll('input[name="payment_mode_radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById('form-payment-mode').value = e.target.value;
      updateFormUpiQr();
    });
  });

  // Quick Amount Paid buttons
  document.getElementById('pay-full-btn')?.addEventListener('click', () => {
    const totals = getCurrentFormTotals();
    document.getElementById('form-amount-paid').value = totals.total;
    calculateCurrentForm();
    updateFormUpiQr();
  });

  document.getElementById('pay-half-btn')?.addEventListener('click', () => {
    const totals = getCurrentFormTotals();
    document.getElementById('form-amount-paid').value = Math.round(totals.total / 2);
    calculateCurrentForm();
    updateFormUpiQr();
  });

  document.getElementById('pay-zero-btn')?.addEventListener('click', () => {
    document.getElementById('form-amount-paid').value = '0';
    calculateCurrentForm();
    updateFormUpiQr();
  });

  // Confirm UPI Received button in invoice creation form
  document.getElementById('form-confirm-upi-paid-btn')?.addEventListener('click', () => {
    const totals = getCurrentFormTotals();
    document.getElementById('form-amount-paid').value = totals.total;
    calculateCurrentForm();
    updateFormUpiQr();
    window.showToast('Payment confirmed! Marked as PAID.', 'success');
  });

  // Form Submission
  if (form) {
    form.addEventListener('submit', handleInvoiceFormSubmit);
  }
}

// Add a Dynamic Service Row with Warranty
function addServiceRow(serviceName = '', price = '', warranty = '30 Days Warranty') {
  const container = document.getElementById('services-rows-container');
  if (!container) return;

  const catalog = window.storage.getServices();
  const rowId = 'srv_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'grid grid-cols-12 gap-2 sm:gap-3 items-center bg-gray-50/80 p-2.5 rounded-lg border border-gray-200 transition';

  // Build service dropdown options
  let optionsHtml = `<option value="">-- Select Repair Service --</option>`;
  catalog.forEach(item => {
    optionsHtml += `<option value="${escapeHtml(item.name)}" data-price="${item.price}" data-warranty="${escapeHtml(item.warranty || '30 Days Warranty')}">${item.name} (₹${item.price})</option>`;
  });
  optionsHtml += `<option value="__CUSTOM__">✍️ Custom Service (Type below)...</option>`;

  row.innerHTML = `
    <!-- 1. Service Description -->
    <div class="col-span-12 sm:col-span-5">
      <label class="block sm:hidden text-[10px] font-bold text-gray-500 uppercase">Service Description</label>
      <div class="space-y-1">
        <select class="service-select w-full text-xs sm:text-sm border border-gray-300 rounded px-2.5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
          ${optionsHtml}
        </select>
        <input type="text" class="custom-service-name hidden w-full text-xs sm:text-sm border border-blue-400 rounded px-2.5 py-1.5 bg-blue-50/40 text-gray-900 focus:ring-2 focus:ring-blue-500" placeholder="Type custom service name..." value="${escapeHtml(serviceName)}" />
      </div>
    </div>

    <!-- 2. Warranty Selection -->
    <div class="col-span-12 sm:col-span-4">
      <label class="block sm:hidden text-[10px] font-bold text-gray-500 uppercase">Warranty (Optional)</label>
      <div class="space-y-1">
        <select class="service-warranty-select w-full text-xs sm:text-sm border border-gray-300 rounded px-2 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="30 Days Warranty">30 Days Warranty</option>
          <option value="60 Days Warranty">60 Days Warranty</option>
          <option value="90 Days Warranty">90 Days Warranty</option>
          <option value="6 Months Warranty">6 Months Warranty</option>
          <option value="1 Year Warranty">1 Year Warranty</option>
          <option value="Testing (2 Days)">Testing (2 Days)</option>
          <option value="No Warranty">No Warranty</option>
          <option value="__CUSTOM_WARRANTY__">Custom Warranty...</option>
        </select>
        <input type="text" class="custom-warranty-name hidden w-full text-xs sm:text-sm border border-blue-400 rounded px-2 py-1.5 bg-blue-50/40 text-gray-900 focus:ring-2 focus:ring-blue-500" placeholder="e.g. 15 Days / Lifetime" value="" />
      </div>
    </div>

    <!-- 3. Price -->
    <div class="col-span-8 sm:col-span-2">
      <label class="block sm:hidden text-[10px] font-bold text-gray-500 uppercase">Price (₹)</label>
      <div class="relative">
        <span class="absolute left-2.5 top-2 text-gray-400 text-xs sm:text-sm font-semibold">₹</span>
        <input type="number" min="0" step="any" class="service-price w-full pl-6 pr-2 py-2 text-xs sm:text-sm border border-gray-300 rounded bg-white font-bold text-gray-900 focus:ring-2 focus:ring-blue-500" placeholder="0" value="${price !== '' ? price : ''}" />
      </div>
    </div>

    <!-- 4. Remove -->
    <div class="col-span-4 sm:col-span-1 text-right">
      <button type="button" class="remove-service-row text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition" title="Remove Service">
        <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  `;

  container.appendChild(row);

  const select = row.querySelector('.service-select');
  const customInput = row.querySelector('.custom-service-name');
  const warrantySelect = row.querySelector('.service-warranty-select');
  const customWarrantyInput = row.querySelector('.custom-warranty-name');
  const priceInput = row.querySelector('.service-price');
  const removeBtn = row.querySelector('.remove-service-row');

  // Set initial service name if supplied
  if (serviceName) {
    let matched = false;
    for (let opt of select.options) {
      if (opt.value === serviceName) {
        select.value = serviceName;
        matched = true;
        break;
      }
    }
    if (!matched) {
      select.value = '__CUSTOM__';
      customInput.classList.remove('hidden');
      customInput.value = serviceName;
    }
  }

  // Set initial warranty if supplied
  if (warranty) {
    let matchedWarranty = false;
    for (let opt of warrantySelect.options) {
      if (opt.value === warranty) {
        warrantySelect.value = warranty;
        matchedWarranty = true;
        break;
      }
    }
    if (!matchedWarranty) {
      warrantySelect.value = '__CUSTOM_WARRANTY__';
      customWarrantyInput.classList.remove('hidden');
      customWarrantyInput.value = warranty;
    }
  }

  // Handle service dropdown change
  select.addEventListener('change', () => {
    if (select.value === '__CUSTOM__') {
      customInput.classList.remove('hidden');
      customInput.value = '';
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      const selectedOption = select.options[select.selectedIndex];
      const defaultPrice = selectedOption.getAttribute('data-price');
      const defaultWarranty = selectedOption.getAttribute('data-warranty');
      if (defaultPrice) {
        priceInput.value = defaultPrice;
      }
      if (defaultWarranty) {
        warrantySelect.value = defaultWarranty;
        customWarrantyInput.classList.add('hidden');
      }
    }
    calculateCurrentForm();
    updateFormUpiQr();
  });

  // Handle warranty dropdown change
  warrantySelect.addEventListener('change', () => {
    if (warrantySelect.value === '__CUSTOM_WARRANTY__') {
      customWarrantyInput.classList.remove('hidden');
      customWarrantyInput.value = '';
      customWarrantyInput.focus();
    } else {
      customWarrantyInput.classList.add('hidden');
    }
  });

  customInput.addEventListener('input', calculateCurrentForm);
  priceInput.addEventListener('input', () => {
    calculateCurrentForm();
    updateFormUpiQr();
  });

  removeBtn.addEventListener('click', () => {
    const allRows = container.querySelectorAll('[id^="srv_row_"]');
    if (allRows.length <= 1) {
      window.showToast('At least one service is required.', 'info');
      return;
    }
    row.remove();
    calculateCurrentForm();
    updateFormUpiQr();
  });

  calculateCurrentForm();
}

function getServicesFromForm() {
  const container = document.getElementById('services-rows-container');
  const rows = container.querySelectorAll('[id^="srv_row_"]');
  const list = [];

  rows.forEach(r => {
    const select = r.querySelector('.service-select');
    const customInput = r.querySelector('.custom-service-name');
    const warrantySelect = r.querySelector('.service-warranty-select');
    const customWarrantyInput = r.querySelector('.custom-warranty-name');
    const priceInput = r.querySelector('.service-price');

    let name = select.value === '__CUSTOM__' ? customInput.value.trim() : select.value;
    let warranty = warrantySelect.value === '__CUSTOM_WARRANTY__' ? customWarrantyInput.value.trim() : warrantySelect.value;
    if (!warranty) warranty = '30 Days Warranty';
    let price = parseFloat(priceInput.value) || 0;

    if (name) {
      list.push({ name, price, warranty });
    }
  });

  return list;
}

function getCurrentFormTotals() {
  const services = getServicesFromForm();
  const discount = parseFloat(document.getElementById('form-discount')?.value) || 0;
  const amountPaid = parseFloat(document.getElementById('form-amount-paid')?.value) || 0;
  const settings = window.storage.getSettings();

  return window.invoiceService.calculateInvoiceTotals(
    services,
    discount,
    amountPaid,
    settings.enableGst,
    settings.gstPercent
  );
}

function calculateCurrentForm() {
  const totals = getCurrentFormTotals();
  const settings = window.storage.getSettings();
  const sym = settings.currency || '₹';

  // Update calculation display in summary box
  document.getElementById('calc-subtotal').innerText = `${sym}${totals.subtotal.toLocaleString('en-IN')}`;
  
  const discountRow = document.getElementById('calc-discount-row');
  if (totals.discount > 0) {
    discountRow.classList.remove('hidden');
    document.getElementById('calc-discount').innerText = `-${sym}${totals.discount.toLocaleString('en-IN')}`;
  } else {
    discountRow.classList.add('hidden');
  }

  const gstRow = document.getElementById('calc-gst-row');
  if (totals.gstEnabled && totals.gstAmount > 0) {
    gstRow.classList.remove('hidden');
    document.getElementById('calc-gst-label').innerText = `GST (${totals.gstPercent}%)`;
    document.getElementById('calc-gst').innerText = `${sym}${totals.gstAmount.toLocaleString('en-IN')}`;
  } else {
    gstRow.classList.add('hidden');
  }

  document.getElementById('calc-total').innerText = `${sym}${totals.total.toLocaleString('en-IN')}`;
  document.getElementById('calc-balance').innerText = `${sym}${totals.balance.toLocaleString('en-IN')}`;

  const statusBadge = document.getElementById('calc-status-badge');
  if (statusBadge) {
    statusBadge.innerText = totals.status.toUpperCase();
    statusBadge.className = 'px-3 py-1 text-xs font-black rounded uppercase tracking-wider ' +
      (totals.status === 'Paid' ? 'status-badge-paid' :
       totals.status === 'Partially Paid' ? 'status-badge-partial' : 'status-badge-pending');
  }
}

// Update the live Amount-Based UPI QR code in the invoice form
function updateFormUpiQr() {
  const qrContainer = document.getElementById('form-upi-qr-container');
  if (!qrContainer) return;

  const paymentMode = document.getElementById('form-payment-mode')?.value || 'Cash';
  const settings = window.storage.getSettings();

  if (paymentMode !== 'UPI' || !settings.enableUpiQr || !settings.upiId) {
    qrContainer.classList.add('hidden');
    return;
  }

  qrContainer.classList.remove('hidden');

  const totals = getCurrentFormTotals();
  // Amount to request:
  // If customer has already paid part of the bill, request remaining balance.
  // If paid = 0, request full total.
  // Example: Total ₹5,000, Paid ₹2,000, Balance ₹3,000 -> QR requests ₹3,000!
  let qrAmount = 0;
  if (totals.amountPaid > 0 && totals.balance > 0) {
    qrAmount = totals.balance;
  } else if (totals.amountPaid === 0) {
    qrAmount = totals.total;
  } else {
    qrAmount = totals.total;
  }

  const invoiceNo = currentEditingInvoiceId 
    ? (window.storage.getInvoiceById(currentEditingInvoiceId)?.invoiceNumber || 'INV-0001')
    : window.storage.getNextInvoiceNumber().formatted;

  const upiUri = window.invoiceService.getUpiUri(
    settings.upiId,
    settings.upiBusinessName || settings.businessName,
    qrAmount,
    invoiceNo
  );

  const qrDataUrl = window.invoiceService.getQrCodeDataUrl(upiUri, 160);

  const qrImg = document.getElementById('form-upi-qr-image');
  const amountBadge = document.getElementById('form-upi-amount-badge');
  const idDisplay = document.getElementById('form-upi-id-display');
  const caption = document.getElementById('form-upi-qr-caption');

  if (qrImg) qrImg.src = qrDataUrl;
  if (amountBadge) amountBadge.innerText = `Payable: ₹${qrAmount.toLocaleString('en-IN')}`;
  if (idDisplay) idDisplay.innerText = settings.upiId;
  if (caption) caption.innerText = `Scan to Pay ₹${qrAmount.toLocaleString('en-IN')}`;
}

function resetInvoiceForm() {
  currentEditingInvoiceId = null;
  const form = document.getElementById('invoice-form');
  if (form) form.reset();

  // Reset next invoice number preview
  const nextInfo = window.storage.getNextInvoiceNumber();
  document.getElementById('form-invoice-number-display').innerText = nextInfo.formatted;
  document.getElementById('form-invoice-date').value = new Date().toISOString().split('T')[0];

  // Clear rows & add fresh single row
  const container = document.getElementById('services-rows-container');
  if (container) container.innerHTML = '';
  addServiceRow();

  // Reset quick chips
  document.querySelectorAll('.brand-chip').forEach(c => c.classList.remove('active'));

  // Reset payment mode
  document.getElementById('form-payment-mode').value = 'Cash';
  const cashRadio = document.querySelector('input[name="payment_mode_radio"][value="Cash"]');
  if (cashRadio) cashRadio.checked = true;

  document.getElementById('form-discount').value = '';
  document.getElementById('form-amount-paid').value = '';

  document.getElementById('invoice-form-title').innerText = 'Create New Service Invoice';
  document.getElementById('save-invoice-btn-text').innerText = 'Save & Generate Invoice';

  calculateCurrentForm();
  updateFormUpiQr();

  // Autofocus customer name
  setTimeout(() => {
    document.getElementById('form-customer-name')?.focus();
  }, 100);
}

function handleInvoiceFormSubmit(e) {
  e.preventDefault();

  const customerName = document.getElementById('form-customer-name').value.trim();
  const customerPhone = document.getElementById('form-customer-phone').value.trim();
  const customerAddress = document.getElementById('form-customer-address').value.trim();

  const mobileBrand = document.getElementById('form-mobile-brand').value.trim();
  const mobileModel = document.getElementById('form-mobile-model').value.trim();
  const imei = document.getElementById('form-imei').value.trim();
  const problem = document.getElementById('form-problem').value.trim();

  const invoiceDate = document.getElementById('form-invoice-date').value || new Date().toISOString().split('T')[0];
  const paymentMode = document.getElementById('form-payment-mode').value || 'Cash';

  const services = getServicesFromForm();

  // Validation
  if (!customerName) {
    alert('Please enter Customer Name.');
    document.getElementById('form-customer-name').focus();
    return;
  }

  if (!customerPhone) {
    alert('Please enter Customer Mobile Number.');
    document.getElementById('form-customer-phone').focus();
    return;
  }

  if (services.length === 0) {
    alert('Please add at least one repair service with price.');
    return;
  }

  const totals = getCurrentFormTotals();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let invoiceNumber = '';
  if (currentEditingInvoiceId) {
    const existing = window.storage.getInvoiceById(currentEditingInvoiceId);
    invoiceNumber = existing ? existing.invoiceNumber : window.storage.getNextInvoiceNumber().formatted;
  } else {
    invoiceNumber = window.storage.getNextInvoiceNumber().formatted;
  }

  const invoiceData = {
    id: currentEditingInvoiceId || undefined,
    invoiceNumber,
    date: invoiceDate,
    time: timeStr,
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress
    },
    device: {
      brand: mobileBrand,
      model: mobileModel,
      imei: imei,
      problem: problem
    },
    services: services,
    subtotal: totals.subtotal,
    discount: totals.discount,
    gstEnabled: totals.gstEnabled,
    gstPercent: totals.gstPercent,
    gstAmount: totals.gstAmount,
    total: totals.total,
    paymentMode: paymentMode,
    amountPaid: totals.amountPaid,
    balance: totals.balance,
    status: totals.status,
    paidAt: totals.status === 'Paid' ? new Date().toISOString() : null
  };

  const saved = window.storage.saveInvoice(invoiceData);
  window.showToast(`Invoice ${saved.invoiceNumber} saved successfully!`, 'success');

  // Clear editing status
  currentEditingInvoiceId = null;

  // Open invoice preview modal
  viewInvoiceModal(saved.id);
}

// -------------------------------------------------------------
// INVOICE PREVIEW MODAL & ACTIONS
// -------------------------------------------------------------
window.viewInvoiceModal = function(id) {
  const invoice = window.storage.getInvoiceById(id);
  if (!invoice) {
    console.error('Invoice not found with id:', id);
    window.showToast('Invoice not found', 'error');
    return;
  }

  activeInvoiceId = invoice.id;
  const settings = window.storage.getSettings();

  const modal = document.getElementById('invoice-view-modal');
  const container = document.getElementById('printable-invoice-area');
  const markPaidBtn = document.getElementById('modal-mark-paid-btn');

  // Render complete invoice HTML with warranty and UPI QR
  container.innerHTML = window.invoiceService.renderInvoiceHTML(invoice, settings, false);

  // Show "Mark as Paid" button if balance > 0
  if (markPaidBtn) {
    if (invoice.balance > 0) {
      markPaidBtn.classList.remove('hidden');
    } else {
      markPaidBtn.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
};

window.closeInvoiceModal = function() {
  document.getElementById('invoice-view-modal').classList.add('hidden');
};

window.backToDashboardFromModal = function() {
  closeInvoiceModal();
  switchTab('dashboard');
};

// -------------------------------------------------------------
// PRINT INVOICE (100% RELIABLE IFRAME PRINT)
// -------------------------------------------------------------
window.printInvoice = function(customInvoiceId) {
  const targetId = customInvoiceId || activeInvoiceId;
  if (!targetId) return;
  const invoice = window.storage.getInvoiceById(targetId);
  const settings = window.storage.getSettings();
  if (!invoice) return;

  activeInvoiceId = invoice.id;
  const invoiceHTML = window.invoiceService.renderInvoiceHTML(invoice, settings, false);

  // Update modal preview container if present
  const container = document.getElementById('printable-invoice-area');
  if (container) {
    container.innerHTML = invoiceHTML;
  }

  // Create isolated iframe for reliable printing across all browsers
  let printFrame = document.getElementById('app-print-frame');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'app-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  try {
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${settings.businessName || 'Invoice'} - ${invoice.invoiceNumber}</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link rel="stylesheet" href="css/styles.css" />
        <style>
          body { 
            margin: 0; 
            padding: 16px; 
            background: #ffffff; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-sheet { 
            box-shadow: none !important; 
            border: 1px solid #e2e8f0; 
            width: 100% !important; 
            max-width: 760px !important;
            margin: 0 auto;
          }
          @media print {
            body { padding: 0; }
            .invoice-sheet { border: none !important; }
            @page { margin: 8mm; size: auto; }
          }
        </style>
      </head>
      <body>
        ${invoiceHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        <\/script>
      </body>
      </html>
    `);
    frameDoc.close();
  } catch (err) {
    console.warn('Iframe print fallback to window.print', err);
    window.print();
  }
};

window.printInvoiceFromModal = function() {
  window.printInvoice(activeInvoiceId);
};

window.quickPrint = function(id) {
  window.printInvoice(id);
};

// -------------------------------------------------------------
// DOWNLOAD INVOICE PDF
// -------------------------------------------------------------
window.downloadPDFFromModal = function(customInvoiceId) {
  const targetId = customInvoiceId || activeInvoiceId;
  if (!targetId) return Promise.reject('No active invoice');
  const invoice = window.storage.getInvoiceById(targetId);
  const settings = window.storage.getSettings();
  if (!invoice) return Promise.reject('Invoice not found');

  let invoiceSheet = document.querySelector('#printable-invoice-area .invoice-sheet');
  let tempContainer = null;
  if (!invoiceSheet) {
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '760px';
    tempContainer.innerHTML = window.invoiceService.renderInvoiceHTML(invoice, settings, false);
    document.body.appendChild(tempContainer);
    invoiceSheet = tempContainer.querySelector('.invoice-sheet') || tempContainer;
  }

  const cleanName = (settings.businessName || 'Mani_Mobile_Services').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanName}_${invoice.invoiceNumber}.pdf`;
  const opt = {
    margin:       [6, 6, 6, 6],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    window.showToast('Generating & Downloading Invoice PDF...', 'info');
    return html2pdf().set(opt).from(invoiceSheet).save().then(() => {
      window.showToast(`Invoice PDF downloaded: ${filename}`, 'success');
      if (tempContainer) tempContainer.remove();
      return { success: true, filename };
    }).catch(err => {
      console.warn('PDF export fallback to print:', err);
      if (tempContainer) tempContainer.remove();
      window.printInvoice(targetId);
      return { success: false, error: err };
    });
  } else {
    if (tempContainer) tempContainer.remove();
    window.showToast('Select "Save as PDF" in print dialog', 'info');
    window.printInvoice(targetId);
    return Promise.resolve({ success: false, fallback: 'print' });
  }
};

// -------------------------------------------------------------
// COPY WHATSAPP INVOICE MESSAGE TO CLIPBOARD
// -------------------------------------------------------------
window.copyWhatsAppMessage = function(customInvoiceId) {
  const targetId = customInvoiceId || activeInvoiceId;
  if (!targetId) return;
  const invoice = window.storage.getInvoiceById(targetId);
  const settings = window.storage.getSettings();
  if (!invoice) return;

  const msg = window.invoiceService.generateWhatsAppMessage(invoice, settings);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      window.showToast('📋 Invoice text copied to clipboard!', 'success');
    }).catch(() => {
      window.showToast('Ready to send in WhatsApp', 'info');
    });
  }
};

// -------------------------------------------------------------
// SEND DIRECT PDF INVOICE TO CUSTOMER WHATSAPP
// -------------------------------------------------------------
window.sendWhatsAppWithPdfFromModal = async function(customInvoiceId) {
  const targetId = customInvoiceId || activeInvoiceId;
  if (!targetId) return;
  const invoice = window.storage.getInvoiceById(targetId);
  const settings = window.storage.getSettings();
  if (!invoice) return;

  activeInvoiceId = invoice.id;
  const cleanName = (settings.businessName || 'Mani_Mobile_Services').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanName}_${invoice.invoiceNumber}.pdf`;
  const messageText = window.invoiceService.generateWhatsAppMessage(invoice, settings);

  // Auto-copy message text to clipboard for immediate pasting convenience
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(messageText).catch(() => {});
  }

  let invoiceSheet = document.querySelector('#printable-invoice-area .invoice-sheet');
  let tempContainer = null;
  if (!invoiceSheet) {
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '760px';
    tempContainer.innerHTML = window.invoiceService.renderInvoiceHTML(invoice, settings, false);
    document.body.appendChild(tempContainer);
    invoiceSheet = tempContainer.querySelector('.invoice-sheet') || tempContainer;
  }

  const opt = {
    margin:       [6, 6, 6, 6],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  window.showToast('Generating PDF for customer WhatsApp...', 'info');

  try {
    // Check if device supports Web Share API with File attachment (Mobile Chrome / Safari)
    if (window.html2pdf && navigator.canShare) {
      try {
        const pdfBlob = await html2pdf().set(opt).from(invoiceSheet).output('blob');
        const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice #${invoice.invoiceNumber} - ${settings.businessName}`,
            text: messageText
          });
          window.showToast('Invoice PDF shared to WhatsApp!', 'success');
          if (tempContainer) tempContainer.remove();
          return;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          if (tempContainer) tempContainer.remove();
          return;
        }
        console.log('Native share fallback', shareErr);
      }
    }

    // Direct Desktop / Browser Workflow:
    // 1. Download PDF file
    if (window.html2pdf) {
      await html2pdf().set(opt).from(invoiceSheet).save();
    }

    // 2. Open direct WhatsApp chat for customer
    const waUrl = window.invoiceService.sendViaWhatsApp(invoice, settings);
    window.open(waUrl, '_blank');

    // 3. Show Direct Send Guidance Modal
    showWhatsAppGuideModal(invoice, filename);

  } catch (err) {
    console.error('WhatsApp PDF flow error', err);
    const waUrl = window.invoiceService.sendViaWhatsApp(invoice, settings);
    window.open(waUrl, '_blank');
    window.showToast('Opening WhatsApp chat...', 'info');
  } finally {
    if (tempContainer) tempContainer.remove();
  }
};

function showWhatsAppGuideModal(invoice, filename) {
  const guideModal = document.getElementById('wa-pdf-guide-modal');
  if (!guideModal) return;

  const nameEl = document.getElementById('wa-guide-cust-name');
  const phoneEl = document.getElementById('wa-guide-cust-phone');
  const fileEl = document.getElementById('wa-guide-filename');

  if (nameEl) nameEl.innerText = invoice.customer.name || 'Customer';
  if (phoneEl) phoneEl.innerText = invoice.customer.phone ? `+91 ${invoice.customer.phone}` : 'No phone specified';
  if (fileEl) fileEl.innerText = filename || `Invoice_${invoice.invoiceNumber}.pdf`;

  guideModal.classList.remove('hidden');
}

window.reopenWhatsAppChat = function() {
  if (!activeInvoiceId) return;
  const invoice = window.storage.getInvoiceById(activeInvoiceId);
  const settings = window.storage.getSettings();
  if (invoice) {
    const waUrl = window.invoiceService.sendViaWhatsApp(invoice, settings);
    window.open(waUrl, '_blank');
  }
};

window.markActiveInvoiceAsPaid = function() {
  if (!activeInvoiceId) return;
  const invoice = window.storage.getInvoiceById(activeInvoiceId);
  if (!invoice) return;

  const msg = `Confirm that payment of ₹${invoice.balance.toLocaleString('en-IN')} has been received for Invoice ${invoice.invoiceNumber}?`;
  if (confirm(msg)) {
    const updated = window.storage.recordPayment(invoice.id, invoice.paymentMode || 'UPI', invoice.total);
    window.showToast(`Invoice ${updated.invoiceNumber} recorded as PAID!`, 'success');
    viewInvoiceModal(updated.id);
    renderDashboard();
    renderHistoryTable();
  }
};

window.quickDownloadPDF = function(id) {
  viewInvoiceModal(id);
  setTimeout(() => {
    downloadPDFFromModal(id);
  }, 350);
};

window.quickSendWhatsApp = function(id) {
  viewInvoiceModal(id);
  setTimeout(() => {
    sendWhatsAppWithPdfFromModal(id);
  }, 300);
};

window.startNewInvoiceAfterModal = function() {
  closeInvoiceModal();
  switchTab('new-invoice');
  resetInvoiceForm();
};

window.editInvoiceFromModal = function() {
  if (!activeInvoiceId) return;
  const invoice = window.storage.getInvoiceById(activeInvoiceId);
  if (!invoice) return;

  closeInvoiceModal();
  currentEditingInvoiceId = invoice.id;

  switchTab('new-invoice');

  document.getElementById('invoice-form-title').innerText = `Edit Invoice ${invoice.invoiceNumber}`;
  document.getElementById('save-invoice-btn-text').innerText = 'Update Invoice';
  document.getElementById('form-invoice-number-display').innerText = invoice.invoiceNumber;
  document.getElementById('form-invoice-date').value = invoice.date;

  document.getElementById('form-customer-name').value = invoice.customer.name || '';
  document.getElementById('form-customer-phone').value = invoice.customer.phone || '';
  document.getElementById('form-customer-address').value = invoice.customer.address || '';

  document.getElementById('form-mobile-brand').value = invoice.device.brand || '';
  document.getElementById('form-mobile-model').value = invoice.device.model || '';
  document.getElementById('form-imei').value = invoice.device.imei || '';
  document.getElementById('form-problem').value = invoice.device.problem || '';

  // Select brand chip if match
  document.querySelectorAll('.brand-chip').forEach(c => {
    if (c.getAttribute('data-brand') === invoice.device.brand) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });

  // Services rows with warranty
  const container = document.getElementById('services-rows-container');
  container.innerHTML = '';
  if (invoice.services && invoice.services.length > 0) {
    invoice.services.forEach(srv => {
      addServiceRow(srv.name, srv.price, srv.warranty || '30 Days Warranty');
    });
  } else {
    addServiceRow();
  }

  // Payment
  document.getElementById('form-discount').value = invoice.discount || '';
  document.getElementById('form-amount-paid').value = invoice.amountPaid || '';
  document.getElementById('form-payment-mode').value = invoice.paymentMode || 'Cash';

  const radio = document.querySelector(`input[name="payment_mode_radio"][value="${invoice.paymentMode || 'Cash'}"]`);
  if (radio) radio.checked = true;

  calculateCurrentForm();
  updateFormUpiQr();
};

window.deleteInvoicePrompt = function(id) {
  const invoice = window.storage.getInvoiceById(id);
  if (!invoice) return;

  if (confirm(`Are you sure you want to delete Invoice ${invoice.invoiceNumber} for ${invoice.customer.name}? This cannot be undone.`)) {
    window.storage.deleteInvoice(id);
    window.showToast(`Invoice ${invoice.invoiceNumber} deleted`, 'info');
    renderHistoryTable();
    renderDashboard();
  }
};

// -------------------------------------------------------------
// INVOICE HISTORY & SEARCH
// -------------------------------------------------------------
function setupHistoryFilters() {
  const searchInput = document.getElementById('history-search-input');
  const statusFilter = document.getElementById('history-status-filter');
  const dateFilter = document.getElementById('history-date-filter');

  if (searchInput) searchInput.addEventListener('input', renderHistoryTable);
  if (statusFilter) statusFilter.addEventListener('change', renderHistoryTable);
  if (dateFilter) dateFilter.addEventListener('change', renderHistoryTable);
}

function renderHistoryTable() {
  const container = document.getElementById('history-table-body');
  if (!container) return;

  const invoices = window.storage.getInvoices();
  const settings = window.storage.getSettings();
  const sym = settings.currency || '₹';

  const search = document.getElementById('history-search-input')?.value.toLowerCase().trim() || '';
  const statusFilter = document.getElementById('history-status-filter')?.value || 'all';
  const dateFilter = document.getElementById('history-date-filter')?.value || 'all';

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = invoices.filter(inv => {
    if (search) {
      const matchName = (inv.customer.name || '').toLowerCase().includes(search);
      const matchPhone = (inv.customer.phone || '').toLowerCase().includes(search);
      const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(search);
      const matchBrand = (inv.device.brand || '').toLowerCase().includes(search);
      const matchModel = (inv.device.model || '').toLowerCase().includes(search);
      if (!matchName && !matchPhone && !matchNumber && !matchBrand && !matchModel) {
        return false;
      }
    }

    if (statusFilter !== 'all' && inv.status !== statusFilter) {
      return false;
    }

    if (dateFilter === 'today' && inv.date !== todayStr) {
      return false;
    } else if (dateFilter === 'this_month') {
      const currentMonth = todayStr.substring(0, 7);
      if (!inv.date.startsWith(currentMonth)) return false;
    }

    return true;
  });

  document.getElementById('history-count-badge').innerText = `${filtered.length} Invoices`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-sm text-gray-500">
          No matching invoices found. Try changing your search query or filter.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map(inv => {
    const brandModel = [inv.device?.brand, inv.device?.model].filter(Boolean).join(' ') || 'Handset';
    const statusClass = inv.status === 'Paid' 
      ? 'status-badge-paid' 
      : inv.status === 'Partially Paid' 
        ? 'status-badge-partial' 
        : 'status-badge-pending';

    const servicesList = (inv.services || []).map(s => `${s.name} (${s.warranty || '30 Days'})`).join(', ');

    return `
      <tr class="hover:bg-blue-50/60 transition border-b border-gray-100 cursor-pointer group" onclick="viewInvoiceModal('${inv.id}')" title="Click to view invoice">
        <td class="px-4 py-3.5 whitespace-nowrap">
          <button type="button" onclick="event.stopPropagation(); viewInvoiceModal('${inv.id}')" class="font-mono font-black text-blue-700 group-hover:underline text-sm text-left">
            ${inv.invoiceNumber}
          </button>
          <div class="text-xs text-gray-400 font-medium">${window.invoiceService.formatDate(inv.date)}</div>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <div class="font-bold text-gray-900">${inv.customer.name}</div>
          <div class="text-xs font-mono text-gray-500">${inv.customer.phone || 'N/A'}</div>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-medium text-gray-800 text-xs sm:text-sm">${brandModel}</div>
          <div class="text-xs text-gray-500 truncate max-w-[220px]" title="${escapeHtml(servicesList)}">${servicesList}</div>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap font-bold text-gray-900 text-sm">
          ${sym}${inv.total.toLocaleString('en-IN')}
          ${inv.balance > 0 ? `<div class="text-xs text-red-500 font-bold">Bal: ${sym}${inv.balance.toLocaleString('en-IN')}</div>` : ''}
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <span class="px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusClass}">
            ${inv.status}
          </span>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap text-right text-xs font-medium space-x-1" onclick="event.stopPropagation()">
          <button onclick="viewInvoiceModal('${inv.id}')" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition font-semibold" title="View Invoice">
            View
          </button>
          <button onclick="quickPrint('${inv.id}')" class="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded transition" title="Direct Print">
            Print
          </button>
          <button onclick="quickDownloadPDF('${inv.id}')" class="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded transition" title="Download PDF">
            PDF
          </button>
          <button onclick="quickSendWhatsApp('${inv.id}')" class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold transition" title="Send WhatsApp PDF">
            WhatsApp
          </button>
          <button onclick="editInvoiceFromHistory('${inv.id}')" class="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition" title="Edit">
            Edit
          </button>
          <button onclick="deleteInvoicePrompt('${inv.id}')" class="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title="Delete">
            &times;
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.editInvoiceFromHistory = function(id) {
  activeInvoiceId = id;
  editInvoiceFromModal();
};

// -------------------------------------------------------------
// BUSINESS SETTINGS & LIVE UPI QR PREVIEW
// -------------------------------------------------------------
function loadSettingsIntoForm() {
  const settings = window.storage.getSettings();

  document.getElementById('set-business-name').value = settings.businessName || '';
  document.getElementById('set-tagline').value = settings.tagline || '';
  document.getElementById('set-phone').value = settings.phone || '';
  document.getElementById('set-whatsapp').value = settings.whatsapp || '';
  document.getElementById('set-address').value = settings.address || '';
  document.getElementById('set-invoice-prefix').value = settings.invoicePrefix || 'INV-';
  document.getElementById('set-terms').value = settings.terms || '';
  document.getElementById('set-thank-you').value = settings.thankYouMessage || '';

  // UPI Settings
  const enableUpiCheckbox = document.getElementById('set-enable-upi-qr');
  if (enableUpiCheckbox) {
    enableUpiCheckbox.checked = settings.enableUpiQr !== false;
  }
  document.getElementById('set-upi-id').value = settings.upiId || 'manimobileservices@upi';
  document.getElementById('set-upi-business-name').value = settings.upiBusinessName || settings.businessName || 'Mani Mobile Services';

  // GST
  const enableGstCheckbox = document.getElementById('set-enable-gst');
  const gstDetailsBox = document.getElementById('gst-details-box');
  if (enableGstCheckbox) {
    enableGstCheckbox.checked = !!settings.enableGst;
    if (gstDetailsBox) {
      if (settings.enableGst) gstDetailsBox.classList.remove('hidden');
      else gstDetailsBox.classList.add('hidden');
    }
  }

  document.getElementById('set-gst-number').value = settings.gstNumber || '';
  document.getElementById('set-gst-percent').value = settings.gstPercent || 18;

  const requireLoginCheckbox = document.getElementById('set-require-login');
  if (requireLoginCheckbox) {
    requireLoginCheckbox.checked = !!settings.requireLogin;
  }
  document.getElementById('set-pin-code').value = settings.pinCode || '1234';

  // Update Settings QR Preview
  updateSettingsQrPreview();
}

function updateSettingsQrPreview() {
  const upiId = document.getElementById('set-upi-id')?.value?.trim() || 'manimobileservices@upi';
  const bizName = document.getElementById('set-upi-business-name')?.value?.trim() || 'Mani Mobile Services';
  const testAmt = parseFloat(document.getElementById('set-upi-test-amount')?.value) || 1500;

  const upiUri = window.invoiceService.getUpiUri(upiId, bizName, testAmt, 'INV-0001');
  const qrDataUrl = window.invoiceService.getQrCodeDataUrl(upiUri, 150);

  const imgEl = document.getElementById('settings-qr-preview-image');
  const textEl = document.getElementById('settings-qr-preview-text');
  const amtEl = document.getElementById('settings-qr-preview-amount');

  if (imgEl) imgEl.src = qrDataUrl;
  if (textEl) textEl.innerText = upiId;
  if (amtEl) amtEl.innerText = `Amount: ₹${testAmt.toLocaleString('en-IN')}`;
}

function setupSettingsForm() {
  const form = document.getElementById('business-settings-form');
  const enableGstCheckbox = document.getElementById('set-enable-gst');
  const gstDetailsBox = document.getElementById('gst-details-box');

  if (enableGstCheckbox) {
    enableGstCheckbox.addEventListener('change', () => {
      if (enableGstCheckbox.checked) {
        gstDetailsBox.classList.remove('hidden');
      } else {
        gstDetailsBox.classList.add('hidden');
      }
    });
  }

  // Live update QR preview on typing
  ['set-upi-id', 'set-upi-business-name', 'set-upi-test-amount'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSettingsQrPreview);
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = window.storage.getSettings();

      const updated = {
        ...current,
        businessName: document.getElementById('set-business-name').value.trim() || 'MANI MOBILE SERVICES',
        tagline: document.getElementById('set-tagline').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        whatsapp: document.getElementById('set-whatsapp').value.trim(),
        address: document.getElementById('set-address').value.trim(),
        invoicePrefix: document.getElementById('set-invoice-prefix').value.trim() || 'INV-',
        terms: document.getElementById('set-terms').value.trim(),
        thankYouMessage: document.getElementById('set-thank-you').value.trim(),
        upiId: document.getElementById('set-upi-id').value.trim() || 'manimobileservices@upi',
        upiBusinessName: document.getElementById('set-upi-business-name').value.trim() || 'Mani Mobile Services',
        enableUpiQr: !!document.getElementById('set-enable-upi-qr').checked,
        enableGst: !!document.getElementById('set-enable-gst').checked,
        gstNumber: document.getElementById('set-gst-number').value.trim(),
        gstPercent: parseFloat(document.getElementById('set-gst-percent').value) || 18,
        requireLogin: !!document.getElementById('set-require-login').checked,
        pinCode: document.getElementById('set-pin-code').value.trim() || '1234'
      };

      window.storage.saveSettings(updated);
      updateBrandingDisplay();
      updateFormUpiQr();
      window.showToast('Business Settings saved successfully!', 'success');
    });
  }

  // Backup & Export
  document.getElementById('export-data-btn')?.addEventListener('click', () => {
    const dataStr = window.storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mani_Mobile_Services_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast('Backup exported successfully', 'success');
  });

  // Restore & Import
  const fileInput = document.getElementById('import-file-input');
  document.getElementById('import-data-btn')?.addEventListener('click', () => {
    if (fileInput) fileInput.click();
  });

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.storage.importAllData(event.target.result);
        if (res.success) {
          window.showToast(`Imported backup successfully! Loaded ${res.count} invoices.`, 'success');
          updateBrandingDisplay();
          loadSettingsIntoForm();
          renderDashboard();
        } else {
          alert('Failed to import backup file: ' + res.error);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
  }

  // Reset to Factory Default Data
  document.getElementById('reset-defaults-btn')?.addEventListener('click', () => {
    if (confirm('CAUTION: This will reset all settings, services, and invoices to initial demo data. Are you sure?')) {
      window.storage.resetAllToDefault();
      window.showToast('All data reset to defaults', 'info');
      updateBrandingDisplay();
      loadSettingsIntoForm();
      renderDashboard();
    }
  });
}

// -------------------------------------------------------------
// UTILITIES
// -------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
