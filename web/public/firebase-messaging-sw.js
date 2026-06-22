/* Firebase Cloud Messaging service worker — arka planda push bildirimi alır.
   Config herkese açıktır (gizli değil). Sürüm npm 'firebase' ile uyumlu (12.x). */
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAVJNBN5Ayo4sOGnRA6oX3HYvTKtx3-Hp8",
  authDomain: "anadolu-borsa-ab12d.firebaseapp.com",
  projectId: "anadolu-borsa-ab12d",
  storageBucket: "anadolu-borsa-ab12d.firebasestorage.app",
  messagingSenderId: "121060461933",
  appId: "1:121060461933:web:a67770c0359610f1bede64",
});

const messaging = firebase.messaging();

// Veri-tipli mesajda bildirimi elle göster (notification-tipli mesajı tarayıcı otomatik gösterir).
messaging.onBackgroundMessage((payload) => {
  const baslik = payload.notification?.title || "Anadolu Borsa";
  const govde = payload.notification?.body || payload.data?.body || "";
  self.registration.showNotification(baslik, { body: govde, badge: "/favicon.ico" });
});
