"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush } from "@/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushOptIn() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setSupported(true);
      setSubscribed(!!existing);
    })();
  }, []);

  async function toggle() {
    const registration = await navigator.serviceWorker.ready;

    if (subscribed) {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await unsubscribeFromPush(existing.endpoint);
        await existing.unsubscribe();
      }
      setSubscribed(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    await subscribeToPush(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
    setSubscribed(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={subscribed ? "Turn off notifications" : "Turn on notifications"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-soft card-shadow"
    >
      {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
    </button>
  );
}
