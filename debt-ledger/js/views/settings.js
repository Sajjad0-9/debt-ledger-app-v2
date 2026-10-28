/**
 * views/settings.js - واجهة الإعدادات والنسخ الاحتياطي وحالة Firebase السحابية
 */

window.renderSettingsView = function(container) {
  const store = window.appStore;
  const settings = store.data.settings || {};
  const isCloud = store.mode === 'cloud' && store.currentUser;
  const user = store.currentUser;

  container.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--color-primary);">
        الإعدادات والربط السحابي
      </h2>
      <p style="color: var(--text-muted); font-size: 0.85rem;">تخصيص بيانات المحل، إدارة النسخ الاحتياطي، ومتابعة حالة Firebase</p>
    </div>

    <!-- حالة الاتصال السحابي بـ Firebase -->
    <div class="card" style="border: 2px solid ${isCloud ? '#86efac' : '#fed7aa'}; background: ${isCloud ? '#f0fdf4' : '#fffbeb'};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: ${isCloud ? '#dcfce7' : '#ffedd5'}; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
            ${isCloud ? '☁️' : '💾'}
          </div>
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: ${isCloud ? 'var(--color-success)' : 'var(--color-warning)'}; margin-bottom: 2px;">
              ${isCloud ? 'متصل بالسحابة (Cloud Firestore)' : 'يعمل بالوضع المحلي (Local Mode)'}
            </h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              مشروع Firebase: <strong>${window.firebaseService ? window.firebaseService.config.projectId : 'debt-ledger-ea8c4'}</strong>
            </p>
          </div>
        </div>

        <span class="badge ${isCloud ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.85rem;">
          ${isCloud ? '🟢 متزامن تلقائياً' : '🟡 تخزين جهاز محلي'}
        </span>
      </div>

      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.06); font-size: 0.85rem;">
        ${isCloud ? `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <p>👤 <strong>الحساب المسجل:</strong> ${user.displayName || ''} (${user.email})</p>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">معرّف المستخدم (UID): ${user.uid}</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.triggerManualMigrationPrompt()" class="btn btn-outline btn-sm" title="ترحيل أي بيانات سابقة من هذا الجهاز">
                ترحيل بيانات الجهاز
              </button>
              <button onclick="window.handleLogout()" class="btn btn-outline btn-sm" style="color: var(--color-danger); border-color: #fecaca;">
                تسجيل الخروج
              </button>
            </div>
          </div>
        ` : `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <p style="color: var(--text-muted);">لتمكين الحفظ السحابي التلقائي وحماية البيانات من الحذف عند مسح المتصفح، يرجى تسجيل الدخول بحساب Google.</p>
            <button onclick="window.appRouter.navigate('auth')" class="btn btn-primary btn-sm">
              تسجيل الدخول الآن
            </button>
          </div>
        `}
      </div>
    </div>

    <!-- بيانات المحل والعملة -->
    <div class="card">
      <h3 class="card-title" style="margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        🏪 بيانات المتجر / المحل
      </h3>
      <form id="settings-form" onsubmit="event.preventDefault(); window.saveShopSettings();">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label class="form-label">اسم المحل أو النشاط التجاري</label>
            <input type="text" id="settings-shop-name" class="form-control" value="${settings.shopName || ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label">رقم الهاتف للتواصل والفواتير</label>
            <input type="tel" id="settings-shop-phone" class="form-control" value="${settings.shopPhone || ''}">
          </div>

          <div class="form-group">
            <label class="form-label">العنوان / المنطقة</label>
            <input type="text" id="settings-shop-address" class="form-control" value="${settings.shopAddress || ''}">
          </div>

          <div class="form-group">
            <label class="form-label">رمز العملة الافتراضي</label>
            <input type="text" id="settings-currency" class="form-control" value="${settings.currency || 'د.ع'}" required>
            <span style="font-size: 0.78rem; color: var(--text-muted);">الافتراضي: د.ع (الدينار العراقي)</span>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          💾 حفظ التعديلات ${isCloud ? 'في السحابة' : 'محلياً'}
        </button>
      </form>
    </div>

    <!-- النسخ الاحتياطي والأمان (JSON Backup & Restore) -->
    <div class="card">
      <h3 class="card-title" style="margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        💾 النسخ الاحتياطي واستعادة البيانات (JSON)
      </h3>
      <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">
        يمكنك تنزيل نسخة احتياطية كاملة بصيغة JSON والاحتفاظ بها كملف مستقل، أو استعادة ملف احتياطي سابق في أي وقت.
      </p>

      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <!-- تصدير النسخة -->
        <button onclick="window.exportBackupFile()" class="btn btn-primary">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          تصدير وحفظ نسخة احتياطية (JSON)
        </button>

        <!-- استعادة النسخة -->
        <label class="btn btn-outline" style="cursor: pointer;">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12"></path>
          </svg>
          استعادة نسخة من ملف
          <input type="file" id="backup-file-input" accept=".json" style="display: none;" onchange="window.importBackupFile(this)">
        </label>

        <!-- استعادة البيانات التجريبية -->
        <button onclick="window.confirmResetData()" class="btn btn-outline" style="color: var(--color-danger); border-color: #fecaca;">
          إعادة ضبط البيانات الأصلية
        </button>
      </div>
    </div>

    <!-- حول التطبيق والمعلومات التقنية -->
    <div class="card" style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">
      <p style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">تطبيق سجل الديون - الإصدار 1.2.0 (ربط Firebase)</p>
      <p>مبني بتقنيات الويب المعيارية PWA مع دعم التزامن اللحظي عبر Cloud Firestore والمصادقة الآمنة عبر Google</p>
    </div>
  `;
};

window.saveShopSettings = async function() {
  const shopName = document.getElementById('settings-shop-name').value.trim();
  const shopPhone = document.getElementById('settings-shop-phone').value.trim();
  const shopAddress = document.getElementById('settings-shop-address').value.trim();
  const currency = document.getElementById('settings-currency').value.trim() || 'د.ع';

  await window.appStore.updateSettings({
    shopName,
    shopPhone,
    shopAddress,
    currency
  });

  const brandEl = document.querySelector('.header-brand-mobile h1');
  if (brandEl) brandEl.textContent = shopName;

  window.showToast('تم حفظ إعدادات المحل بنجاح! ✓');
};

window.exportBackupFile = function() {
  const json = window.appStore.exportBackupJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `debt-ledger-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.showToast('تم تنزيل ملف النسخة الاحتياطية بنجاح 💾');
};

