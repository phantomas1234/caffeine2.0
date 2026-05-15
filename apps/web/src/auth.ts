import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { auth, handlers, signIn, signOut } = NextAuth(async () => {
  // Lazy import so a missing DATABASE_URL doesn't break the build before
  // env vars are configured.
  const adapter = process.env.DATABASE_URL
    ? await (async () => {
        const { DrizzleAdapter } = await import("@caffeine/db/adapter");
        const { db } = await import("@caffeine/db");
        return DrizzleAdapter(db);
      })()
    : undefined;

  return {
    adapter,
    session: { strategy: "jwt" as const },
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    ],
    pages: {
      signIn: "/auth/sign-in",
    },
  };
});
