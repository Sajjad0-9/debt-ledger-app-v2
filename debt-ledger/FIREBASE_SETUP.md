# دليل إعداد وتشغيل خدمات Firebase (المرحلة الثانية - الربط الفعلي)

تم ربط تطبيق «سجل الديون» رسمياً بمشروع Firebase الخاص بك:
* **Project ID:** `debt-ledger-ea8c4`
* **Auth Domain:** `debt-ledger-ea8c4.firebaseapp.com`
* **Storage Bucket:** `debt-ledger-ea8c4.firebasestorage.app`

---

## 1. قواعد أمان Cloud Firestore (مهم جداً)

لكي يتمكن التطبيق من قراءة وكتابة البيانات بأمان لكل مستخدم دون تداخل أو كشف لبيانات المحلات الأخرى، توجه إلى **Firebase Console -> Firestore Database -> Rules** وتأكد من نشر القواعد التالية:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // يسمح للمستخدم المسجل فقط بالقراءة والكتابة داخل مجلده الخاص حصراً
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 2. النطاقات المصرح بها للمصادقة (Authorized Domains)

لكي تنجح عملية تسجيل الدخول بحساب Google دون حظر أمني:
1. اذهب إلى **Firebase Console -> Authentication -> Settings -> Authorized domains**.
2. تأكد من وجود النطاقات التالية:
   - `localhost` (للتشغيل والاختبار المحلي).
   - `debt-ledger-ea8c4.firebaseapp.com` (افتراضي).
   - **نطاق الاستضافة الخاصة بك** بعد رفع التطبيق (مثلاً: `your-shop.netlify.app` أو `username.github.io`).

---

## 3. هيكلية المستندات المنفذة في الكود

تم تنظيم البيانات في السحابة بدقة لمنع التكرار والحفاظ على العلاقات:
```text
users/{uid}/
  ├── settings/shop               (اسم المحل، العملة، الهاتف، العنوان)
  ├── customers/{customerId}      (بيانات الزبون، الهاتف، وتاريخ الإضافة)
  ├── invoices/{invoiceId}        (فواتير البيع الآجل مع مصفوفة المواد والإجمالي)
  └── payments/{paymentId}        (سندات القبض والتسديدات مع طريقة الدفع)
```

---

## 4. آلية الترحيل الآمنة (Migration)

- البيانات المحلية المحفوظة في ذاكرة المتصفح `LocalStorage` لا تُحذف تلقائياً ولا تُنقل قسراً.
- عند تسجيل الدخول بحساب Google لأول مرة، يظهر للمستخدم إشعار ذكي يتيح له ترحيل البيانات المحلية إلى حسابه السحابي.
- تفحص خوارزمية الترحيل معرفات السجلات (IDs) لمنع تكرار أي زبون أو فاتورة أو تسديد مسبق.
