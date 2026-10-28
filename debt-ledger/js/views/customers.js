/**
 * views/customers.js - واجهة قائمة الزبائن وإدارتهم
 */

window.renderCustomersView = function(container) {
  const customers = window.appStore.getCustomers();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--color-primary);">دليل الزبائن</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem;">إجمالي ${customers.length} زبون مسجل في النظام</p>
      </div>
      <button onclick="window.openAddCustomerModal()" class="btn btn-primary">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        إضافة زبون جديد
      </button>
    </div>

    <!-- شريط البحث -->
    <div class="card" style="padding: 14px; margin-bottom: 16px;">
      <div class="input-with-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input type="text" id="customer-search-input" class="form-control" placeholder="ابحث باسم الزبون أو رقم الهاتف..." oninput="window.filterCustomersList(this.value)">
      </div>
    </div>

    <!-- حاوية قائمة الزبائن -->
    <div id="customers-list-container" class="customer-list">
      ${window.renderCustomerCardsHtml(customers)}
    </div>
  `;
};

window.renderCustomerCardsHtml = function(customersList) {
  if (customersList.length === 0) {
    return `
      <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 12px; color: var(--text-light);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <p style="font-weight: 600;">لم يتم العثور على زبائن مطابقة للبحث</p>
      </div>
    `;
  }

  return customersList.map(cust => {
    const balance = window.appStore.getCustomerBalance(cust.id);
    const hasDebt = balance > 0;

    return `
      <div class="customer-card-item">
        <div class="customer-info" style="flex: 1;">
          <h4 style="color: var(--text-main);">${cust.name}</h4>
          <p>
            <span>📞 ${cust.phone}</span>
            ${cust.address ? `<span style="margin-right: 12px;">📍 ${cust.address}</span>` : ''}
          </p>
        </div>

        <div class="customer-debt-amount" style="margin-left: 8px;">
          <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">الرصيد المستحق</span>
          <span class="amount" style="color: ${hasDebt ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${window.appStore.formatCurrency(balance)}
          </span>
          <span class="badge ${hasDebt ? 'badge-danger' : 'badge-success'}" style="margin-top: 4px;">
            ${hasDebt ? 'مطلوب دين' : 'خالص'}
          </span>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button onclick="window.appRouter.navigate('statement', { customerId: '${cust.id}' })" class="btn btn-outline btn-sm" title="عرض كشف الحساب">
            كشف حساب
          </button>
          <button onclick="window.appRouter.navigate('invoice', { customerId: '${cust.id}' })" class="btn btn-outline btn-sm" style="color: var(--color-danger); border-color: #fecaca;" title="بيع آجل جديد">
            + دين
          </button>
          <button onclick="window.appRouter.navigate('payment', { customerId: '${cust.id}' })" class="btn btn-outline btn-sm" style="color: var(--color-success); border-color: #a7f3d0;" title="تسجيل تسديد">
            تسديد
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.filterCustomersList = function(query) {
  const q = query.trim().toLowerCase();
  const all = window.appStore.getCustomers();
  const filtered = all.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.phone.includes(q) || 
    (c.address && c.address.toLowerCase().includes(q))
  );
  document.getElementById('customers-list-container').innerHTML = window.renderCustomerCardsHtml(filtered);
};
