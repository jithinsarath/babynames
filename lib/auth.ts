import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { isAllowed, isAdmin, isAllowedVoter } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!isAllowed(email)) return false;

      await prisma.user.upsert({
        where: { email },
        update: { name: user.name, image: user.image },
        create: { email: email!, name: user.name, image: user.image },
      });

      return true;
    },
    async session({ session }) {
      const email = session.user?.email?.toLowerCase();
      if (session.user) {
        session.user.isAdmin = isAdmin(email);
        session.user.isVoter = isAllowedVoter(email);
      }
      return session;
    },
  },
});
