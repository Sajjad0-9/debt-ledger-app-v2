/**
 * store.js - محرك إدارة البيانات والحسابات المالية
 * يدعم النمط الهجين:
 * 1. الوضع السحابي (Cloud Mode عبر Firestore) عند تسجيل الدخول بحساب Google.
 * 2. الوضع المحلي (Local Mode عبر LocalStorage) في حالة عدم تسجيل الدخول أو عدم الاتصال.
 */

const STORAGE_KEY = 'debt_ledger_app_data_v1';

// بيانات أولية واقعية بالدينار العراقي (د.ع)
const initialSeedData = {
  settings: {
    shopName: 'محل البركة للمواد الغذائية والكماليات',
    shopPhone: '07701234567',
    shopAddress: 'العراق - بغداد / الكرادة',
    currency: 'د.ع',
    allowNegative: false
  },
  customers: [
    {
      id: 'cust-1',
      name: 'أحمد حسين علي',
      phone: '07801122334',
      address: 'شارع فلسطين - قرب مدرسة الفرات',
      notes: 'زبون دائم وموثوق، يسدد نهاية كل شهر',
      createdAt: '2026-10-01'
    },
    {
      id: 'cust-2',
      name: 'حيدر جاسم الموسوي',
      phone: '07712345678',
      address: 'حي أور - محلة 320',
      notes: 'تسديد أسبوعي',
      createdAt: '2026-10-05'
    },
    {
      id: 'cust-3',
      name: 'كرار محمد السعدي',
      phone: '07509876543',
      address: 'الزعفرانية - شارع المعهد',
      notes: 'مكتب مقاولات',
      createdAt: '2026-10-10'
    }
  ],
  invoices: [
    {
      id: 'inv-101',
      customerId: 'cust-1',
      date: '2026-10-12',
      items: [
        { name: 'كيس رز عنبر 5 كغم', quantity: 2, unitPrice: 17500, total: 35000 },
        { name: 'زيت طعام الدرة 1 لتر', quantity: 4, unitPrice: 3000, total: 12000 },
        { name: 'شاي محمود 400 غرام', quantity: 2, unitPrice: 5000, total: 10000 }
      ],
      totalAmount: 57000,
      notes: 'مسواك الأسبوع الأول',
      createdAt: '2026-10-12T10:30:00'
    },
    {
      id: 'inv-102',
      customerId: 'cust-2',
      date: '2026-10-15',
      items: [
        { name: 'حليب كيكوز رقم 1', quantity: 3, unitPrice: 11000, total: 33000 },
        { name: 'حفاضات فاين بيبي كبير', quantity: 2, unitPrice: 14000, total: 28000 }
      ],
      totalAmount: 61000,
      notes: 'مشتريات أطفال',
      createdAt: '2026-10-15T16:15:00'
    },
    {
      id: 'inv-103',
      customerId: 'cust-1',
      date: '2026-10-20',
      items: [
        { name: 'صندوق معجون طماطة 12 قوطية', quantity: 1, unitPrice: 15000, total: 15000 },
        { name: 'طبقة بيض مائدة مزارع', quantity: 2, unitPrice: 6500, total: 13000 }
      ],
      totalAmount: 28000,
      notes: 'طلب منزلي إضافي',
      createdAt: '2026-10-20T19:45:00'
    }
  ],
  payments: [
    {
      id: 'pay-201',
      customerId: 'cust-1',
      date: '2026-10-18',
      amount: 40000,
      method: 'نقدي',
      notes: 'دفعة نقدية على الحساب في المحل',
      createdAt: '2026-10-18T18:00:00'
    },
    {
      id: 'pay-202',
      customerId: 'cust-2',
      date: '2026-10-22',
      amount: 25000,
      method: 'زين كاش',
      notes: 'تحويل محفظة إلكترونية رقم إشعار #8892',
      createdAt: '2026-10-22T14:20:00'
    }
  ]
};

