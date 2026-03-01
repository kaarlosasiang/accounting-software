"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Lock, Pencil, Trash2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Resource, Action, OrgRole, type RoleDto } from "@sas/validators";
import { withPermissionGuard } from "@/lib/auth/permission-guard";
import { useRoles } from "@/hooks/use-roles";
import { useOrganization } from "@/hooks/use-organization";
import { useDataTable } from "@/hooks/use-data-table";
import {
  permissionsService,
  type AssignRoleData,
} from "@/lib/services/permissions.service";
import {
  RolePermissionMatrix,
  type PermissionMatrixValue,
} from "@/components/forms/role-permission-matrix/form";
import { DataTable } from "@/components/common/data-table/data-table";
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_MATRIX: PermissionMatrixValue = { grants: [], revocations: [] };

function roleBadgeVariant(role: string) {
  const map: Record<string, "default" | "secondary" | "outline"> = {
    owner: "default",
    admin: "default",
    accountant: "secondary",
    staff: "secondary",
    viewer: "outline",
  };
  return map[role] ?? "outline";
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

type Member = {
  id: string;
  userId: string;
  role: string;
  user?: { name?: string; email?: string; image?: string };
};

function MembersTab({ roles }: { roles: RoleDto[] }) {
  const { organization, organizationId } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgRole, setInviteOrgRole] = useState<string>(OrgRole.staff);
  const [inviting, setInviting] = useState(false);

  // Member permission dialog state
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [overrides, setOverrides] =
    useState<PermissionMatrixValue>(EMPTY_MATRIX);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permLoadError, setPermLoadError] = useState<string | null>(null);
  const [permRecordExists, setPermRecordExists] = useState(false);
  const [saving, setSaving] = useState(false);

  // Remove dialog
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const loadMembers = async () => {
    if (!organizationId) return;
    setLoadingMembers(true);
    try {
      const result = await (organization as any)?.listMembers({
        query: { organizationId, limit: 100 },
      });
      setMembers(result?.data?.members ?? []);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleInvite = async () => {
    if (!inviteEmail || !organizationId) return;
    setInviting(true);
    try {
      const result = await (organization as any)?.inviteMember({
        email: inviteEmail,
        role: inviteOrgRole,
        organizationId,
      });
      if (result?.error)
        throw new Error(result.error.message || "Failed to invite");
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite member",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleOpenPermDialog = async (member: Member) => {
    setSelectedMember(member);
    setSelectedRoleId("");
    setOverrides(EMPTY_MATRIX);
    setPermLoadError(null);
    setPermRecordExists(false);
    setPermDialogOpen(true);
    setLoadingPermissions(true);
    try {
      const dto = await permissionsService.get(member.userId);
      let roleId = "";
      if (typeof dto.roleId === "string") {
        roleId = dto.roleId;
      } else if (dto.roleId && typeof dto.roleId === "object") {
        const r = dto.roleId as any;
        roleId = String(r._id ?? r.id ?? "");
      }
      setSelectedRoleId(roleId);
      setOverrides({
        grants: dto.grants ?? [],
        revocations: dto.revocations ?? [],
      });
      setPermRecordExists(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNoRecord =
        msg.toLowerCase().includes("no permission") ||
        msg.toLowerCase().includes("not found");
      if (isNoRecord) {
        if (member.role) {
          const match = roles.find(
            (r) => r.name.toLowerCase() === member.role.toLowerCase(),
          );
          if (match) setSelectedRoleId(match._id);
        }
      } else {
        setPermLoadError(msg);
        toast.error("Could not load permissions: " + msg);
      }
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedMember || !organizationId) return;
    setSaving(true);
    try {
      const data: AssignRoleData = {
        roleId: selectedRoleId,
        grants: overrides.grants,
        revocations: overrides.revocations,
      };
      await permissionsService.assign(selectedMember.userId, data);
      toast.success("Permissions saved");
      setPermDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save permissions",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget || !organizationId) return;
    try {
      await (organization as any)?.removeMember({
        memberIdOrEmail: removeTarget.userId,
        organizationId,
      });
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoveTarget(null);
    }
  };

  const memberColumns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        id: "search",
        accessorFn: (row) => `${row.user?.name ?? ""} ${row.user?.email ?? ""}`,
        header: () => null,
        cell: () => null,
        enableColumnFilter: true,
        enableSorting: false,
        enableHiding: false,
        size: 0,
        meta: {
          label: "Search",
          placeholder: "Search members…",
          variant: "text",
        },
      },
      {
        id: "name",
        accessorFn: (row) => row.user?.name ?? row.user?.email ?? "Unknown",
        size: 300,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Member" />
        ),
        cell: ({ row }) => {
          const member = row.original;
          const initial = (
            member.user?.name?.[0] ??
            member.user?.email?.[0] ??
            "?"
          ).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                {initial}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  {member.user?.name ?? "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {member.user?.email}
                </p>
              </div>
            </div>
          );
        },
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "role",
        accessorKey: "role",
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Role" />
        ),
        cell: ({ row }) => (
          <Badge
            variant={roleBadgeVariant(row.original.role)}
            className="capitalize"
          >
            {row.original.role}
          </Badge>
        ),
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Role",
          variant: "select",
          options: Object.values(OrgRole).map((r) => ({
            label: r.charAt(0).toUpperCase() + r.slice(1),
            value: r,
          })),
        },
      },
      {
        id: "actions",
        size: 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label="Actions"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPermDialog(member)}
              >
                <Users className="h-3 w-3 mr-1" />
                Permissions
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setRemoveTarget(member)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles],
  );

  const { table } = useDataTable({
    data: members,
    columns: memberColumns,
    pageCount: Math.max(1, Math.ceil(members.length / 10)),
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
    getRowId: (row) => row.id,
    manualFiltering: false,
    manualSorting: false,
    manualPagination: false,
  });

  return (
    <>
      {loadingMembers ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table}>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DataTableToolbar>
        </DataTable>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteOrgRole} onValueChange={setInviteOrgRole}>
                <SelectTrigger id="inviteRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrgRole).map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="capitalize">{r}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
              {inviting ? "Sending…" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={permDialogOpen}
        onOpenChange={(open) => {
          setPermDialogOpen(open);
          if (!open) {
            setPermLoadError(null);
            setPermRecordExists(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions —{" "}
              {selectedMember?.user?.name ?? selectedMember?.user?.email}
            </DialogTitle>
            <DialogDescription>
              Assign a role and optionally override individual permissions.
            </DialogDescription>
          </DialogHeader>

          {loadingPermissions ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : permLoadError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load permissions: {permLoadError}
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {!permRecordExists && selectedRoleId && (
                <div className="rounded-md border border-blue-300/40 bg-blue-50/10 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
                  No custom permissions saved yet. Role pre-filled from their
                  organization role — click <strong>Save Permissions</strong> to
                  confirm.
                </div>
              )}
              {!permRecordExists && !selectedRoleId && (
                <div className="rounded-md border border-amber-300/40 bg-amber-50/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                  No role assigned yet — select a role below to grant this
                  member access.
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        <span className="capitalize">{role.name}</span>
                        {role.isSystem && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (system)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permission Overrides</Label>
                <p className="text-xs text-muted-foreground">
                  Fine-tune permissions on top of the role defaults.{" "}
                  <span className="text-green-600 font-medium">+grant</span>{" "}
                  adds a permission,{" "}
                  <span className="text-red-600 font-medium">−revoke</span>{" "}
                  removes one.
                  {!selectedRoleId && (
                    <span className="block text-amber-600 dark:text-amber-400 mt-1">
                      Select a role above to enable overrides.
                    </span>
                  )}
                </p>
                <RolePermissionMatrix
                  mode="override"
                  value={overrides}
                  onChange={setOverrides}
                  disabled={!selectedRoleId}
                  basePermissions={
                    selectedRoleId &&
                    roles.find((r) => r._id === selectedRoleId)
                      ? (Object.fromEntries(
                          roles
                            .find((r) => r._id === selectedRoleId)!
                            .permissions.map((p) => [p.resource, p.actions]),
                        ) as any)
                      : undefined
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={
                saving ||
                !selectedRoleId ||
                loadingPermissions ||
                !!permLoadError
              }
            >
              {saving ? "Saving…" : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <strong>
                {removeTarget?.user?.name ?? removeTarget?.user?.email}
              </strong>{" "}
              from the organization. They will lose all access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const {
    roles,
    isLoading,
    fetchRoles,
    fetchDefaults,
    createRole,
    updateRole,
    deleteRole,
  } = useRoles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [matrixValue, setMatrixValue] =
    useState<PermissionMatrixValue>(EMPTY_MATRIX);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchDefaults();
  }, [fetchRoles, fetchDefaults]);

  const openCreate = () => {
    setEditTarget(null);
    setRoleName("");
    setRoleDescription("");
    setMatrixValue(EMPTY_MATRIX);
    setDialogOpen(true);
  };

  const openEdit = (role: RoleDto) => {
    setEditTarget(role);
    setRoleName(role.name);
    setRoleDescription(role.description ?? "");
    setMatrixValue({ grants: role.permissions, revocations: [] });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: roleName.trim(),
        description: roleDescription.trim() || undefined,
        permissions: matrixValue.grants,
      };
      if (editTarget) {
        await updateRole(editTarget._id, data);
      } else {
        await createRole(data);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRole(deleteTarget._id);
    setDeleteTarget(null);
  };

  const roleColumns = useMemo<ColumnDef<RoleDto>[]>(
    () => [
      {
        id: "search",
        accessorFn: (row) => `${row.name} ${row.description ?? ""}`,
        header: () => null,
        cell: () => null,
        enableColumnFilter: true,
        enableSorting: false,
        enableHiding: false,
        size: 0,
        meta: {
          label: "Search",
          placeholder: "Search roles…",
          variant: "text",
        },
      },
      {
        id: "name",
        accessorKey: "name",
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Role Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium capitalize">{row.original.name}</span>
        ),
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        id: "type",
        accessorFn: (row) => (row.isSystem ? "System" : "Custom"),
        size: 100,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Type" />
        ),
        cell: ({ row }) =>
          row.original.isSystem ? (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              System
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          ),
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Type",
          variant: "select",
          options: [
            { label: "System", value: "System" },
            { label: "Custom", value: "Custom" },
          ],
        },
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Description" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate block max-w-xs">
            {row.original.description ?? "—"}
          </span>
        ),
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        id: "actions",
        size: 80,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label="Actions"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const role = row.original;
          if (role.isSystem) {
            return (
              <span className="text-xs text-muted-foreground pr-2 flex justify-end">
                Read-only
              </span>
            );
          }
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(role)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { table } = useDataTable({
    data: roles,
    columns: roleColumns,
    pageCount: Math.max(1, Math.ceil(roles.length / 10)),
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
    getRowId: (row) => row._id,
    manualFiltering: false,
    manualSorting: false,
    manualPagination: false,
  });

  return (
    <>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table}>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </DataTableToolbar>
        </DataTable>
      )}

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Edit Role — ${editTarget.name}` : "New Role"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the role name, description, or its permissions."
                : "Create a custom role with specific permissions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name *</Label>
                <Input
                  id="roleName"
                  placeholder="e.g. Senior Accountant"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  placeholder="Optional description"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <p className="text-xs text-muted-foreground">
                Check the actions this role can perform on each resource.
              </p>
              <RolePermissionMatrix
                mode="role"
                value={matrixValue}
                onChange={setMatrixValue}
                disabled={!!editTarget?.isSystem}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !roleName.trim()}>
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>
              . Members assigned to this role will lose their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TeamPage() {
  const { roles, fetchRoles } = useRoles();

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <div className="flex flex-col gap-6 px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:bg-none dark:text-white">
          Team &amp; Roles
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage organization members and define custom permission roles.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="members" className="w-full">
            <CardHeader className="pb-0">
              <TabsList>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="roles">
                  <Lock className="h-4 w-4 mr-2" />
                  Roles
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="members" className="p-6 pt-4">
              <MembersTab roles={roles} />
            </TabsContent>

            <TabsContent value="roles" className="p-6 pt-4">
              <RolesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default withPermissionGuard(Resource.user, Action.read, {
  redirectTo: "/dashboard",
})(TeamPage);
