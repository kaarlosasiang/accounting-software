"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthNavbar } from "@/components/common/auth-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/config/auth-client";
import { permissionsService } from "@/lib/services/permissions.service";

type PageState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "success"; orgName: string; role: string }
  | { status: "error"; message: string };

export default function AcceptInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    if (!id) return;
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const accept = async () => {
    setState({ status: "loading" });
    try {
      // 1. Accept the invitation via BetterAuth
      const result = await (authClient as any).organization.acceptInvitation({
        invitationId: id,
      });

      if (result?.error) {
        // If unauthenticated, BetterAuth returns 401
        const msg: string = result.error.message ?? "";
        if (
          result.error.status === 401 ||
          msg.toLowerCase().includes("sign in") ||
          msg.toLowerCase().includes("authenticated")
        ) {
          setState({ status: "unauthenticated" });
          return;
        }
        throw new Error(msg || "Failed to accept invitation");
      }

      const invitation = result?.data?.invitation ?? result?.data;
      const orgName: string =
        result?.data?.organization?.name ??
        invitation?.organizationId ??
        "the company";
      const roleName: string = invitation?.role ?? "member";

      // 2. Provision the MemberPermission record with the correct role
      //    Uses $setOnInsert — safe if record already exists
      try {
        await permissionsService.provisionMember(
          invitation?.organizationId,
          roleName,
        );
      } catch {
        // Non-fatal — auto-assign fallback will handle it on first API call
      }

      // 3. Switch the active org to the one just joined, then redirect
      try {
        await (authClient as any).organization.setActive({
          organizationId: invitation?.organizationId,
        });
      } catch {
        // best-effort
      }

      setState({ status: "success", orgName, role: roleName });

      // Redirect to dashboard after a short delay
      setTimeout(() => router.replace("/dashboard"), 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation";
      toast.error(message);
      setState({ status: "error", message });
    }
  };

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <AuthNavbar />
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          {state.status === "loading" && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Accepting invitation…</CardTitle>
                <CardDescription>
                  Please wait while we set up your access.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
              </CardContent>
            </>
          )}

          {state.status === "unauthenticated" && (
            <>
              <CardHeader className="text-center">
                <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle>Sign in to accept</CardTitle>
                <CardDescription>
                  You need to be signed in to accept this invitation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild>
                  <Link href={`/login?callbackUrl=/accept-invitation/${id}`}>
                    Sign in
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/signup?callbackUrl=/accept-invitation/${id}`}>
                    Create account
                  </Link>
                </Button>
              </CardContent>
            </>
          )}

          {state.status === "success" && (
            <>
              <CardHeader className="text-center">
                <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <CheckCircle className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Welcome aboard!</CardTitle>
                <CardDescription>
                  You&apos;ve joined{" "}
                  <span className="text-foreground font-medium">
                    {state.orgName}
                  </span>{" "}
                  as{" "}
                  <span className="text-foreground font-medium capitalize">
                    {state.role}
                  </span>
                  . Redirecting to your dashboard…
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              </CardContent>
            </>
          )}

          {state.status === "error" && (
            <>
              <CardHeader className="text-center">
                <div className="bg-destructive/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <XCircle className="text-destructive h-6 w-6" />
                </div>
                <CardTitle>Invitation failed</CardTitle>
                <CardDescription>{state.message}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button onClick={accept} variant="outline">
                  Try again
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/">Go home</Link>
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
