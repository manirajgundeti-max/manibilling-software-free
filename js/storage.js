/**
 * Storage Service for Mani Mobile Services
 * Handles LocalStorage persistence, default seeding, data migrations, and export/import
 */

const STORAGE_KEYS = {
  SETTINGS: 'mms_business_settings',
  SERVICES: 'mms_services_list',
  INVOICES: 'mms_invoices_list',
  AUTH: 'mms_auth_session'
};

const DEFAULT_SETTINGS = {
  businessName: 'MANI MOBILE SERVICES',
  tagline: 'Professional Mobile Repair & Service',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  address: 'Shop No. 14, Main Road, Near Bus Stand, Chennai - 600001',
  email: 'service@manimobiles.com',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1004,
  terms: '1. 30 days warranty on replaced hardware spare parts.\n2. No warranty for physical drop, screen crack, liquid/water damage or third-party tampering.\n3. Please backup customer data before repair. We are not liable for any data loss.\n4. Handset will be delivered only on presentation of original bill or registered mobile number verification.',
  thankYouMessage: 'Thank you for choosing Mani Mobile Services! We value your trust.',
  currency: '₹',
  enableGst: false,
  gstNumber: '',
  gstPercent: 18,
  upiId: 'manimobileservices@upi',
  upiBusinessName: 'Mani Mobile Services',
  enableUpiQr: true,
  requireLogin: false,
  pinCode: '9966'
};

const DEFAULT_SERVICES = [
  { id: 'srv_1', name: 'Display Replacement', price: 3500, warranty: '30 Days Warranty', category: 'Hardware' },
  { id: 'srv_2', name: 'Screen / Combo Replacement', price: 4200, warranty: '30 Days Warranty', category: 'Hardware' },
  { id: 'srv_3', name: 'Battery Replacement', price: 1400, warranty: '90 Days Warranty', category: 'Hardware' },
  { id: 'srv_4', name: 'Charging Port Replacement / Repair', price: 650, warranty: '30 Days Warranty', category: 'Hardware' },
  { id: 'srv_5', name: 'Speaker Replacement', price: 600, warranty: '30 Days Warranty', category: 'Hardware' },
  { id: 'srv_6', name: 'Mic Repair / Replacement', price: 500, warranty: '30 Days Warranty', category: 'Hardware' },
  { id: 'srv_7', name: 'Camera Replacement (Rear / Front)', price: 1800, warranty: '30 Days Warranty', category: 'Hardware' },
  { id: 'srv_8', name: 'Back Panel Replacement', price: 850, warranty: 'No Warranty', category: 'Body' },
  { id: 'srv_9', name: 'Software Installation / OS Flashing', price: 500, warranty: 'Testing (2 Days)', category: 'Software' },
  { id: 'srv_10', name: 'Software Repair / Virus Removal', price: 400, warranty: 'Testing (2 Days)', category: 'Software' },
  { id: 'srv_11', name: 'Mobile Cleaning & Dust Removal', price: 300, warranty: 'No Warranty', category: 'General' },
  { id: 'srv_12', name: 'General Mobile Repair & Diagnosis', price: 500, warranty: '30 Days Warranty', category: 'General' },
  { id: 'srv_13', name: 'Water Damage Chemical Wash & Treatment', price: 950, warranty: 'No Warranty', category: 'General' },
  { id: 'srv_14', name: 'Tempered Glass & Protection Fitment', price: 250, warranty: 'No Warranty', category: 'Accessories' }
];

function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

