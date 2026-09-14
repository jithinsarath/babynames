import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      isAdmin: boolean;
      isVoter: boolean;
      isViewer: boolean;
    } & DefaultSession["user"];
  }
}
