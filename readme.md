# 📱 Mani Mobile Services - Mobile Repair Billing Web Application

A fast, lightweight, and professional billing web application tailored specifically for **Mani Mobile Services** (Mobile Phone Repair & Service Shop). Designed for maximum speed and simplicity—allowing shop staff to generate a complete, professional service invoice in **30–60 seconds**.

---

## 🚀 How to Run the App (100% Free, Zero Installation)

No Node.js, Python, or complex installations are required.

### Method 1: Instant Launch (Double Click)
1. In this folder, simply double-click **`Open_Mani_Mobile_Services.bat`** (or right-click **`index.html`** and select **Open with Google Chrome / Microsoft Edge**).
2. The application opens immediately in your web browser!

### Method 2: Multi-Device / Wi-Fi Network (For Tablets & Mobile Counters)
If you want to use the billing app on mobile phones or tablets connected to your shop's Wi-Fi network:
1. Right-click **`start-server.ps1`** and choose **Run with PowerShell**.
2. It displays your local shop IP address (e.g. `http://192.168.1.5:8080`).
3. Open that URL on any phone, tablet, or secondary counter PC connected to the same Wi-Fi!

---

## 🌟 Key Features & Workflow

### 1. 📊 Interactive Dashboard & Recent Invoices
- 4 High-Impact Metric Cards:
  1. **Today's Invoices**
  2. **Today's Revenue (₹)**
  3. **Pending Payments (₹)**
  4. **Completed Services**
- Large prominent **`+ CREATE NEW INVOICE`** button (`Ctrl + N` shortcut).
- **Recent Invoices**:
  - Entire invoice row is clickable to open full details using unique ID.
  - Complete details shown: Customer Name, Phone, Device Brand & Model, Complaint, Services with Individual Prices & Warranty, Subtotal, Discount, Total, Payment Mode, Amount Paid, Balance, Status, and Date.
  - Working buttons: **Edit Invoice**, **Print Invoice**, **Download PDF**, **Send WhatsApp**, **Back to Dashboard**, and **Mark as Paid**.

### 2. ⚡ Rapid Invoice Creation (30–60 Seconds)
- **Customer Details**: Name (autofocused), 10-digit Mobile Number, Optional Address.
- **Mobile Details**:
  - Quick-select brand chips (**Samsung, Apple / iPhone, Vivo, Oppo, Xiaomi / Redmi, Realme, OnePlus, Motorola, Other**).
  - Model Name (e.g., Galaxy S23, iPhone 13, Note 12 Pro).
  - Optional IMEI number.
  - Quick-select complaint chips (**Screen Broken, Battery Issue, Charging Port, Water Damage, Mic/Speaker, Dead Phone**).
- **Service Details with Warranty**:
  - Dropdown of common repair services with default prices.
  - **Warranty Selection for each service** (`30 Days Warranty`, `60 Days`, `90 Days`, `6 Months`, `1 Year`, `Testing (2 Days)`, `No Warranty`, or custom).
  - Multi-service support (add/remove rows seamlessly).
- **Auto-Calculations**:
  - Automatic Subtotal, optional Discount (₹), optional GST (disabled by default to avoid clutter).
  - Automatic Balance calculation (`Total - Amount Paid`).
  - Automatic Status marking: **PAID** (Green), **PARTIALLY PAID** (Amber), or **PENDING** (Red).
  - Quick Fill payment buttons (**Full Amount**, **50% Advance**, **₹0 Pending**).

### 3. 📱 Dynamic UPI QR Code & Payment Verification
- When **UPI** is selected in payment mode:
  - Generates and displays an **Amount-Based UPI QR Code** in real time!
  - **Amount-Based Logic**:
    - If customer has paid advance (e.g. Total: ₹5,000, Paid: ₹2,000, Balance: ₹3,000), QR code requests the **remaining balance: ₹3,000**.
    - If customer has paid ₹0, QR code requests the **full amount: ₹5,000**.
  - QR Code contains: Shop UPI ID (`manimobileservices@upi`), Business Name, Amount, Reference.
  - **Staff Payment Verification**: Scanning only initiates payment on the customer's phone. Staff must confirm funds in the shop's UPI account before marking as Paid.
  - Working **"Mark as Paid"** button records payment mode, amount paid, timestamp, and updates balance to ₹0.

