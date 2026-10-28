/**
 * views/invoice.js - واجهة تسجيل فاتورة بيع آجل متعددة المنتجات
 * مع الحساب التلقائي ودعم إضافة عدة منتجات بالدينار العراقي وتاريخ قابل للتعديل
 */

let currentInvoiceRows = [
  { id: 1, name: '', quantity: 1, unitPrice: 0, total: 0 }
];

window.renderInvoiceView = function(container, params = {}) {
  const customers = window.appStore.getCustomers();
  const selectedCustomerId = params.customerId || (customers.length > 0 ? customers[0].id : '');
  const todayStr = new Date().toISOString().split('T')[0];

  // تهيئة الصفوف الافتراضية
  currentInvoiceRows = [
    { id: Date.now(), name: '', quantity: 1, unitPrice: 0, total: 0 }
  ];

  container.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--color-danger);">
        تسجيل بيع بالأجل (فاتورة جديدة)
      </h2>
      <p style="color: var(--text-muted); font-size: 0.85rem;">أدخل تفاصيل المواد المباعة وسيتم ترحيل المبلغ تلقائياً إلى حساب الزبون</p>
    </div>

    <form id="new-invoice-form" onsubmit="event.preventDefault(); window.submitInvoice();">
      <!-- بيانات الزبون والتاريخ -->
      <div class="card">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <!-- اختيار الزبون -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">الزبون المدين *</label>
            <div style="display: flex; gap: 8px;">
              <select id="invoice-customer-id" class="form-control" required style="font-weight: 700;">
                <option value="">-- اختر الزبون --</option>
                ${customers.map(c => `
                  <option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>
                    ${c.name} (${c.phone})
                  </option>
                `).join('')}
              </select>
              <button type="button" onclick="window.openAddCustomerModal()" class="btn btn-outline" style="min-height: 48px; padding: 0 16px;" title="إضافة زبون جديد فوراً">
                + جديد
              </button>
            </div>
          </div>

          <!-- تاريخ الفاتورة القابل للتعديل -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">تاريخ الفاتورة (قابل للتعديل) *</label>
            <input type="date" id="invoice-date" class="form-control" value="${todayStr}" required style="font-weight: 600;">
          </div>
        </div>
      </div>

      <!-- جدول المواد والمنتجات -->
      <div class="card">
        <div class="card-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 14px;">
          <h3 class="card-title">قائمة المنتجات والمواد</h3>
          <button type="button" onclick="window.addInvoiceRow()" class="btn btn-primary btn-sm">
            + إضافة منتج آخر
          </button>
        </div>

        <!-- ترويسة الأعمدة للشاشات الكبيرة -->
        <div class="invoice-item-row" style="display: none; font-weight: 700; color: var(--text-muted); font-size: 0.85rem; padding: 0 4px 8px 4px; border-bottom: 1px solid var(--border-color);" id="desktop-invoice-header">
          <div>اسم المادة / المنتج</div>
          <div>الكمية</div>
          <div>سعر المفرد (${window.appStore.data.settings.currency})</div>
          <div>الإجمالي</div>
          <div></div>
        </div>

        <!-- حاوية صفوف المنتجات -->
        <div id="invoice-rows-container">
          <!-- يتم ملؤها ديناميكياً -->
        </div>

        <button type="button" onclick="window.addInvoiceRow()" class="btn btn-outline btn-block" style="border-style: dashed; margin-top: 10px;">
          + إضافة منتج أو سلعة إضافية
        </button>
      </div>

      <!-- الملاحظات والإجمالي النهائي -->
      <div class="card" style="background: #fffafa; border-color: #fee2e2;">
        <div class="form-group">
          <label class="form-label">ملاحظات الفاتورة (اختياري)</label>
          <input type="text" id="invoice-notes" class="form-control" placeholder="مثال: مسواك منزلي، طلبية هاتفية...">
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 1px solid #fecaca; margin-top: 12px;">
          <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">
            إجمالي الفاتورة المطلوب:
          </span>
          <span id="invoice-grand-total" style="font-size: 1.8rem; font-weight: 900; color: var(--color-danger);">
            0 د.ع
          </span>
        </div>

        <button type="submit" class="btn btn-danger btn-block" style="min-height: 54px; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">
          💾 حفظ الفاتورة وترحيل الدين إلى حساب الزبون
        </button>
      </div>
    </form>
  `;

  // التحقق من عرض الترويسة
  if (window.innerWidth >= 640) {
    const dH = document.getElementById('desktop-invoice-header');
    if (dH) dH.style.display = 'grid';
  }

  window.renderInvoiceRows();
};

window.renderInvoiceRows = function() {
  const container = document.getElementById('invoice-rows-container');
  if (!container) return;

  container.innerHTML = currentInvoiceRows.map((row, index) => `
    <div class="invoice-item-row" data-row-id="${row.id}">
      <div class="col-item">
        <label class="form-label" style="display: ${window.innerWidth < 640 ? 'block' : 'none'}; font-size: 0.8rem;">اسم المنتج:</label>
        <input type="text" class="form-control row-name" placeholder="اسم المنتج أو السلعة" value="${row.name}" oninput="window.updateRowField(${row.id}, 'name', this.value)" required>
      </div>
      <div>
        <label class="form-label" style="display: ${window.innerWidth < 640 ? 'block' : 'none'}; font-size: 0.8rem;">الكمية:</label>
        <input type="number" min="1" step="any" class="form-control row-qty" placeholder="1" value="${row.quantity}" oninput="window.updateRowField(${row.id}, 'quantity', this.value)" required style="text-align: center;">
      </div>
      <div>
        <label class="form-label" style="display: ${window.innerWidth < 640 ? 'block' : 'none'}; font-size: 0.8rem;">سعر الوحدة:</label>
        <input type="number" min="0" step="250" class="form-control row-price" placeholder="سعر الوحدة" value="${row.unitPrice || ''}" oninput="window.updateRowField(${row.id}, 'unitPrice', this.value)" required>
      </div>
      <div>
        <label class="form-label" style="display: ${window.innerWidth < 640 ? 'block' : 'none'}; font-size: 0.8rem;">الإجمالي:</label>
        <input type="text" class="form-control row-total" value="${window.appStore.formatCurrency(row.total)}" readonly style="background: var(--bg-hover); font-weight: 700; color: var(--color-danger);">
      </div>
      <div class="col-remove">
        <button type="button" onclick="window.removeInvoiceRow(${row.id})" class="btn btn-outline btn-sm" style="color: var(--color-danger); width: 36px; height: 36px; padding: 0;" title="حذف هذا السطر" ${currentInvoiceRows.length === 1 ? 'disabled' : ''}>
          ✕
        </button>
      </div>
    </div>
  `).join('');

  window.calculateInvoiceTotal();
};

window.addInvoiceRow = function() {
  currentInvoiceRows.push({
    id: Date.now() + Math.random(),
    name: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  });
  window.renderInvoiceRows();
};

window.removeInvoiceRow = function(id) {
  if (currentInvoiceRows.length <= 1) return;
  currentInvoiceRows = currentInvoiceRows.filter(r => r.id !== id);
  window.renderInvoiceRows();
};

window.updateRowField = function(id, field, value) {
  const row = currentInvoiceRows.find(r => r.id === id);
  if (!row) return;

  if (field === 'name') {
    row.name = value;
  } else if (field === 'quantity') {
    row.quantity = Number(value) || 0;
    row.total = row.quantity * row.unitPrice;
  } else if (field === 'unitPrice') {
    row.unitPrice = Number(value) || 0;
    row.total = row.quantity * row.unitPrice;
  }

  // تحديث حقل الإجمالي الخاص بهذا السطر دون إعادة رسم كامل الواجهة
  const rowEl = document.querySelector(`.invoice-item-row[data-row-id="${id}"]`);
  if (rowEl) {
    const totalInput = rowEl.querySelector('.row-total');
    if (totalInput) totalInput.value = window.appStore.formatCurrency(row.total);
  }

  window.calculateInvoiceTotal();
};

window.calculateInvoiceTotal = function() {
  const grandTotal = currentInvoiceRows.reduce((sum, r) => sum + (r.total || 0), 0);
  const grandTotalEl = document.getElementById('invoice-grand-total');
  if (grandTotalEl) {
    grandTotalEl.textContent = window.appStore.formatCurrency(grandTotal);
  }
  return grandTotal;
};

window.submitInvoice = function() {
  const customerId = document.getElementById('invoice-customer-id').value;
  const date = document.getElementById('invoice-date').value;
  const notes = document.getElementById('invoice-notes').value;
  const totalAmount = window.calculateInvoiceTotal();

  if (!customerId) {
    alert('يرجى اختيار الزبون أولاً');
    return;
  }

  if (totalAmount <= 0) {
    alert('يرجى إدخال أسعار وكميات صحيحة للمنتجات بحيث يكون إجمالي الفاتورة أكبر من صفر');
    return;
  }

  const validItems = currentInvoiceRows.filter(r => r.name.trim() !== '' && r.unitPrice > 0);
  if (validItems.length === 0) {
    alert('يرجى إدخال اسم منتج وسعر صحيح على الأقل');
    return;
  }

  const newInvoice = window.appStore.addInvoice({
    customerId,
    date,
    items: validItems,
    totalAmount,
    notes
  });

  window.showToast('تم حفظ الفاتورة وترحيل الدين بنجاح! ✓');
  setTimeout(() => {
    window.appRouter.navigate('statement', { customerId });
  }, 600);
};
