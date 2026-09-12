"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function subscribeToPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();
  if (!session?.user?.email || !session.user.isVoter) {
    throw new Error("Not authorized");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  console.log(`[push] subscribed ${user.email} at ${subscription.endpoint}`);
}

export async function unsubscribeFromPush(endpoint: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authorized");

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
