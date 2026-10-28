/**
 * views/transactions.js - واجهة سجل الحركات المالية الشامل
 */

window.renderTransactionsView = function(container) {
  const transactions = window.appStore.getAllTransactions();
  const customers = window.appStore.getCustomers();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary);">سجل الحركات المالية</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem;">أرشيف كامل لجميع الفواتير الآجلة وعمليات التسديد</p>
      </div>
      <div style="font-weight: 700; color: var(--text-muted); font-size: 0.9rem;">
        إجمالي الحركات: <span id="tx-count-badge" style="color: var(--color-primary);">${transactions.length}</span>
      </div>
    </div>

    <!-- بطاقة التصفية والبحث -->
    <div class="card" style="padding: 16px; margin-bottom: 16px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: end;">
        <!-- نوع الحركة -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">تصفية حسب نوع الحركة:</label>
          <select id="tx-filter-type" class="form-control" onchange="window.filterTransactions()">
            <option value="all">جميع الحركات</option>
            <option value="invoice">فواتير بيع آجل فقط</option>
            <option value="payment">تسديدات واصلة فقط</option>
          </select>
        </div>

        <!-- الزبون -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">تصفية حسب الزبون:</label>
          <select id="tx-filter-customer" class="form-control" onchange="window.filterTransactions()">
            <option value="all">كل الزبائن</option>
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>

        <!-- بحث نصي -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">بحث في التفاصيل والملاحظات:</label>
          <input type="text" id="tx-search-keyword" class="form-control" placeholder="اكتب للبحث..." oninput="window.filterTransactions()">
        </div>
      </div>
    </div>

    <!-- جدول الحركات -->
    <div class="card">
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ</th>
              <th>الزبون</th>
              <th>نوع الحركة</th>
              <th>المبلغ</th>
              <th>الملاحظات والتفاصيل</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody id="transactions-table-body">
            ${window.renderTransactionRowsHtml(transactions)}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

window.renderTransactionRowsHtml = function(txList) {
  if (txList.length === 0) {
    return `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">لا توجد أي حركات مطابقة للتصفية الحالية</td></tr>`;
  }

  return txList.map((tx, idx) => `
    <tr>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${idx + 1}</td>
      <td style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">${tx.date}</td>
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
        <span style="font-weight: 800; color: ${tx.category === 'invoice' ? 'var(--color-danger)' : 'var(--color-success)'}; white-space: nowrap;">
          ${tx.category === 'invoice' ? '+' : '-'} ${window.appStore.formatCurrency(tx.amount)}
        </span>
      </td>
      <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">
        ${tx.notes || '-'}
      </td>
      <td>
        <button onclick="window.appRouter.navigate('statement', { customerId: '${tx.customerId}' })" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">
          كشف الحساب
        </button>
      </td>
    </tr>
  `).join('');
};

window.filterTransactions = function() {
  const typeFilter = document.getElementById('tx-filter-type').value;
  const customerFilter = document.getElementById('tx-filter-customer').value;
  const keyword = document.getElementById('tx-search-keyword').value.trim().toLowerCase();

  let list = window.appStore.getAllTransactions();

  if (typeFilter !== 'all') {
    list = list.filter(t => t.category === typeFilter);
  }

  if (customerFilter !== 'all') {
    list = list.filter(t => t.customerId === customerFilter);
  }

  if (keyword) {
    list = list.filter(t => 
      t.customerName.toLowerCase().includes(keyword) || 
      (t.notes && t.notes.toLowerCase().includes(keyword)) ||
      t.date.includes(keyword)
    );
  }

  document.getElementById('transactions-table-body').innerHTML = window.renderTransactionRowsHtml(list);
  const countBadge = document.getElementById('tx-count-badge');
  if (countBadge) countBadge.textContent = list.length;
};
