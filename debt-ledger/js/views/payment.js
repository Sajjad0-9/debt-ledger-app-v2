/**
 * views/payment.js - واجهة تسجيل التسديدات المالية وخصم الديون
 */

window.renderPaymentView = function(container, params = {}) {
  const customers = window.appStore.getCustomers();
  const selectedCustomerId = params.customerId || (customers.length > 0 ? customers[0].id : '');
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--color-success);">
        تسجيل تسديد ومقبوضات (سند قبض)
      </h2>
      <p style="color: var(--text-muted); font-size: 0.85rem;">سجل المبلغ المستلم وسيتم خصمه فوراً من رصيد دين الزبون</p>
    </div>

    <form id="payment-form" onsubmit="event.preventDefault(); window.submitPayment();">
      <!-- اختيار الزبون -->
      <div class="card">
        <div class="form-group">
          <label class="form-label">الزبون المسدد *</label>
          <select id="payment-customer-id" class="form-control" required style="font-weight: 700;" onchange="window.updatePaymentCustomerBanner(this.value)">
            <option value="">-- اختر الزبون --</option>
            ${customers.map(c => `
              <option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>
                ${c.name} (${c.phone})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- شريط رصيد الزبون الحالي -->
        <div id="payment-customer-balance-box" style="background: var(--bg-hover); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <span style="font-size: 0.9rem; color: var(--text-muted);">إجمالي الدين المستحق الحالي:</span>
          <span id="payment-current-debt-text" style="font-size: 1.25rem; font-weight: 800; color: var(--color-danger);">
            0 د.ع
          </span>
        </div>
      </div>

      <!-- تفاصيل الدفعة المسددة -->
      <div class="card">
        <!-- مبلغ التسديد -->
        <div class="form-group">
          <label class="form-label">المبلغ المسدد (${window.appStore.data.settings.currency}) *</label>
          <input type="number" id="payment-amount" class="form-control" placeholder="أدخل المبلغ المسدد (مثال: 25000)" required min="250" step="250" style="font-size: 1.25rem; font-weight: 800; color: var(--color-success);">
          
          <!-- أزرار سريعة للمبالغ -->
          <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            <button type="button" onclick="window.setFullDebtAmount()" class="btn btn-outline btn-sm" style="color: var(--color-success); border-color: #a7f3d0;">
              تسديد كامل الدين
            </button>
            <button type="button" onclick="window.setHalfDebtAmount()" class="btn btn-outline btn-sm">
              تسديد النصف (50%)
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <!-- طريقة الدفع -->
          <div class="form-group">
            <label class="form-label">طريقة الدفع والاستلام *</label>
            <select id="payment-method" class="form-control" required style="font-weight: 600;">
              <option value="نقدي" selected>💵 نقدي (كاش في المحل)</option>
              <option value="زين كاش">📱 محفظة زين كاش (ZainCash)</option>
              <option value="حوالة أو مصرف">🏦 تحويل بنكي / ماستر كارد</option>
              <option value="أخرى">📝 أخرى</option>
            </select>
          </div>

          <!-- تاريخ التسديد القابل للتعديل -->
          <div class="form-group">
            <label class="form-label">تاريخ التسديد (قابل للتعديل) *</label>
            <input type="date" id="payment-date" class="form-control" value="${todayStr}" required style="font-weight: 600;">
          </div>
        </div>

        <!-- ملاحظات الدفعة -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">ملاحظات أو رقم إشعار التحويل (اختياري)</label>
          <input type="text" id="payment-notes" class="form-control" placeholder="مثال: استلمتها من أخيه، رقم إشعار المحفظة #1234">
        </div>
      </div>

      <!-- زر الحفظ والتأكيد -->
      <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
        <button type="submit" class="btn btn-success btn-block" style="min-height: 54px; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
          ✓ تأكيد استلام الدفعة وخصمها من الحساب
        </button>
      </div>
    </form>
  `;

  if (selectedCustomerId) {
    window.updatePaymentCustomerBanner(selectedCustomerId);
  }
};

window.updatePaymentCustomerBanner = function(customerId) {
  const textEl = document.getElementById('payment-current-debt-text');
  if (!textEl) return;

  if (!customerId) {
    textEl.textContent = '0 ' + window.appStore.data.settings.currency;
    return;
  }

  const balance = window.appStore.getCustomerBalance(customerId);
  textEl.textContent = window.appStore.formatCurrency(balance);
  textEl.dataset.currentBalance = balance;
};

window.setFullDebtAmount = function() {
  const textEl = document.getElementById('payment-current-debt-text');
  const amountInput = document.getElementById('payment-amount');
  const bal = Number(textEl.dataset.currentBalance) || 0;
  if (bal > 0) {
    amountInput.value = bal;
  } else {
    alert('هذا الزبون ليس بذمته أي دين حالياً');
  }
};

window.setHalfDebtAmount = function() {
  const textEl = document.getElementById('payment-current-debt-text');
  const amountInput = document.getElementById('payment-amount');
  const bal = Number(textEl.dataset.currentBalance) || 0;
  if (bal > 0) {
    amountInput.value = Math.round(bal / 2);
  }
};

window.submitPayment = function() {
  const customerId = document.getElementById('payment-customer-id').value;
  const amount = Number(document.getElementById('payment-amount').value) || 0;
  const method = document.getElementById('payment-method').value;
  const date = document.getElementById('payment-date').value;
  const notes = document.getElementById('payment-notes').value;

  if (!customerId) {
    alert('يرجى اختيار الزبون المسدد');
    return;
  }

  if (amount <= 0) {
    alert('يرجى كتابة مبلغ تسديد صحيح أكبر من صفر');
    return;
  }

  window.appStore.addPayment({
    customerId,
    amount,
    method,
    date,
    notes
  });

  window.showToast('تم تسجيل التسديد وخصم المبلغ من الحساب بنجاح! ✓');
  setTimeout(() => {
    window.appRouter.navigate('statement', { customerId });
  }, 600);
};
