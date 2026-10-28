/**
 * firebase-service.js - وحدة تهيئة وخدمات Firebase
 * يتضمن Firebase Authentication (Google Sign-In) و Cloud Firestore
 * تم ضبط مسارات البيانات حصراً تحت: users/{uid}/...
 */

// إعدادات مشروع Firebase الخاصة بالتطبيق
const firebaseConfig = {
  apiKey: "AIzaSyD1r3XoAD9XFU7LBnLn4EQVx6zpHKeBUBU",
  authDomain: "debt-ledger-ea8c4.firebaseapp.com",
  projectId: "debt-ledger-ea8c4",
  storageBucket: "debt-ledger-ea8c4.firebasestorage.app",
  messagingSenderId: "593668038048",
  appId: "1:593668038048:web:a375d52df50139144598c5",
  measurementId: "G-6JL35L5P5D"
};

class FirebaseService {
  constructor() {
    this.config = firebaseConfig;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.analytics = null;
    this.status = 'initializing'; // 'initializing' | 'ready' | 'offline' | 'error'
    this.currentUser = null;
    this.unsubscribeListeners = [];
    this.authSubscribers = [];
  }

  async init() {
    try {
      // استيراد حزم Firebase Web SDK المعيارية ديناميكياً
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js");
      const { 
        getAuth, 
        signInWithPopup, 
        GoogleAuthProvider, 
        signOut, 
        onAuthStateChanged 
      } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js");
      const { 
        getFirestore, 
        doc, 
        setDoc, 
        getDoc, 
        getDocs, 
        collection, 
        onSnapshot, 
        deleteDoc, 
        writeBatch 
      } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");

      // تهيئة تطبيق Firebase
      this.app = initializeApp(this.config);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.googleProvider = new GoogleAuthProvider();

      // تخزين الدوال المرجعية لـ Firestore
      this.firestoreOps = { doc, setDoc, getDoc, getDocs, collection, onSnapshot, deleteDoc, writeBatch };
      this.authOps = { signInWithPopup, signOut };

      // تهيئة التحليلات (Analytics) بأمان ودون التسبب بأي عطل
      try {
        const { getAnalytics, isSupported } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js");
        const supported = await isSupported();
        if (supported) {
          this.analytics = getAnalytics(this.app);
          console.log('[Firebase] تم تفعيل Analytics بنجاح');
        }
      } catch (analyticsErr) {
        console.warn('[Firebase] تعذر تفعيل Analytics (البيئة لا تدعمه أو اتصال محدود):', analyticsErr.message);
      }

      this.status = 'ready';
      console.log('[Firebase] تم تهيئة Firebase بنجاح (المشروع:', this.config.projectId, ')');

      // الاستماع لحالة جلسة المستخدم (Session Persistence)
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        console.log('[Firebase Auth] تغيرت حالة المستخدم:', user ? user.email : 'غير مسجل');
        this.notifyAuthSubscribers(user);
        if (window.appStore && typeof window.appStore.handleUserAuthChange === 'function') {
          window.appStore.handleUserAuthChange(user);
        }
      }, (error) => {
        console.error('[Firebase Auth Error]:', error);
        this.status = 'error';
        if (window.appStore && typeof window.appStore.handleSyncError === 'function') {
          window.appStore.handleSyncError(error);
        }
      });

