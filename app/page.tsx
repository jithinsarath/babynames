import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/vote/boy" : "/signin");
}
