"use client";

import { useEffect, useState } from "react";
import { Mail, UserMinus, UserCog } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Member } from "@/lib/types/auth";

/**
 * Organization Members Management Component
 * Manage members, invitations, and roles
 */
export function OrganizationMembers() {
  const { organization, organizationId } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  // Early exit while organization features are paused
  if (!organization) {
    return (
      <Alert>
        <AlertDescription>
          Organization management is currently disabled.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    if (organizationId) {
      loadMembers();
    }
  }, [organizationId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result: any = await organization.listMembers({
        organizationId,
        limit: 100,
      });

      if (result?.data?.members) {
        setMembers(result.data.members);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviting(true);
      setError(null);

      const result: any = await organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
        organizationId,
      });

      if (result?.error) {
        setError(result.error.message || "Failed to send invitation");
        return;
      }

      setInviteEmail("");
      setInviteRole("member");
      alert("Invitation sent successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      setError(null);
      await organization.removeMember(memberId, organizationId);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      setError(null);
      await organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      });
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  if (!organizationId) {
    return (
      <Alert>
        <AlertDescription>
          Please select an organization to manage members.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Member Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Invite new members to your organization via email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={inviting}>
              <Mail className="mr-2 h-4 w-4" />
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            Manage members and their roles in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.user?.name || "Unknown"}</p>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined: {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {member.role !== "owner" && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            handleUpdateRole(member.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <UserCog className="mr-2 h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No members found. Invite members to get started.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
