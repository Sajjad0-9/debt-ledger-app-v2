/**
 * views/dashboard.js - واجهة لوحة التحكم الرئيسية
 * تعرض ملخص الديون، عدد الزبائن، والأزرار الأساسية البارزة
 */

window.renderDashboardView = function(container) {
  const stats = window.appStore.getDashboardStats();
  const recentTransactions = window.appStore.getAllTransactions().slice(0, 5);

  container.innerHTML = `
    <!-- قسم الترحيب السريع وتاريخ اليوم -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--color-primary);">${window.appStore.data.settings.shopName}</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem;">ملخص حركة الديون والمبيعات الآجلة</p>
      </div>
      <div style="background: var(--bg-card); padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">
        📅 ${new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>

    <!-- شبكة بطاقات الإحصائيات الرئيسية -->
    <div class="kpi-grid">
      <div class="kpi-card danger">
        <span class="kpi-label">إجمالي الديون المستحقة بذمة الزبائن</span>
        <div class="kpi-value" style="color: var(--color-danger);">
          ${window.appStore.formatCurrency(stats.totalDebt)}
        </div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">على ${stats.debtorsCount} زبون لديهم ديون متبقية</span>
      </div>

      <div class="kpi-card primary">
        <span class="kpi-label">إجمالي عدد الزبائن المسجلين</span>
        <div class="kpi-value" style="color: var(--color-primary);">
          ${stats.totalCustomers} <span style="font-size: 0.95rem; font-weight: 600;">زبون</span>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">بإجمالي ${stats.totalInvoicesCount} فاتورة مسجلة</span>
      </div>

      <div class="kpi-card success">
        <span class="kpi-label">إجمالي التسديدات المستلمة</span>
        <div class="kpi-value" style="color: var(--color-success);">
          ${window.appStore.formatCurrency(stats.totalCollected)}
        </div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">${stats.totalPaymentsCount} عملية تسديد ناجحة</span>
      </div>
    </div>

    <!-- الأزرار الأساسية البارزة (المطلوبة بوضوح في المتطلبات) -->
    <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">الإجراءات السريعة</h3>
    <div class="quick-actions-grid">
      <!-- 1. بيع بالأجل -->
      <button onclick="window.appRouter.navigate('invoice')" class="quick-action-btn action-invoice">
        <div class="btn-icon-wrapper">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <span>بيع بالأجل (فاتورة)</span>
      </button>

      <!-- 2. تسجيل تسديد -->
      <button onclick="window.appRouter.navigate('payment')" class="quick-action-btn action-payment">
        <div class="btn-icon-wrapper">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <span>تسجيل تسديد</span>
      </button>

      <!-- 3. إضافة زبون -->
      <button onclick="window.openAddCustomerModal()" class="quick-action-btn action-customer">
        <div class="btn-icon-wrapper">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
        </div>
        <span>إضافة زبون</span>
      </button>

      <!-- 4. عرض كشف الحساب -->
      <button onclick="window.appRouter.navigate('statement')" class="quick-action-btn action-statement">
        <div class="btn-icon-wrapper">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <span>عرض كشف الحساب</span>
      </button>
    </div>

    <!-- جدول آخر الحركات المالية الحديثة -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">آخر العمليات والحركات المسجلة</h3>
        <button onclick="window.appRouter.navigate('transactions')" class="btn btn-outline btn-sm">عرض الكل</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الزبون</th>
              <th>نوع الحركة</th>
              <th>المبلغ</th>
              <th>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            ${recentTransactions.length === 0 ? `
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">لا توجد حركات مسجلة حتى الآن</td></tr>
            ` : recentTransactions.map(tx => `
              <tr>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${tx.date}</td>
                <td>
                  <strong style="color: var(--color-primary); cursor: pointer;" onclick="window.appRouter.navigate('statement', { customerId: '${tx.customerId}' })">
                    ${tx.customerName}
                  </strong>
                </td>
                <td>
                  <span class="badge ${tx.category === 'invoice' ? 'badge-danger' : 'badge-success'}">
                    ${tx.type}
                  </span>
                </td>
                <td>
                  <span style="font-weight: 800; color: ${tx.category === 'invoice' ? 'var(--color-danger)' : 'var(--color-success)'};">
                    ${tx.category === 'invoice' ? '+' : '-'} ${window.appStore.formatCurrency(tx.amount)}
                  </span>
                </td>
                <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${tx.notes || '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};