### 4. 📲 Send Invoice to WhatsApp as PDF (1-Click Sharing & Web Share API)
- After billing is complete, click **SEND PDF INVOICE ON WHATSAPP**:
  1. **Mobile Devices (Web Share API)**: Automatically generates the invoice PDF and triggers native OS sharing directly to WhatsApp contact with invoice attached and pre-filled message in 1 click!
  2. **Desktop / Web Fallback**:
     - Automatically generates and downloads the clean invoice PDF (`Mani_Mobile_Services_INV-XXXX.pdf`).
     - Opens WhatsApp with the customer's phone number (`+91`).
     - Pre-fills the exact message format:
       ```text
       Hello [Customer Name],

       Thank you for choosing Mani Mobile Services.

       Your invoice #[Invoice Number] is ready.

       Total Amount: ₹[Amount]
       Payment Status: [Status]

       Please find your invoice PDF attached.

       Thank you.
       ```
     - Displays the interactive **WhatsApp PDF Attachment Guide** popup (`Step 1: PDF Downloaded -> Step 2: WhatsApp Chat Opened -> Step 3: Attach (📎) Document & Send`).
  3. **Complete PDF Contents**:
     - Mani Mobile Services logo & branding
     - Business name, Address & Phone
     - Invoice number & Date/Time
     - Customer name & Mobile number
     - Handset model & Complaint
     - Services performed, Individual Prices & **Warranty for each service**
     - Subtotal, Discount & Final Total
     - Payment Mode, Amount Paid, Balance & Payment Status
     - Terms & Conditions and Thank-You Message
     - Dynamic UPI Payment QR Code

### 5. 🔒 Complete Logout & Session Security
- **Logout Confirmation**: Clicking **Logout** displays a confirmation dialog (*"Are you sure you want to logout? Cancel / Logout"*).
- **Session Clearing**: Completely purges session tokens and locks the interface.
- **Route & Back-Button Protection**: Pressing browser Back or Forward buttons cannot bypass the login screen.
- **Refresh Protection**: Refreshing the page keeps the application locked on the login screen until the 4-digit PIN is entered.
- **Feedback**: Displays *"You have been logged out successfully."* upon logout.

### 6. 🖨️ Printing & 1-Click PDF Download
- **Print Invoice**: Optimized CSS layout supporting both standard **A4 invoices** and **80mm thermal receipt printers**.
- **Download PDF**: Direct one-click PDF generation saved with filename `Mani_Mobile_Services_INV-XXXX.pdf`.
- **UPI QR on Bill**: If invoice has a pending balance, a scannable UPI QR code is included on the printed/PDF bill for convenient customer payment.

### 6. 🗂️ Invoice History & Search
- Live real-time search by **Customer Name, Mobile Number, Invoice Number, or Handset Model**.
- Filter by status (**Paid, Partially Paid, Pending**) and date range (**Today, This Month, All Time**).
- Actions: **View, Print, PDF, WhatsApp, Edit, and Delete**.

### 7. 🛠️ Service Management Catalog
- Pre-loaded with common mobile repairs and default warranties.
- Staff can add new services with custom default warranties and prices, or restore factory defaults anytime.

### 8. ⚙️ Business Settings & Live UPI Preview
- Shop Profile: Business Name, Tagline, Phone, WhatsApp, Address.
- **UPI Settings Card**:
  - UPI ID (`manimobileservices@upi`)
  - UPI Business Name (`Mani Mobile Services`)
  - Enable UPI QR Code toggle (ON/OFF)
  - **Live QR Code Preview**: Automatically updates QR preview as you type your UPI ID or test amount!
- Optional GST Invoicing (off by default).
- Optional 4-digit Staff PIN lock (Default: `1234`).
- **Data Backup & Restore**: One-click JSON backup export and file import.

---

## 🔒 Data Storage & Privacy

All application data is securely stored inside your web browser's **LocalStorage**.
- Works 100% offline.
- No third-party servers storing customer phone numbers or business revenue.
- Use the **Download Backup (JSON)** button in Settings periodically to save a backup to your computer or USB drive.

---

## 🌐 Free Cloud Hosting Options

If you wish to host this website on the internet for free so staff can access it from anywhere:

1. **GitHub Pages (Free)**:
   - Create a free GitHub repository.
   - Upload all files from this folder.
   - Go to Settings -> Pages -> Deploy from branch `main` -> Save.
   - Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

2. **Netlify Drop (Free)**:
   - Visit [app.netlify.com/drop](https://app.netlify.com/drop).
   - Drag and drop this folder.
   - It will be live in 10 seconds with a free `.netlify.app` web address.

---

*Built with ❤️ for Mani Mobile Services.*
