/**
 * views/auth.js - واجهة تسجيل الدخول والمصادقة
 * مفعّل فيها تسجيل الدخول الحقيقي بحساب Google عبر Firebase Authentication
 * خيار رقم الهاتف معطل ومخفي مؤقتاً بناءً على المتطلبات.
 */

window.renderAuthView = function(container) {
  const user = window.firebaseService ? window.firebaseService.currentUser : null;

  if (user) {
    // حالة المستخدم المسجل بالفعل
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="card" style="text-align: center; padding: 32px 24px;">
          <div style="width: 72px; height: 72px; border-radius: var(--radius-full); margin: 0 auto 14px; overflow: hidden; border: 3px solid var(--color-primary); display: flex; align-items: center; justify-content: center; background: var(--bg-hover);">
            ${user.photoURL ? `<img src="${user.photoURL}" alt="الصورة الشخصية" style="width: 100%; height: 100%; object-fit: cover;">` : `
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            `}
          </div>

          <span class="badge badge-success" style="margin-bottom: 10px;">🟢 متصل بحساب Google</span>
          <h2 style="font-size: 1.3rem; color: var(--text-main); margin-bottom: 4px;">${user.displayName || 'صاحب المتجر'}</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">${user.email}</p>
          <div style="font-size: 0.75rem; color: var(--text-light); word-break: break-all; margin-bottom: 24px;">معرّف الحساب (UID): ${user.uid}</div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="window.appRouter.navigate('dashboard')" class="btn btn-primary btn-block">
              الذهاب إلى لوحة التحكم
            </button>
            <button onclick="window.handleLogout()" class="btn btn-outline btn-block" style="color: var(--color-danger); border-color: #fecaca;">
              تسجيل الخروج من الحساب
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // حالة عدم تسجيل الدخول
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="card" style="text-align: center; padding: 32px 24px;">
        <div class="auth-header">
          <img src="icons/icon-192.png" alt="شعار سجل الديون">
          <h2 style="font-size: 1.4rem; color: var(--color-primary); margin-bottom: 6px;">تطبيق سجل الديون</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">إدارة سحابية لديون ومبيعات الزبائن مع المزامنة الفورية</p>
        </div>

        <!-- زر الدخول الحقيقي عبر Google -->
        <button id="btn-google-login" onclick="window.handleGoogleLogin()" class="btn auth-btn-google btn-block" style="margin-bottom: 14px; min-height: 52px; font-size: 1rem;">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          تسجيل الدخول بحساب Google
        </button>

        <div id="auth-loading-spinner" style="display: none; margin: 12px 0; color: var(--color-primary); font-weight: 600; font-size: 0.9rem;">
          🔄 جاري التحقق وتسجيل الدخول عبر Google...
        </div>

        <!-- تنبيه حول رقم الهاتف (مخفي ومغلق مؤقتاً) -->
        <div style="background: var(--bg-hover); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-color); margin: 18px 0; font-size: 0.82rem; color: var(--text-muted); text-align: right;">
          ℹ️ <strong>ملاحظة:</strong> خيار تسجيل الدخول عبر رقم الهاتف (SMS) معطّل مؤقتاً في هذه المرحلة ومربوط حالياً فقط بحساب Google الرسمي ومصادقة Firebase.
        </div>

        <div style="margin-top: 14px; padding-top: 16px; border-top: 1px solid var(--border-color);">
          <button onclick="window.appRouter.navigate('dashboard')" class="btn btn-outline btn-block" style="font-size: 0.9rem;">
            المتابعة بالوضع المحلي (دون تسجيل الدخول) ⚡
          </button>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">
            تُحفظ البيانات في ذاكرة المتصفح لهذا الجهاز فقط إذا لم تسجل الدخول.
          </p>
        </div>
      </div>
    </div>
  `;
};

// تنفيذ تسجيل الدخول عبر Google
window.handleGoogleLogin = async function() {
  if (!window.firebaseService) {
    alert('خدمة Firebase لم تكتمل تهيئتها بعد، يرجى التأكد من الاتصال بالإنترنت.');
    return;
  }

  const btn = document.getElementById('btn-google-login');
  const spinner = document.getElementById('auth-loading-spinner');

  if (btn) btn.style.display = 'none';
  if (spinner) spinner.style.display = 'block';

  try {
    const result = await window.firebaseService.loginWithGoogle();
    if (result.success) {
      window.showToast(`مرحباً بك! تم تسجيل الدخول بحساب ${result.user.displayName || result.user.email} ✓`);
      setTimeout(() => {
        window.appRouter.navigate('dashboard');
      }, 500);
    } else {
      if (btn) btn.style.display = 'flex';
      if (spinner) spinner.style.display = 'none';
      alert('تعذر تسجيل الدخول: ' + result.error);
    }
  } catch (err) {
    if (btn) btn.style.display = 'flex';
    if (spinner) spinner.style.display = 'none';
    alert('خطأ غير متوقع: ' + err.message);
  }
};

// تنفيذ تسجيل الخروج
window.handleLogout = async function() {
  if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك السحابي؟')) {
    if (window.firebaseService) {
      await window.firebaseService.logout();
      window.showToast('تم تسجيل الخروج بنجاح. عاد التطبيق للوضع المحلي.');
      window.appRouter.navigate('auth');
    }
  }
};