const DEFAULT_INVOICES = [
  {
    id: 'inv_1001',
    invoiceNumber: 'INV-1001',
    date: getTodayString(),
    time: '11:15 AM',
    customer: {
      name: 'Rajesh Kumar',
      phone: '9840123456',
      address: 'Anna Nagar, Chennai'
    },
    device: {
      brand: 'Samsung',
      model: 'Galaxy S23',
      imei: '354890123456789',
      problem: 'Display screen broken after drop'
    },
    services: [
      { name: 'Display Replacement', price: 5000, warranty: '30 Days Warranty' },
      { name: 'Battery Replacement', price: 1500, warranty: '90 Days Warranty' }
    ],
    subtotal: 6500,
    discount: 200,
    gstEnabled: false,
    gstAmount: 0,
    total: 6300,
    paymentMode: 'UPI',
    amountPaid: 6300,
    balance: 0,
    status: 'Paid',
    paidAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'inv_1002',
    invoiceNumber: 'INV-1002',
    date: getTodayString(),
    time: '02:30 PM',
    customer: {
      name: 'Priya Sundaram',
      phone: '9876543210',
      address: 'T Nagar, Chennai'
    },
    device: {
      brand: 'Apple',
      model: 'iPhone 13',
      imei: '356789012345678',
      problem: 'Battery drains fast, shuts down at 20%'
    },
    services: [
      { name: 'Battery Replacement', price: 2400, warranty: '90 Days Warranty' }
    ],
    subtotal: 2400,
    discount: 0,
    gstEnabled: false,
    gstAmount: 0,
    total: 2400,
    paymentMode: 'Cash',
    amountPaid: 2400,
    balance: 0,
    status: 'Paid',
    paidAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'inv_1003',
    invoiceNumber: 'INV-1003',
    date: getTodayString(),
    time: '04:45 PM',
    customer: {
      name: 'Venkatesh Murugan',
      phone: '9789012345',
      address: 'Koyambedu, Chennai'
    },
    device: {
      brand: 'Vivo',
      model: 'V29 Pro',
      imei: '',
      problem: 'Charging port loose & speaker low sound'
    },
    services: [
      { name: 'Charging Port Replacement / Repair', price: 750, warranty: '30 Days Warranty' },
      { name: 'Speaker Replacement', price: 600, warranty: '30 Days Warranty' }
    ],
    subtotal: 1350,
    discount: 50,
    gstEnabled: false,
    gstAmount: 0,
    total: 1300,
    paymentMode: 'UPI',
    amountPaid: 500,
    balance: 800,
    status: 'Partially Paid',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    } else {
      // Ensure new settings fields exist
      const existing = this.getSettings();
      let updated = false;
      if (!existing.upiBusinessName) {
        existing.upiBusinessName = DEFAULT_SETTINGS.upiBusinessName;
        updated = true;
      }
      if (existing.enableUpiQr === undefined) {
        existing.enableUpiQr = true;
        updated = true;
      }
      // Migrate old demo PIN 1234 to 9966
      if (!existing.pinCode || existing.pinCode === '1234') {
        existing.pinCode = '9966';
        updated = true;
      }
      if (updated) this.saveSettings(existing);
    }

    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.saveServices(DEFAULT_SERVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      this.saveInvoices(DEFAULT_INVOICES);
    } else {
      // Ensure invoices have warranty data
      const existingInvoices = this.getInvoices();
      let modified = false;
      existingInvoices.forEach(inv => {
        if (Array.isArray(inv.services)) {
          inv.services.forEach(s => {
            if (!s.warranty) {
              s.warranty = '30 Days Warranty';
              modified = true;
            }
          });
        }
      });
      if (modified) {
        this.saveInvoices(existingInvoices);
      }
    }
  }

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Failed reading settings from storage', e);
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed saving settings to storage', e);
      return false;
    }
  }

  getNextInvoiceNumber() {
    const settings = this.getSettings();
    const prefix = settings.invoicePrefix || 'INV-';
    const num = settings.nextInvoiceNumber || 1;
    const formatted = `${prefix}${String(num).padStart(4, '0')}`;
    return { formatted, num, prefix };
  }

  incrementInvoiceNumber() {
    const settings = this.getSettings();
    settings.nextInvoiceNumber = (settings.nextInvoiceNumber || 1) + 1;
    this.saveSettings(settings);
  }

  // Services
  getServices() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return data ? JSON.parse(data) : DEFAULT_SERVICES;
    } catch (e) {
      console.error('Failed reading services', e);
      return DEFAULT_SERVICES;
    }
  }

  saveServices(services) {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      return true;
    } catch (e) {
      console.error('Failed saving services', e);
      return false;
    }
  }

  addService(service) {
    const services = this.getServices();
    const newService = {
      id: 'srv_' + Date.now(),
      name: service.name.trim(),
      price: parseFloat(service.price) || 0,
      warranty: service.warranty || '30 Days Warranty',
      category: service.category || 'General'
    };
    services.push(newService);
    this.saveServices(services);
    return newService;
  }

  updateService(id, updatedFields) {
    const services = this.getServices();
    const idx = services.findIndex(s => s.id === id);
    if (idx !== -1) {
      services[idx] = { ...services[idx], ...updatedFields };
      this.saveServices(services);
      return services[idx];
    }
    return null;
  }

  deleteService(id) {
    let services = this.getServices();
    services = services.filter(s => s.id !== id);
    this.saveServices(services);
    return true;
  }

  resetServicesToDefault() {
    this.saveServices(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  }

  // Invoices
  getInvoices() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed reading invoices', e);
      return [];
    }
  }

  saveInvoices(invoices) {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      return true;
    } catch (e) {
      console.error('Failed saving invoices', e);
      return false;
    }
  }

  getInvoiceById(id) {
    if (!id) return null;
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === id || inv.invoiceNumber === id || String(inv.id) === String(id));
  }

  saveInvoice(invoiceData) {
    const invoices = this.getInvoices();
    if (invoiceData.id) {
      // Update existing
      const idx = invoices.findIndex(i => i.id === invoiceData.id);
      if (idx !== -1) {
        invoices[idx] = { ...invoices[idx], ...invoiceData, updatedAt: new Date().toISOString() };
        this.saveInvoices(invoices);
        return invoices[idx];
      }
    }
    
    // Create new
    const id = 'inv_' + Date.now();
    const newInvoice = {
      ...invoiceData,
      id,
      createdAt: new Date().toISOString()
    };
    invoices.unshift(newInvoice); // Add to beginning
    this.saveInvoices(invoices);
    this.incrementInvoiceNumber();
    return newInvoice;
  }

  // Record Staff Verified Payment
  recordPayment(invoiceId, paymentMode = 'UPI', amountPaid = null) {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (idx !== -1) {
      const inv = invoices[idx];
      const paid = amountPaid !== null ? parseFloat(amountPaid) : inv.total;
      inv.amountPaid = paid;
      inv.balance = Math.max(0, inv.total - paid);
      inv.paymentMode = paymentMode;
      inv.status = inv.balance === 0 ? 'Paid' : (inv.amountPaid > 0 ? 'Partially Paid' : 'Pending');
      inv.paidAt = new Date().toISOString();
      inv.updatedAt = new Date().toISOString();
      this.saveInvoices(invoices);
      return inv;
    }
    return null;
  }

  deleteInvoice(id) {
    let invoices = this.getInvoices();
    invoices = invoices.filter(inv => inv.id !== id && inv.invoiceNumber !== id);
    this.saveInvoices(invoices);
    return true;
  }

  // Auth / Session
  isAuthenticated() {
    const settings = this.getSettings();
    const isLocked = localStorage.getItem('mms_is_locked') === 'true';
    if (!settings.requireLogin && !isLocked) {
      return true;
    }
    const session = sessionStorage.getItem(STORAGE_KEYS.AUTH);
    return session === 'true';
  }

  login(pin) {
    const settings = this.getSettings();
    const validPin = (settings.pinCode || '9966').trim();
    const inputPin = String(pin || '').trim();
    if (inputPin === validPin) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      localStorage.removeItem('mms_is_locked');
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem('mms_auth_token');
    localStorage.setItem('mms_is_locked', 'true');
  }

  // Backup & Restore
  exportAllData() {
    const exportData = {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      services: this.getServices(),
      invoices: this.getInvoices()
    };
    return JSON.stringify(exportData, null, 2);
  }

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.services) this.saveServices(data.services);
      if (data.invoices) this.saveInvoices(data.invoices);
      return { success: true, count: data.invoices?.length || 0 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetAllToDefault() {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    this.init();
    return true;
  }
}

// Global instance
window.storage = new StorageManager();
