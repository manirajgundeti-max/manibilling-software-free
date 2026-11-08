/**
 * Service Manager for Mani Mobile Services
 * Handles adding, editing, deleting, and selecting common repair services with warranty
 */

class ServiceManager {
  constructor() {
    this.services = [];
    this.init();
  }

  init() {
    this.services = window.storage.getServices();
  }

  getAll() {
    this.services = window.storage.getServices();
    return this.services;
  }

  renderServicesTable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const list = this.getAll();
    const settings = window.storage.getSettings();
    const sym = settings.currency || '₹';

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
            No services configured yet. Click "Add New Service" or reset to defaults.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = list.map((item, index) => `
      <tr class="hover:bg-gray-50 transition border-b border-gray-100">
        <td class="px-4 py-3 text-xs font-semibold text-gray-400">#${index + 1}</td>
        <td class="px-4 py-3 text-sm font-medium text-gray-900">
          <div class="font-bold text-gray-900">${item.name}</div>
          ${item.category ? `<span class="inline-block px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full mt-0.5">${item.category}</span>` : ''}
        </td>
        <td class="px-4 py-3 text-xs font-medium text-blue-800">
          <span class="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded">
            🛡️ ${item.warranty || '30 Days Warranty'}
          </span>
        </td>
        <td class="px-4 py-3 text-sm font-bold text-gray-800">${sym}${parseFloat(item.price || 0).toLocaleString('en-IN')}</td>
        <td class="px-4 py-3 text-right text-xs font-medium space-x-2">
          <button onclick="window.serviceManager.openEditModal('${item.id}')" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition">Edit</button>
          <button onclick="window.serviceManager.handleDelete('${item.id}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  openAddModal() {
    const modal = document.getElementById('service-modal');
    const title = document.getElementById('service-modal-title');
    const idInput = document.getElementById('service-id-input');
    const nameInput = document.getElementById('service-name-input');
    const priceInput = document.getElementById('service-price-input');
    const warrantyInput = document.getElementById('service-warranty-input');
    const categoryInput = document.getElementById('service-category-input');

    if (!modal) return;
    title.innerText = 'Add New Service';
    idInput.value = '';
    nameInput.value = '';
    priceInput.value = '';
    if (warrantyInput) warrantyInput.value = '30 Days Warranty';
    if (categoryInput) categoryInput.value = 'Hardware';

    modal.classList.remove('hidden');
    nameInput.focus();
  }

  openEditModal(id) {
    const item = this.getAll().find(s => s.id === id);
    if (!item) return;

    const modal = document.getElementById('service-modal');
    const title = document.getElementById('service-modal-title');
    const idInput = document.getElementById('service-id-input');
    const nameInput = document.getElementById('service-name-input');
    const priceInput = document.getElementById('service-price-input');
    const warrantyInput = document.getElementById('service-warranty-input');
    const categoryInput = document.getElementById('service-category-input');

    if (!modal) return;
    title.innerText = 'Edit Service';
    idInput.value = item.id;
    nameInput.value = item.name;
    priceInput.value = item.price;
    if (warrantyInput) warrantyInput.value = item.warranty || '30 Days Warranty';
    if (categoryInput) categoryInput.value = item.category || 'Hardware';

    modal.classList.remove('hidden');
    priceInput.focus();
  }

  closeModal() {
    const modal = document.getElementById('service-modal');
    if (modal) modal.classList.add('hidden');
  }

  handleSave() {
    const id = document.getElementById('service-id-input')?.value;
    const name = document.getElementById('service-name-input')?.value?.trim();
    const price = parseFloat(document.getElementById('service-price-input')?.value) || 0;
    const warranty = document.getElementById('service-warranty-input')?.value?.trim() || '30 Days Warranty';
    const category = document.getElementById('service-category-input')?.value || 'General';

    if (!name) {
      alert('Please enter a service name.');
      return;
    }

    if (id) {
      window.storage.updateService(id, { name, price, warranty, category });
      window.showToast('Service updated successfully', 'success');
    } else {
      window.storage.addService({ name, price, warranty, category });
      window.showToast('Service added successfully', 'success');
    }

    this.closeModal();
    this.renderServicesTable('services-table-body');
  }

  handleDelete(id) {
    const item = this.getAll().find(s => s.id === id);
    if (!item) return;

    if (confirm(`Are you sure you want to remove "${item.name}" from predefined services?`)) {
      window.storage.deleteService(id);
      window.showToast('Service removed', 'info');
      this.renderServicesTable('services-table-body');
    }
  }

  handleResetDefaults() {
    if (confirm('Reset services list to default mobile repair services? This will restore standard items and prices.')) {
      window.storage.resetServicesToDefault();
      window.showToast('Services reset to default', 'success');
      this.renderServicesTable('services-table-body');
    }
  }
}

// Global instance
window.serviceManager = new ServiceManager();
