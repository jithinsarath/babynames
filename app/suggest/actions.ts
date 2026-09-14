"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalize } from "@/lib/nameParsing";
import { genderSchema } from "@/lib/validation";
import { notifySubscribers } from "@/lib/push";

async function requireViewer() {
  const session = await auth();
  if (!session?.user?.isViewer && !session?.user?.isAdmin) throw new Error("Not authorized");
  return session.user;
}

export async function submitSuggestion(text: string, meaning: string, gender: string) {
  const user = await requireViewer();
  const parsedGender = genderSchema.parse(gender);

  const trimmedText = text.trim();
  if (!trimmedText) throw new Error("Name is required");
  const normalizedText = normalize(trimmedText);

  const [existingName, existingSuggestion] = await Promise.all([
    prisma.name.findFirst({ where: { normalizedText, gender: parsedGender } }),
    prisma.nameSuggestion.findFirst({
      where: { normalizedText, gender: parsedGender, status: "PENDING" },
    }),
  ]);
  if (existingName || existingSuggestion) {
    throw new Error(`"${trimmedText}" has already been suggested.`);
  }

  const suggester = await prisma.user.findUniqueOrThrow({ where: { email: user.email! } });

  await prisma.nameSuggestion.create({
    data: {
      text: trimmedText,
      normalizedText,
      meaning: meaning.trim() || null,
      gender: parsedGender,
      suggestedById: suggester.id,
    },
  });

  const admin = await prisma.user.findFirst({
    where: { email: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase() },
  });
  if (admin) {
    await notifySubscribers(
      {
        title: "New name suggestion",
        body: `${suggester.name ?? suggester.email} suggested "${trimmedText}"`,
        url: "/admin/suggestions",
      },
      { userId: admin.id },
    );
  }
}
