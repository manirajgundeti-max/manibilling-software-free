/**
 * Invoice Service for Mani Mobile Services
 * Handles invoice calculation, formatting, WhatsApp message crafting, QR generation, print preparation, and rendering
 */

class InvoiceService {
  constructor() {
    this.currentInvoice = null;
  }

  // Format currency
  formatCurrency(amount, symbol = '₹') {
    const num = parseFloat(amount) || 0;
    return `${symbol}${num.toLocaleString('en-IN')}`;
  }

  // Format date to DD/MM/YYYY
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  }

  // Format timestamp (ISO or date) to readable date & time
  formatDateTime(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return isoStr;
    }
  }

  // Clean phone number for WhatsApp wa.me link
  cleanPhoneNumber(rawPhone, defaultCountryCode = '91') {
    if (!rawPhone) return '';
    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    }
    return cleaned;
  }

  // Calculate totals and payment balance
  calculateInvoiceTotals(services, discountVal = 0, amountPaidVal = 0, gstEnabled = false, gstPercent = 18) {
    let subtotal = 0;
    if (Array.isArray(services)) {
      services.forEach(item => {
        subtotal += parseFloat(item.price) || 0;
      });
    }

    const discount = Math.max(0, parseFloat(discountVal) || 0);
    const taxableAmount = Math.max(0, subtotal - discount);
    
    let gstAmount = 0;
    if (gstEnabled) {
      gstAmount = Math.round((taxableAmount * (parseFloat(gstPercent) || 18)) / 100);
    }

    const total = taxableAmount + gstAmount;
    const amountPaid = Math.max(0, parseFloat(amountPaidVal) || 0);
    const balance = Math.max(0, total - amountPaid);

    let status = 'Pending';
    if (amountPaid >= total && total > 0) {
      status = 'Paid';
    } else if (amountPaid > 0 && balance > 0) {
      status = 'Partially Paid';
    } else if (total === 0 && amountPaid === 0) {
      status = 'Paid';
    }

    return {
      subtotal,
      discount,
      gstEnabled,
      gstPercent,
      gstAmount,
      total,
      amountPaid,
      balance,
      status
    };
  }

  // Generate UPI Payment URI
  getUpiUri(upiId, businessName, amount, invoiceNumber) {
    const cleanId = (upiId || '').trim();
    const cleanAmt = Math.max(0, parseFloat(amount) || 0);
    const pn = encodeURIComponent(businessName || 'Mani Mobile Services');
    const tn = encodeURIComponent(`Invoice ${invoiceNumber || ''}`);
    return `upi://pay?pa=${encodeURIComponent(cleanId)}&pn=${pn}&am=${cleanAmt}&cu=INR&tn=${tn}`;
  }

  // Generate QR Code data URL using QRious (offline) or fallback QRServer API
  getQrCodeDataUrl(text, size = 180) {
    if (window.QRious) {
      try {
        const qr = new window.QRious({
          value: text,
          size: size,
          level: 'M'
        });
        return qr.toDataURL();
      } catch (e) {
        console.warn('QRious failed, using fallback', e);
      }
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }

  // Build exact professional WhatsApp message per user specification
  generateWhatsAppMessage(invoice, settings) {
    const sym = settings.currency || '₹';
    const custName = invoice.customer?.name || 'Customer';
    const totalAmount = this.formatCurrency(invoice.total, sym);
    const statusText = invoice.status || 'Paid';
    const businessName = settings.businessName || 'Mani Mobile Services';

    return `Hello ${custName},

Thank you for choosing ${businessName}.

Your invoice #${invoice.invoiceNumber} is ready.

Total Amount: ${totalAmount}
Payment Status: ${statusText}

Please find your invoice PDF attached.

Thank you.`;
  }

  // Get WhatsApp direct chat link
  sendViaWhatsApp(invoice, settings) {
    const cleanPhone = this.cleanPhoneNumber(invoice.customer?.phone);
    const messageText = this.generateWhatsAppMessage(invoice, settings);
    const encodedMsg = encodeURIComponent(messageText);

    if (cleanPhone) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      } else {
        // Direct WhatsApp Web chat link for Desktop
        return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
      }
    }
    return `https://api.whatsapp.com/send?text=${encodedMsg}`;
  }

  // Clean, professional printable HTML for preview, thermal, print, and PDF
  renderInvoiceHTML(invoice, settings, isThermal = false) {
    const sym = settings.currency || '₹';
    const formattedDate = this.formatDate(invoice.date);
    const brandModel = [invoice.device.brand, invoice.device.model].filter(Boolean).join(' ') || 'Mobile Device';

    const statusBadgeClass = invoice.status === 'Paid' 
      ? 'status-badge-paid' 
      : invoice.status === 'Partially Paid' 
        ? 'status-badge-partial' 
        : 'status-badge-pending';

    // Services table rows with Warranty
    let servicesHtml = '';
    (invoice.services || []).forEach((srv) => {
      const warrantyText = srv.warranty || '30 Days Warranty';
      servicesHtml += `
        <tr class="service-row border-b border-gray-100">
          <td class="text-left py-2.5 pr-2">
            <div class="font-bold text-gray-900 text-xs md:text-sm">${srv.name}</div>
          </td>
          <td class="text-center py-2.5 px-2 whitespace-nowrap">
            <span class="inline-block px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-800 rounded border border-blue-100">
              🛡️ ${warrantyText}
            </span>
          </td>
          <td class="text-right py-2.5 pl-2 font-bold text-gray-900 text-xs md:text-sm">
            ${this.formatCurrency(srv.price, sym)}
          </td>
        </tr>
      `;
    });

    // Determine if UPI QR code should be rendered on invoice
    // When payment mode is UPI (or when there is balance due and UPI QR enabled)
    let upiQrHtml = '';
    const shouldShowUpi = settings.enableUpiQr && settings.upiId && (invoice.paymentMode === 'UPI' || invoice.balance > 0);
    
    if (shouldShowUpi) {
      // Amount to request on QR:
      // If customer has unpaid balance, request remaining balance.
      // If balance is 0, request total amount (as bill payment reference).
      const qrAmount = invoice.balance > 0 ? invoice.balance : invoice.total;
      const upiUri = this.getUpiUri(settings.upiId, settings.upiBusinessName || settings.businessName, qrAmount, invoice.invoiceNumber);
      const qrDataUrl = this.getQrCodeDataUrl(upiUri, 150);

      upiQrHtml = `
        <div class="upi-pay-box mt-4 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-left space-y-1">
            <div class="flex items-center space-x-1.5">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="font-bold text-gray-900 text-xs sm:text-sm">Scan with Any UPI App</span>
            </div>
            <div class="text-[11px] text-gray-600">GPay, PhonePe, Paytm, BHIM</div>
            <div class="font-mono text-xs text-blue-900 font-bold bg-white px-2 py-0.5 rounded border border-blue-200 inline-block">
              ${settings.upiId}
            </div>
            <div class="text-xs font-black text-emerald-800 pt-0.5">
              ${invoice.balance > 0 ? `Payable Balance: ${this.formatCurrency(qrAmount, sym)}` : `Invoice Total: ${this.formatCurrency(qrAmount, sym)}`}
            </div>
            <div class="text-[10px] text-slate-500 italic">
              *Staff will confirm payment upon receipt.
            </div>
          </div>
          <div class="p-2 bg-white rounded-lg border border-blue-200 shadow-sm flex flex-col items-center">
            <img src="${qrDataUrl}" alt="UPI Payment QR" class="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
            <span class="text-[10px] font-bold text-blue-800 tracking-wider uppercase mt-1">UPI Pay ₹${qrAmount}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="invoice-sheet ${isThermal ? 'thermal-receipt' : 'standard-invoice'} bg-white text-gray-900 p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
        
        <!-- Header with Shop Branding -->
        <div class="text-center pb-4 border-b-2 border-gray-800">
          <div class="flex items-center justify-center space-x-2 mb-1">
            <div class="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2zM15 7l-6 6" /></svg>
            </div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-gray-900 uppercase">${settings.businessName}</h1>
          </div>
          <p class="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-widest">${settings.tagline || 'Mobile Repair & Service'}</p>
          <div class="text-xs text-gray-600 mt-2 space-y-0.5">
            ${settings.phone ? `<p class="font-semibold"><span class="text-gray-500 font-normal">Phone:</span> ${settings.phone}</p>` : ''}
            ${settings.address ? `<p><span class="text-gray-500">Address:</span> ${settings.address}</p>` : ''}
            ${settings.gstNumber && invoice.gstEnabled ? `<p class="font-mono text-[11px]"><span class="text-gray-500">GSTIN:</span> ${settings.gstNumber}</p>` : ''}
          </div>
        </div>

        <!-- Meta & Customer Details Grid -->
        <div class="grid grid-cols-2 gap-4 py-4 text-xs md:text-sm border-b border-gray-200">
          <div>
            <div class="text-gray-500 text-[11px] uppercase tracking-wider font-bold">Customer Details</div>
            <div class="font-black text-gray-900 text-sm md:text-base mt-0.5">${invoice.customer.name || 'Walk-in Customer'}</div>
            <div class="font-mono font-bold text-gray-800 mt-0.5">Mobile: ${invoice.customer.phone || 'N/A'}</div>
            ${invoice.customer.address ? `<div class="text-gray-600 text-xs mt-0.5">${invoice.customer.address}</div>` : ''}
          </div>
          <div class="text-right">
            <div class="inline-block text-left">
              <div class="flex justify-between gap-4 py-0.5">
                <span class="text-gray-500 font-semibold">Invoice No:</span>
                <span class="font-black font-mono text-blue-800">${invoice.invoiceNumber}</span>
              </div>
              <div class="flex justify-between gap-4 py-0.5">
                <span class="text-gray-500 font-semibold">Date:</span>
                <span class="font-bold text-gray-900">${formattedDate}</span>
              </div>
              ${invoice.time ? `
              <div class="flex justify-between gap-4 py-0.5">
                <span class="text-gray-500 font-semibold">Time:</span>
                <span class="text-gray-700">${invoice.time}</span>
              </div>` : ''}
            </div>
          </div>
        </div>

        <!-- Mobile Handset & Problem Complaint Box -->
        <div class="bg-slate-50 p-3.5 rounded-lg my-4 text-xs border border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <span class="text-gray-500 font-semibold">Mobile Handset:</span>
              <span class="font-black text-gray-900 ml-1">${brandModel}</span>
              ${invoice.device.imei ? `<span class="text-gray-500 block text-[11px] mt-0.5 font-mono">IMEI: ${invoice.device.imei}</span>` : ''}
            </div>
            <div>
              <span class="text-gray-500 font-semibold">Complaint / Problem:</span>
              <span class="font-bold text-amber-900 ml-1">${invoice.device.problem || 'General Checkup & Service'}</span>
            </div>
          </div>
        </div>

        <!-- Services Table with Warranty Column -->
        <div class="my-4 overflow-x-auto">
          <table class="w-full text-xs md:text-sm">
            <thead>
              <tr class="border-b-2 border-gray-800 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                <th class="text-left py-2">Service Description</th>
                <th class="text-center py-2 px-2 w-36">Warranty</th>
                <th class="text-right py-2 w-28">Price</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${servicesHtml}
            </tbody>
          </table>
        </div>

        <!-- Totals & Payment Summary -->
        <div class="border-t-2 border-gray-800 pt-3 text-xs md:text-sm">
          <div class="flex justify-end">
            <div class="w-full md:w-72 space-y-1.5">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span class="font-bold text-gray-900">${this.formatCurrency(invoice.subtotal, sym)}</span>
              </div>

              ${invoice.discount > 0 ? `
              <div class="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span class="font-bold">-${this.formatCurrency(invoice.discount, sym)}</span>
              </div>` : ''}

              ${invoice.gstEnabled && invoice.gstAmount > 0 ? `
              <div class="flex justify-between text-gray-600 text-xs">
                <span>GST (${invoice.gstPercent}%)</span>
                <span class="font-bold">${this.formatCurrency(invoice.gstAmount, sym)}</span>
              </div>` : ''}

              <div class="flex justify-between text-base font-black text-gray-900 border-t-2 border-b-2 border-gray-800 py-1.5 mt-1">
                <span>TOTAL AMOUNT</span>
                <span class="text-blue-900">${this.formatCurrency(invoice.total, sym)}</span>
              </div>

              <div class="flex justify-between text-gray-600 pt-1 text-xs">
                <span>Payment Mode</span>
                <span class="font-bold text-gray-900 uppercase">${invoice.paymentMode || 'Cash'}</span>
              </div>

              <div class="flex justify-between text-gray-600 text-xs">
                <span>Amount Paid</span>
                <span class="font-bold text-gray-900">${this.formatCurrency(invoice.amountPaid, sym)}</span>
              </div>

              <div class="flex justify-between ${invoice.balance > 0 ? 'text-red-600 font-black' : 'text-gray-600'} text-xs">
                <span>Balance Due</span>
                <span>${this.formatCurrency(invoice.balance, sym)}</span>
              </div>

              <div class="pt-2 text-center">
                <span class="inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${statusBadgeClass}">
                  PAYMENT STATUS: ${invoice.status.toUpperCase()}
                </span>
                ${invoice.paidAt && invoice.status === 'Paid' ? `
                  <div class="text-[10px] text-emerald-700 font-medium mt-1">
                    Confirmed on ${this.formatDateTime(invoice.paidAt)} (${invoice.paymentMode})
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        ${upiQrHtml}

        <!-- Terms & Conditions -->
        ${settings.terms ? `
        <div class="mt-6 pt-4 border-t border-gray-200 text-[10px] text-gray-500 leading-relaxed">
          <div class="font-bold uppercase tracking-wider text-gray-700 mb-1">Terms & Conditions:</div>
          <div class="whitespace-pre-line">${settings.terms}</div>
        </div>` : ''}

        <!-- Footer / Thank you -->
        <div class="mt-5 pt-3 text-center border-t border-dashed border-gray-300">
          <p class="text-xs font-bold text-gray-800">${settings.thankYouMessage || 'Thank you for choosing Mani Mobile Services!'}</p>
          <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">${settings.businessName}</p>
        </div>
      </div>
    `;
  }
}

// Global instance
window.invoiceService = new InvoiceService();