window.importBackupFile = function(inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const isCloud = window.appStore.mode === 'cloud';
    if (isCloud) {
      if (!confirm('أنت متصل بحساب سحابي. هل ترغب في استيراد هذه النسخة ورفعها إلى حسابك السحابي في Firebase ومزامنتها؟')) {
        return;
      }
    }

    const res = await window.appStore.importBackupJSON(e.target.result);
    if (res.success) {
      window.showToast('تم استعادة النسخة الاحتياطية بنجاح! ✓');
      setTimeout(() => window.location.reload(), 800);
    } else {
      alert('خطأ أثناء الاستيراد: ' + res.error);
    }
  };
  reader.readAsText(file);
};

window.confirmResetData = function() {
  if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى الحالة التجريبية الأصلية؟')) {
    window.appStore.resetToSeed();
    window.showToast('تمت إعادة ضبط البيانات بنجاح!');
  }
};

window.triggerManualMigrationPrompt = function() {
  if (!window.appStore.currentUser) {
    alert('يرجى تسجيل الدخول أولاً للترحيل إلى السحابة.');
    return;
  }
  let localData = null;
  try {
    localData = JSON.parse(localStorage.getItem('debt_ledger_app_data_v1'));
  } catch (e) {}

  const cCount = localData && localData.customers ? localData.customers.length : 0;
  const iCount = localData && localData.invoices ? localData.invoices.length : 0;
  const pCount = localData && localData.payments ? localData.payments.length : 0;

  window.showMigrationModal({
    customersCount: cCount,
    invoicesCount: iCount,
    paymentsCount: pCount,
    userEmail: window.appStore.currentUser.email
  });
};
