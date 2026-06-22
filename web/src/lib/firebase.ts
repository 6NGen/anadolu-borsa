"use client";
// Firebase Cloud Messaging (push) — yalnız token almak için kullanılır.
// Config ve VAPID key herkese açıktır (tarayıcıya gönderilir), gizli değildir.
// Asıl bildirim gönderimi scraper tarafında (service account ile, sunucuda) yapılır.
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAVJNBN5Ayo4sOGnRA6oX3HYvTKtx3-Hp8",
  authDomain: "anadolu-borsa-ab12d.firebaseapp.com",
  projectId: "anadolu-borsa-ab12d",
  storageBucket: "anadolu-borsa-ab12d.firebasestorage.app",
  messagingSenderId: "121060461933",
  appId: "1:121060461933:web:a67770c0359610f1bede64",
};

const VAPID_KEY =
  "BL0nmzL0ecEYaEDeo2yXjOPKPEl9ReIRNDXXpvcdoVFPmiNfc0OngrxqMevFywa_jZp1cq5lVaeAhMGtVSbR1_U";

function app(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
}

// Bildirim izni iste + FCM token al. Desteklenmiyor/izin verilmediyse null.
export async function fcmTokenAl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  if (Notification.permission === "denied") return null;

  const izin = await Notification.requestPermission();
  if (izin !== "granted") return null;

  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(app());
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  return token ?? null;
}