      return true;
    } catch (err) {
      console.warn('[Firebase] تعذر تحميل مكتبات Firebase من CDN (قد يكون الجهاز غير متصل بالإنترنت):', err.message);
      this.status = 'offline';
      if (window.appStore && typeof window.appStore.handleSyncError === 'function') {
        window.appStore.handleSyncError({ code: 'offline', message: 'تعذر الاتصال بـ Firebase، يعمل التطبيق بالوضع المحلي.' });
      }
      return false;
    }
  }

  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.authSubscribers.push(callback);
      if (this.status === 'ready' || this.status === 'offline') {
        callback(this.currentUser);
      }
    }
  }

  notifyAuthSubscribers(user) {
    this.authSubscribers.forEach(cb => {
      try { cb(user); } catch (e) { console.error('Error in auth subscriber:', e); }
    });
  }

  // تسجيل الدخول الحقيقي عبر Google
  async loginWithGoogle() {
    if (!this.auth || !this.googleProvider) {
      throw new Error('خدمة Firebase Auth غير مهيأة بعد.');
    }
    try {
      const result = await this.authOps.signInWithPopup(this.auth, this.googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[Firebase Login Error]:', error);
      let userMsg = 'حدث خطأ أثناء تسجيل الدخول عبر Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        userMsg = 'تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.';
      } else if (error.code === 'auth/network-request-failed') {
        userMsg = 'فشل الاتصال بالإنترنت أثناء تسجيل الدخول.';
      } else if (error.code === 'auth/unauthorized-domain') {
        userMsg = 'النطاق الحالي غير مصرح به في إعدادات Firebase Authentication.';
      }
      return { success: false, error: userMsg, code: error.code };
    }
  }

  // تسجيل الخروج
  async logout() {
    if (!this.auth) return;
    this.unsubscribeAll();
    await this.authOps.signOut(this.auth);
    this.currentUser = null;
  }

  // إلغاء الاستماع اللحظي
  unsubscribeAll() {
    this.unsubscribeListeners.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    this.unsubscribeListeners = [];
  }

  // ==========================================
  // عمليات Cloud Firestore - مقيدة تحت users/{uid}/
  // ==========================================

  // الاشتراك اللحظي في كافة بيانات المستخدم
  subscribeUserData(uid, onData, onError) {
    if (!this.db || !uid) return;
    this.unsubscribeAll();

    const { collection, doc, onSnapshot } = this.firestoreOps;
    let localCache = {
      settings: null,
      customers: [],
      invoices: [],
      payments: []
    };

    let initialLoadDone = {
      settings: false,
      customers: false,
      invoices: false,
      payments: false
    };

    const checkAndEmit = () => {
      if (initialLoadDone.settings && initialLoadDone.customers && initialLoadDone.invoices && initialLoadDone.payments) {
        onData(localCache);
      }
    };

    // 1. الإعدادات: users/{uid}/settings/shop
    const settingsRef = doc(this.db, "users", uid, "settings", "shop");
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        localCache.settings = docSnap.data();
      }
      initialLoadDone.settings = true;
      checkAndEmit();
    }, (err) => {
      console.error('[Firestore Error - Settings]:', err);
      initialLoadDone.settings = true;
      if (onError) onError(err);
    });
    this.unsubscribeListeners.push(unsubSettings);

    // 2. الزبائن: users/{uid}/customers/
    const customersRef = collection(this.db, "users", uid, "customers");
    const unsubCustomers = onSnapshot(customersRef, (snap) => {
      localCache.customers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      initialLoadDone.customers = true;
      checkAndEmit();
    }, (err) => {
      console.error('[Firestore Error - Customers]:', err);
      initialLoadDone.customers = true;
      if (onError) onError(err);
    });
    this.unsubscribeListeners.push(unsubCustomers);

    // 3. الفواتير: users/{uid}/invoices/
    const invoicesRef = collection(this.db, "users", uid, "invoices");
    const unsubInvoices = onSnapshot(invoicesRef, (snap) => {
      localCache.invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      initialLoadDone.invoices = true;
      checkAndEmit();
    }, (err) => {
      console.error('[Firestore Error - Invoices]:', err);
      initialLoadDone.invoices = true;
      if (onError) onError(err);
    });
    this.unsubscribeListeners.push(unsubInvoices);

    // 4. التسديدات: users/{uid}/payments/
    const paymentsRef = collection(this.db, "users", uid, "payments");
    const unsubPayments = onSnapshot(paymentsRef, (snap) => {
      localCache.payments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      initialLoadDone.payments = true;
      checkAndEmit();
    }, (err) => {
      console.error('[Firestore Error - Payments]:', err);
      initialLoadDone.payments = true;
      if (onError) onError(err);
    });
    this.unsubscribeListeners.push(unsubPayments);
  }

  // حفظ أو تحديث زبون في السحابة
  async saveCustomer(uid, customer) {
    if (!this.db || !uid) throw new Error('غير متصل بالسحابة');
    const { doc, setDoc } = this.firestoreOps;
    const ref = doc(this.db, "users", uid, "customers", customer.id);
    await setDoc(ref, {
      id: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      createdAt: customer.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // حذف زبون من السحابة
  async deleteCustomer(uid, customerId) {
    if (!this.db || !uid) throw new Error('غير متصل بالسحابة');
    const { doc, deleteDoc } = this.firestoreOps;
    const ref = doc(this.db, "users", uid, "customers", customerId);
    await deleteDoc(ref);
  }

  // حفظ فاتورة بيع آجل
  async saveInvoice(uid, invoice) {
    if (!this.db || !uid) throw new Error('غير متصل بالسحابة');
    const { doc, setDoc } = this.firestoreOps;
    const ref = doc(this.db, "users", uid, "invoices", invoice.id);
    await setDoc(ref, {
      id: invoice.id,
      customerId: invoice.customerId,
      date: invoice.date,
      items: invoice.items || [],
      totalAmount: Number(invoice.totalAmount) || 0,
      notes: invoice.notes || '',
      createdAt: invoice.createdAt || new Date().toISOString()
    });
  }

  // حفظ دفعة تسديد
  async savePayment(uid, payment) {
    if (!this.db || !uid) throw new Error('غير متصل بالسحابة');
    const { doc, setDoc } = this.firestoreOps;
    const ref = doc(this.db, "users", uid, "payments", payment.id);
    await setDoc(ref, {
      id: payment.id,
      customerId: payment.customerId,
      date: payment.date,
      amount: Number(payment.amount) || 0,
      method: payment.method || 'نقدي',
      notes: payment.notes || '',
      createdAt: payment.createdAt || new Date().toISOString()
    });
  }

  // حفظ إعدادات المحل
  async saveSettings(uid, settings) {
    if (!this.db || !uid) throw new Error('غير متصل بالسحابة');
    const { doc, setDoc } = this.firestoreOps;
    const ref = doc(this.db, "users", uid, "settings", "shop");
    await setDoc(ref, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // ==========================================
  // آلية الترحيل الآمنة بموافقة المستخدم
  // تمنع تكرار السجلات وتفحص الـ IDs
  // ==========================================
  async migrateLocalData(uid, localData) {
    if (!this.db || !uid) throw new Error('يجب تسجيل الدخول بالخدمة السحابية للترحيل');
    const { doc, getDocs, collection, writeBatch } = this.firestoreOps;

    // 1. جلب المعرفات الموجودة مسبقاً في السحابة لتفادي التكرار
    const [custSnaps, invSnaps, paySnaps] = await Promise.all([
      getDocs(collection(this.db, "users", uid, "customers")),
      getDocs(collection(this.db, "users", uid, "invoices")),
      getDocs(collection(this.db, "users", uid, "payments"))
    ]);

    const existingCustIds = new Set(custSnaps.docs.map(d => d.id));
    const existingInvIds = new Set(invSnaps.docs.map(d => d.id));
    const existingPayIds = new Set(paySnaps.docs.map(d => d.id));

    const batch = writeBatch(this.db);
    let migratedCounts = { customers: 0, invoices: 0, payments: 0, settings: false };

    // ترحيل الزبائن غير المكررين
    if (localData.customers && Array.isArray(localData.customers)) {
      localData.customers.forEach(cust => {
        if (!existingCustIds.has(cust.id)) {
          const ref = doc(this.db, "users", uid, "customers", cust.id);
          batch.set(ref, { ...cust, migratedFromLocal: true, updatedAt: new Date().toISOString() });
          migratedCounts.customers++;
        }
      });
    }

    // ترحيل الفواتير غير المكررة
    if (localData.invoices && Array.isArray(localData.invoices)) {
      localData.invoices.forEach(inv => {
        if (!existingInvIds.has(inv.id)) {
          const ref = doc(this.db, "users", uid, "invoices", inv.id);
          batch.set(ref, { ...inv, migratedFromLocal: true });
          migratedCounts.invoices++;
        }
      });
    }

    // ترحيل التسديدات غير المكررة
    if (localData.payments && Array.isArray(localData.payments)) {
      localData.payments.forEach(pay => {
        if (!existingPayIds.has(pay.id)) {
          const ref = doc(this.db, "users", uid, "payments", pay.id);
          batch.set(ref, { ...pay, migratedFromLocal: true });
          migratedCounts.payments++;
        }
      });
    }

    // ترحيل الإعدادات إذا كانت مخصصة
    if (localData.settings) {
      const ref = doc(this.db, "users", uid, "settings", "shop");
      batch.set(ref, { ...localData.settings, updatedAt: new Date().toISOString() }, { merge: true });
      migratedCounts.settings = true;
    }

    // تطبيق الدفعة البرمجية دفعة واحدة
    await batch.commit();
    return migratedCounts;
  }
}

// تصدير كائن الخدمة العام وربطه بنافذة المتصفح
window.firebaseService = new FirebaseService();
window.firebaseService.init();
