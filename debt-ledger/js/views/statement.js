/**
 * views/statement.js - واجهة كشف حساب الزبون
 * تعرض تفاصيل الفواتير والتسديدات والرصيد التراكمي بدقة مع خيارات الطباعة والمشاركة
 */

window.renderStatementView = function(container, params = {}) {
  const customers = window.appStore.getCustomers();
  let selectedCustomerId = params.customerId || (customers.length > 0 ? customers[0].id : null);

  if (!selectedCustomerId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 16px;">لا يوجد زبائن مسجلين حالياً لعرض كشف الحساب.</p>
        <button onclick="window.openAddCustomerModal()" class="btn btn-primary">إضافة زبون جديد أولاً</button>
      </div>
    `;
    return;
  }

  const statement = window.appStore.getCustomerStatement(selectedCustomerId);
  const cust = statement ? statement.customer : null;
  const balance = statement ? statement.currentBalance : 0;
  const isDebtor = balance > 0;

  // حساب إجمالي المدين والدائن
  const totalDebit = statement ? statement.transactions.reduce((s, t) => s + t.debit, 0) : 0;
  const totalCredit = statement ? statement.transactions.reduce((s, t) => s + t.credit, 0) : 0;

  container.innerHTML = `
    <!-- ترويسة اختيار الزبون والتحكم -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary);">كشف حساب الزبون</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem;">سجل تفصيلي لجميع المبيعات الآجلة والدفعات المسددة</p>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="window.printStatement()" class="btn btn-outline btn-sm">
          🖨️ طباعة الكشف
        </button>
        <button onclick="window.shareStatementViaWhatsApp('${selectedCustomerId}')" class="btn btn-success btn-sm">
          💬 إرسال عبر واتساب
        </button>
      </div>
    </div>

    <!-- قائمة اختيار الزبون -->
    <div class="card" style="padding: 16px; margin-bottom: 16px;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">اختر الزبون لعرض حسابه:</label>
        <select id="statement-customer-select" class="form-control" onchange="window.appRouter.navigate('statement', { customerId: this.value })">
          ${customers.map(c => `
            <option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>
              ${c.name} - (هاتف: ${c.phone})
            </option>
          `).join('')}
        </select>
      </div>
    </div>

    <!-- بطاقة معلومات الزبون والرصيد الحالي -->
    <div class="card" style="border-right: 5px solid ${isDebtor ? 'var(--color-danger)' : 'var(--color-success)'};">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
            ${cust.name}
          </h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            <span>📞 ${cust.phone}</span>
            ${cust.address ? `<span style="margin-right: 14px;">📍 ${cust.address}</span>` : ''}
          </p>
          ${cust.notes ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 4px;">ملاحظة: ${cust.notes}</p>` : ''}
        </div>

        <div style="text-align: left; background: ${isDebtor ? 'var(--color-danger-light)' : 'var(--color-success-light)'}; padding: 12px 20px; border-radius: var(--radius-md);">
          <span style="font-size: 0.85rem; font-weight: 600; color: ${isDebtor ? 'var(--color-danger)' : 'var(--color-success)'}; display: block;">
            ${isDebtor ? 'صافي الدين المطلوب حالياً' : 'الحساب خالص'}
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: ${isDebtor ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${window.appStore.formatCurrency(balance)}
          </span>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 16px; pt: 12px; border-top: 1px solid var(--border-color);">
        <button onclick="window.appRouter.navigate('invoice', { customerId: '${selectedCustomerId}' })" class="btn btn-outline btn-sm" style="color: var(--color-danger);">
          + تسجيل فاتورة دين
        </button>
        <button onclick="window.appRouter.navigate('payment', { customerId: '${selectedCustomerId}' })" class="btn btn-outline btn-sm" style="color: var(--color-success);">
          + تسجيل تسديد
        </button>
      </div>
    </div>

    <!-- بطاقات ملخص الأرقام -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
      <div class="card" style="margin-bottom: 0; padding: 14px;">
        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">إجمالي المشتريات الآجلة (عليه)</span>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-danger); margin-top: 4px;">
          ${window.appStore.formatCurrency(totalDebit)}
        </div>
      </div>
      <div class="card" style="margin-bottom: 0; padding: 14px;">
        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">إجمالي التسديدات المستلمة (له)</span>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-success); margin-top: 4px;">
          ${window.appStore.formatCurrency(totalCredit)}
        </div>
      </div>
      <div class="card" style="margin-bottom: 0; padding: 14px;">
        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">الرصيد المتبقي بذمته</span>
        <div style="font-size: 1.25rem; font-weight: 800; color: ${isDebtor ? 'var(--color-danger)' : 'var(--color-success)'}; margin-top: 4px;">
          ${window.appStore.formatCurrency(balance)}
        </div>
      </div>
    </div>

    <!-- جدول كشف الحساب التفصيلي -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">جدول الحركات التفصيلي</h3>
        <span style="font-size: 0.85rem; color: var(--text-muted);">${statement.transactions.length} حركة مالية</span>
      </div>

      <div class="table-responsive">
        <table class="custom-table" id="statement-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ</th>
              <th>نوع الحركة</th>
              <th>البيان والتفاصيل</th>
              <th>مدين (عليه)</th>
              <th>دائن (له)</th>
              <th>الرصيد المتبقي</th>
            </tr>
          </thead>
          <tbody>
            ${statement.transactions.length === 0 ? `
              <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">لا توجد أي حركات مالية مسجلة لهذا الزبون</td></tr>
            ` : statement.transactions.map((tx, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">${tx.date}</td>
                <td>
                  <span class="badge ${tx.rawType === 'invoice' ? 'badge-danger' : 'badge-success'}">
                    ${tx.type}
                  </span>
                </td>
                <td style="font-size: 0.85rem; max-width: 260px;">
                  ${tx.details || '-'}
                </td>
                <td style="font-weight: 700; color: var(--color-danger);">
                  ${tx.debit > 0 ? window.appStore.formatCurrency(tx.debit) : '-'}
                </td>
                <td style="font-weight: 700; color: var(--color-success);">
                  ${tx.credit > 0 ? window.appStore.formatCurrency(tx.credit) : '-'}
                </td>
                <td style="font-weight: 800; color: ${tx.balanceAfter > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; white-space: nowrap;">
                  ${window.appStore.formatCurrency(tx.balanceAfter)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

window.printStatement = function() {
  window.print();
};

window.shareStatementViaWhatsApp = function(customerId) {
  const statement = window.appStore.getCustomerStatement(customerId);
  if (!statement) return;

  const shopName = window.appStore.data.settings.shopName;
  const cust = statement.customer;
  const balance = window.appStore.formatCurrency(statement.currentBalance);

  let msg = `السلام عليكم ورحمة الله وبركاته أخي الكريم ${cust.name}،\n\n`;
  msg += `نود إعلامكم بكشف حسابكم المسجل لدى (${shopName}):\n`;
  msg += `• الرصيد المستحق بذمتكم: *${balance}*\n`;
  msg += `• تاريخ الكشف: ${new Date().toLocaleDateString('ar-IQ')}\n\n`;
  msg += `شاكرين حسن تعاملكم وأهلاً وسهلاً بكم دائماً.`;

  const phone = cust.phone.replace(/[^0-9]/g, '');
  let url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  if (phone.startsWith('07') || phone.startsWith('7')) {
    const intlPhone = '964' + phone.replace(/^0+/, '');
    url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  }
  window.open(url, '_blank');
};
