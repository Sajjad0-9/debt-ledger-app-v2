/**
 * app.js - المنسق العام وموجه الشاشات (Router & App Controller)
 */

class AppRouter {
  constructor() {
    this.currentView = 'dashboard';
    this.viewContainer = null;
    this.routes = {
      dashboard: window.renderDashboardView,
      customers: window.renderCustomersView,
      statement: window.renderStatementView,
      invoice: window.renderInvoiceView,
      payment: window.renderPaymentView,
      transactions: window.renderTransactionsView,
      settings: window.renderSettingsView,
      auth: window.renderAuthView
    };
  }

  init() {
    this.viewContainer = document.getElementById('view-container');
    
    // ربط أحداث شريط التنقل السفلي والجانبي
    document.querySelectorAll('[data-nav-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.getAttribute('data-nav-target');
        this.navigate(target);
      });
    });

    // الاستماع لتغييرات الـ Hash في الرابط للتوافق مع أزرار الرجوع في الهاتف
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // التحقق من الـ Hash الأولي أو الانتقال للوحة التحكم
    this.handleHashChange();
    
    // تسجيل Service Worker للـ PWA
    this.registerServiceWorker();

    // تحديث مؤشر المزامنة الأولي
    if (window.appStore && typeof window.appStore.updateSyncUI === 'function') {
      window.appStore.updateSyncUI();
    }
  }

  handleHashChange() {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    if (!rawHash) {
      this.navigate('dashboard', {}, false);
      return;
    }

    const [viewName, queryStr] = rawHash.split('?');
    const params = {};
    if (queryStr) {
      new URLSearchParams(queryStr).forEach((val, key) => {
        params[key] = val;
      });
    }

    if (this.routes[viewName]) {
      this.navigate(viewName, params, false);
    } else {
      this.navigate('dashboard', {}, false);
    }
  }

  navigate(viewName, params = {}, updateHash = true) {
    if (!this.routes[viewName]) {
      console.warn(`View '${viewName}' not found, falling back to dashboard`);
      viewName = 'dashboard';
    }

    this.currentView = viewName;

    // تحديث الرابط Hash لدعم زر الرجوع في الهاتف
    if (updateHash) {
      let queryStr = '';
      if (Object.keys(params).length > 0) {
        queryStr = '?' + new URLSearchParams(params).toString();
      }
      window.location.hash = `#/${viewName}${queryStr}`;
      return; // hashchange سيتكفل بالرسم
    }

    // تحديث التبويب النشط في القائمة الجانبية والشريط السفلي
    this.updateActiveTabs(viewName);

    // تفريغ ورسم الشاشة
    if (this.viewContainer) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.routes[viewName](this.viewContainer, params);
    }
  }

  updateActiveTabs(viewName) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-nav-target') === viewName);
    });

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-nav-target') === viewName);
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('PWA Service Worker registered:', reg.scope))
          .catch(err => console.log('Service Worker registration skipped/failed:', err));
      });
    }
  }
}

// إنشاء الموجه العام
window.appRouter = new AppRouter();

// إشعار عائم Toast
window.showToast = function(message, duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// إدارة النافذة المنبثقة لإضافة زبون
window.openAddCustomerModal = function() {
  const modal = document.getElementById('add-customer-modal');
  if (modal) {
    modal.classList.add('open');
    setTimeout(() => {
      const nameInput = document.getElementById('new-cust-name');
      if (nameInput) nameInput.focus();
    }, 150);
  }
};

window.closeAddCustomerModal = function() {
  const modal = document.getElementById('add-customer-modal');
  if (modal) {
    modal.classList.remove('open');
    const form = document.getElementById('add-customer-form');
    if (form) form.reset();
  }
};

window.handleCreateCustomerSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('new-cust-name').value;
  const phone = document.getElementById('new-cust-phone').value;
  const address = document.getElementById('new-cust-address').value;
  const notes = document.getElementById('new-cust-notes').value;

  if (!name || name.trim() === '') {
    alert('يرجى كتابة اسم الزبون');
    return;
  }

  const newCustomer = await window.appStore.addCustomer({
    name,
    phone,
    address,
    notes
  });

  window.closeAddCustomerModal();
  window.showToast(`تمت إضافة الزبون (${newCustomer.name}) بنجاح! ✓`);

  // إعادة تحميل الشاشة الحالية إذا كانت قائمة الزبائن أو الفاتورة
  if (window.appRouter.currentView === 'customers') {
    window.renderCustomersView(document.getElementById('view-container'));
  } else if (window.appRouter.currentView === 'invoice') {
    window.renderInvoiceView(document.getElementById('view-container'), { customerId: newCustomer.id });
  } else if (window.appRouter.currentView === 'statement') {
    window.renderStatementView(document.getElementById('view-container'), { customerId: newCustomer.id });
  }
};

// ==========================================
// إدارة نافذة ترحيل البيانات السحابية
// ==========================================
window.showMigrationModal = function(details) {
  const modal = document.getElementById('migration-modal');
  if (!modal) return;

  const userEl = document.getElementById('migration-user-email');
  const statsEl = document.getElementById('migration-stats-text');

  if (userEl) userEl.textContent = details.userEmail || '';
  if (statsEl) {
    statsEl.innerHTML = `
      <strong>${details.customersCount || 0}</strong> زبائن، 
      <strong>${details.invoicesCount || 0}</strong> فواتير بيع، 
      <strong>${details.paymentsCount || 0}</strong> تسديدات مقبوضة.
    `;
  }

  modal.classList.add('open');
};

window.closeMigrationModal = function() {
  const modal = document.getElementById('migration-modal');
  if (modal) {
    modal.classList.remove('open');
  }
};

// بدء التطبيق عند اكتمال تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter.init();
});