class Store {
  constructor() {
    this.mode = 'local'; // 'local' | 'cloud'
    this.syncStatus = 'local'; // 'local' | 'syncing' | 'synced' | 'error'
    this.syncError = null;
    this.currentUser = null;
    this.data = this.loadData();
  }

  // تحميل البيانات من LocalStorage
  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('فشل قراءة البيانات من التخزين المحلي:', e);
    }
    this.saveData(initialSeedData);
    return JSON.parse(JSON.stringify(initialSeedData));
  }

  // حفظ البيانات في LocalStorage (تُستدعى في الوضع المحلي أو كنسخة أمان)
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || this.data));
    } catch (e) {
      console.error('فشل حفظ البيانات في التخزين المحلي:', e);
    }
  }

  // تحديث حالة المزامنة وتنبيه واجهة المستخدم
  setSyncStatus(status, errorMsg = null) {
    this.syncStatus = status;
    this.syncError = errorMsg;
    this.updateSyncUI();
  }

  updateSyncUI() {
    const indicator = document.getElementById('cloud-sync-indicator');
    if (!indicator) return;

    indicator.className = `sync-indicator ${this.syncStatus}`;
    const dot = indicator.querySelector('.sync-dot');
    const text = indicator.querySelector('.sync-text');

    if (this.syncStatus === 'synced') {
      text.textContent = 'سحابي مُتزامن';
      indicator.title = `متصل بحساب: ${this.currentUser ? this.currentUser.email : ''}`;
    } else if (this.syncStatus === 'syncing') {
      text.textContent = 'جاري المزامنة...';
      indicator.title = 'جاري إرسال التحديثات إلى Cloud Firestore';
    } else if (this.syncStatus === 'error') {
      text.textContent = 'خطأ مزامنة';
      indicator.title = this.syncError || 'حدث خطأ في الاتصال بالسحابة أو الصلاحيات';
    } else {
      text.textContent = 'محلي';
      indicator.title = 'يعمل التطبيق بذاكرة المتصفح المحلية (غير مسجل الدخول)';
    }
  }

  // التعامل مع تغير حالة المستخدم من Firebase Auth
  handleUserAuthChange(user) {
    if (user) {
      this.mode = 'cloud';
      this.currentUser = user;
      this.setSyncStatus('syncing');

      // بدء الاشتراك اللحظي في مستندات users/{uid}/...
      if (window.firebaseService) {
        window.firebaseService.subscribeUserData(user.uid, (cloudData) => {
          this.handleCloudDataUpdate(cloudData);
        }, (err) => {
          this.handleSyncError(err);
        });
      }
    } else {
      // تسجيل الخروج: العودة للوضع المحلي دون مسح أي بيانات
      this.mode = 'local';
      this.currentUser = null;
      this.data = this.loadData();
      this.setSyncStatus('local');
      this.refreshCurrentView();
    }
  }

  // معالجة وصول البيانات السحابية الحقيقية
  handleCloudDataUpdate(cloudData) {
    // دمج الإعدادات الافتراضية إذا لم تكن موجودة بعد في السحابة
    const defaultSettings = initialSeedData.settings;
    this.data = {
      settings: cloudData.settings || defaultSettings,
      customers: cloudData.customers || [],
      invoices: cloudData.invoices || [],
      payments: cloudData.payments || []
    };

    this.setSyncStatus('synced');
    this.refreshCurrentView();

    // فحص ما إذا كان هناك بيانات محلية سابقة مؤهلة للترحيل بموافقة المستخدم
    this.checkMigrationPrompt(this.currentUser.uid);
  }

  handleSyncError(err) {
    console.error('[Store Sync Error]:', err);
    let msg = 'خطأ في الاتصال بقاعدة البيانات السحابية';
    if (err && err.code === 'permission-denied') {
      msg = 'تم رفض الصلاحية من خادم Firestore (تحقق من قواعد الأمان)';
    } else if (err && err.code === 'unavailable') {
      msg = 'خادم Firestore غير متاح حالياً (انقطاع الاتصال)';
    } else if (err && err.message) {
      msg = err.message;
    }
    this.setSyncStatus('error', msg);
    if (window.showToast) {
      window.showToast('⚠️ ' + msg, 4000);
    }
  }

  // إعادة رسم الشاشة المفتوحة حالياً لتحديث الأرقام والجداول فورياً
  refreshCurrentView() {
    if (window.appRouter && window.appRouter.currentView) {
      const container = document.getElementById('view-container');
      if (container && window.appRouter.routes[window.appRouter.currentView]) {
        // الحفاظ على البارامترات الحالية إن وجدت
        const activeCustId = document.getElementById('statement-customer-select')?.value;
        const params = activeCustId ? { customerId: activeCustId } : {};
        window.appRouter.routes[window.appRouter.currentView](container, params);
      }
    }
  }

  // ==========================================
  // آلية فحص وعرض ترحيل البيانات بموافقة المستخدم
  // ==========================================
  checkMigrationPrompt(uid) {
    const migrationFlag = localStorage.getItem(`migrated_for_${uid}`);
    if (migrationFlag === 'true' || migrationFlag === 'dismissed') {
      return; // تم الترحيل أو رفضه مسبقاً لهذا الحساب
    }

    // قراءة البيانات المحلية الحالية في المتصفح
    let localData = null;
    try {
      localData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {}

    if (!localData) return;

    const localCustomersCount = localData.customers ? localData.customers.length : 0;
    const localInvoicesCount = localData.invoices ? localData.invoices.length : 0;
    const localPaymentsCount = localData.payments ? localData.payments.length : 0;

    // إذا كانت هناك بيانات في التخزين المحلي
    if (localCustomersCount > 0 || localInvoicesCount > 0) {
      window.showMigrationModal({
        customersCount: localCustomersCount,
        invoicesCount: localInvoicesCount,
        paymentsCount: localPaymentsCount,
        userEmail: this.currentUser.email
      });
    }
  }

  // تنفيذ الترحيل الآمن بعد موافقة المستخدم
  async executeMigration() {
    if (!this.currentUser || !window.firebaseService) {
      alert('يجب تسجيل الدخول بالخدمة السحابية أولاً');
      return;
    }

    try {
      this.setSyncStatus('syncing');
      const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const counts = await window.firebaseService.migrateLocalData(this.currentUser.uid, localData);
      
      // وسم الترحيل كمكتمل لهذا المستخدم دون مسح التخزين المحلي
      localStorage.setItem(`migrated_for_${this.currentUser.uid}`, 'true');
      this.setSyncStatus('synced');

      window.showToast(`تم ترحيل البيانات بنجاح: (${counts.customers} زبائن، ${counts.invoices} فواتير، ${counts.payments} تسديدات) ✓`);
      window.closeMigrationModal();
    } catch (err) {
      console.error('Migration failed:', err);
      this.setSyncStatus('error', err.message);
      alert('فشل ترحيل البيانات: ' + err.message);
    }
  }

  // تجاهل الترحيل والاعتماد على السحابة فقط
  dismissMigration() {
    if (this.currentUser) {
      localStorage.setItem(`migrated_for_${this.currentUser.uid}`, 'dismissed');
    }
    window.closeMigrationModal();
    window.showToast('تم تجاهل الترحيل. بياناتك المحلية محفوظة على هذا الجهاز.');
  }

  // ==========================================
  // العمليات المحاسبية وإدارة السجلات
  // ==========================================

  formatCurrency(num) {
    const val = Number(num) || 0;
    return new Intl.NumberFormat('ar-IQ').format(val) + ' ' + (this.data.settings?.currency || 'د.ع');
  }

  getCustomers() {
    return this.data.customers || [];
  }

  getCustomerById(id) {
    return (this.data.customers || []).find(c => c.id === id);
  }

  addCustomer(customer) {
    const newCustomer = {
      id: 'cust-' + Date.now(),
      name: customer.name.trim(),
      phone: customer.phone.trim() || 'غير مسجل',
      address: customer.address?.trim() || '',
      notes: customer.notes?.trim() || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.data.customers.unshift(newCustomer);

    if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
      this.setSyncStatus('syncing');
      window.firebaseService.saveCustomer(this.currentUser.uid, newCustomer)
        .then(() => this.setSyncStatus('synced'))
        .catch(err => this.handleSyncError(err));
    } else {
      this.saveData();
    }

    return newCustomer;
  }

  updateCustomer(id, updatedFields) {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.customers[index] = { ...this.data.customers[index], ...updatedFields };

      if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
        this.setSyncStatus('syncing');
        window.firebaseService.saveCustomer(this.currentUser.uid, this.data.customers[index])
          .then(() => this.setSyncStatus('synced'))
          .catch(err => this.handleSyncError(err));
      } else {
        this.saveData();
      }

      return this.data.customers[index];
    }
    return null;
  }

  deleteCustomer(id) {
    this.data.customers = this.data.customers.filter(c => c.id !== id);
    this.data.invoices = this.data.invoices.filter(inv => inv.customerId !== id);
    this.data.payments = this.data.payments.filter(p => p.customerId !== id);

    if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
      this.setSyncStatus('syncing');
      window.firebaseService.deleteCustomer(this.currentUser.uid, id)
        .then(() => this.setSyncStatus('synced'))
        .catch(err => this.handleSyncError(err));
    } else {
      this.saveData();
    }
  }

  getCustomerBalance(customerId) {
    const totalInvoices = (this.data.invoices || [])
      .filter(inv => inv.customerId === customerId)
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    const totalPayments = (this.data.payments || [])
      .filter(p => p.customerId === customerId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return totalInvoices - totalPayments;
  }

  getDashboardStats() {
    let totalDebt = 0;
    let debtorsCount = 0;

    (this.data.customers || []).forEach(cust => {
      const bal = this.getCustomerBalance(cust.id);
      if (bal > 0) {
        totalDebt += bal;
        debtorsCount++;
      }
    });

    const totalCustomers = (this.data.customers || []).length;
    const totalInvoicesCount = (this.data.invoices || []).length;
    const totalPaymentsCount = (this.data.payments || []).length;
    const totalCollected = (this.data.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalDebt,
      debtorsCount,
      totalCustomers,
      totalInvoicesCount,
      totalPaymentsCount,
      totalCollected
    };
  }

  addInvoice(invoiceData) {
    const invoice = {
      id: 'inv-' + Date.now(),
      customerId: invoiceData.customerId,
      date: invoiceData.date || new Date().toISOString().split('T')[0],
      items: invoiceData.items.map(item => ({
        name: item.name.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
      })),
      totalAmount: Number(invoiceData.totalAmount) || 0,
      notes: invoiceData.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    this.data.invoices.unshift(invoice);

    if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
      this.setSyncStatus('syncing');
      window.firebaseService.saveInvoice(this.currentUser.uid, invoice)
        .then(() => this.setSyncStatus('synced'))
        .catch(err => this.handleSyncError(err));
    } else {
      this.saveData();
    }

    return invoice;
  }

  addPayment(paymentData) {
    const payment = {
      id: 'pay-' + Date.now(),
      customerId: paymentData.customerId,
      date: paymentData.date || new Date().toISOString().split('T')[0],
      amount: Number(paymentData.amount) || 0,
      method: paymentData.method || 'نقدي',
      notes: paymentData.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    this.data.payments.unshift(payment);

    if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
      this.setSyncStatus('syncing');
      window.firebaseService.savePayment(this.currentUser.uid, payment)
        .then(() => this.setSyncStatus('synced'))
        .catch(err => this.handleSyncError(err));
    } else {
      this.saveData();
    }

    return payment;
  }

  getCustomerStatement(customerId) {
    const customer = this.getCustomerById(customerId);
    if (!customer) return null;

    const invoices = (this.data.invoices || [])
      .filter(i => i.customerId === customerId)
      .map(i => ({
        id: i.id,
        date: i.date,
        type: 'فاتورة بيع آجل',
        rawType: 'invoice',
        debit: i.totalAmount,
        credit: 0,
        details: i.items.map(item => `${item.name} (${item.quantity} × ${(item.unitPrice || 0).toLocaleString('ar-IQ')})`).join('، '),
        notes: i.notes,
        createdAt: i.createdAt
      }));

    const payments = (this.data.payments || [])
      .filter(p => p.customerId === customerId)
      .map(p => ({
        id: p.id,
        date: p.date,
        type: `تسديد (${p.method})`,
        rawType: 'payment',
        debit: 0,
        credit: p.amount,
        details: p.notes ? `ملاحظة: ${p.notes}` : `وصل سداد بطريقة ${p.method}`,
        notes: p.notes,
        createdAt: p.createdAt
      }));

    const combined = [...invoices, ...payments].sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const ledger = combined.map(item => {
      runningBalance += (item.debit - item.credit);
      return {
        ...item,
        balanceAfter: runningBalance
      };
    });

    return {
      customer,
      currentBalance: runningBalance,
      transactions: ledger
    };
  }

  getAllTransactions() {
    const invoices = (this.data.invoices || []).map(i => {
      const cust = this.getCustomerById(i.customerId);
      return {
        id: i.id,
        date: i.date,
        customerName: cust ? cust.name : 'زبون محذوف',
        customerId: i.customerId,
        type: 'فاتورة آجل',
        category: 'invoice',
        amount: i.totalAmount,
        notes: i.notes || (i.items ? i.items.length + ' مواد' : '')
      };
    });

    const payments = (this.data.payments || []).map(p => {
      const cust = this.getCustomerById(p.customerId);
      return {
        id: p.id,
        date: p.date,
        customerName: cust ? cust.name : 'زبون محذوف',
        customerId: p.customerId,
        type: 'تسديد واصل',
        category: 'payment',
        amount: p.amount,
        notes: `${p.method} ${p.notes ? '- ' + p.notes : ''}`
      };
    });

    return [...invoices, ...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  exportBackupJSON() {
    const payload = {
      app: 'سجل الديون',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      mode: this.mode,
      user: this.currentUser ? this.currentUser.email : 'local',
      data: this.data
    };
    return JSON.stringify(payload, null, 2);
  }

  async importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingData = parsed.data || parsed;

      if (incomingData.customers && incomingData.invoices && incomingData.payments) {
        this.data = incomingData;

        if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
          this.setSyncStatus('syncing');
          await window.firebaseService.migrateLocalData(this.currentUser.uid, incomingData);
          this.setSyncStatus('synced');
        } else {
          this.saveData();
        }

        this.refreshCurrentView();
        return { success: true };
      }
      return { success: false, error: 'الملف لا يحتوي على البنية الصحيحة لبيانات سجل الديون.' };
    } catch (e) {
      return { success: false, error: 'صيغة الملف غير صالحة: ' + e.message };
    }
  }

  async updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };

    if (this.mode === 'cloud' && this.currentUser && window.firebaseService) {
      this.setSyncStatus('syncing');
      window.firebaseService.saveSettings(this.currentUser.uid, this.data.settings)
        .then(() => this.setSyncStatus('synced'))
        .catch(err => this.handleSyncError(err));
    } else {
      this.saveData();
    }

    return this.data.settings;
  }

  resetToSeed() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    if (this.mode === 'local') {
      this.saveData();
    }
    this.refreshCurrentView();
    return this.data;
  }
}

// تصدير نسخة عامة
window.appStore = new Store();
