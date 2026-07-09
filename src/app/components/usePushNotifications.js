"use client";
import { useEffect } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function usePushNotifications() {
  useEffect(() => {
    async function setup() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("[push] not supported in this browser");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[push] permission not granted:", permission);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        console.log("[push] already subscribed");
        return;
      }

      const { publicKey } = await fetch("/api/push/vapid-public-key").then((r) => r.json());

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const token = localStorage.getItem("token");
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sub.toJSON()),
      });

      if (res.ok) {
        console.log("[push] subscribed successfully");
      } else {
        console.error("[push] failed to save subscription on server");
      }
    }
    setup();
  }, []);
}