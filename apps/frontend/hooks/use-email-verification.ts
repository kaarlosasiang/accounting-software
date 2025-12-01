"use client";

import { useSession } from "@/lib/config/auth-client";

export function useEmailVerification() {
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const emailVerified = user?.emailVerified ?? false;
  const needsVerification = user && !emailVerified;

  return {
    emailVerified,
    needsVerification,
    isLoading: isPending,
    user,
  };
}
