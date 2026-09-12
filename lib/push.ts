import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function notifySubscribers(
  payload: { title: string; body: string; url?: string },
  opts?: { userId?: string },
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: opts?.userId ? { userId: opts.userId } : undefined,
  });

  console.log(`[push] notifying ${subscriptions.length} subscription(s)`, {
    userId: opts?.userId,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        console.log(`[push] sent to ${sub.endpoint}`);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        console.error(`[push] failed for ${sub.endpoint}: status=${statusCode}`, err);
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
