# Organization Plugin Quick Reference

## Import

```tsx
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/lib/contexts/auth-context";
```

## Check Active Organization

```tsx
const { activeOrganization, hasActiveOrganization, organizationId } = useOrganization();

if (!hasActiveOrganization) {
  return <div>No active organization</div>;
}
```

## Create Organization

```tsx
const { organization } = useOrganization();

await organization.create({
  name: "My Company",
  slug: "my-company",
  logo: "https://example.com/logo.png" // optional
});
```

## List Organizations

```tsx
const result = await organization.list();
const orgs = result.data; // Array of organizations
```

## Set Active Organization

```tsx
await organization.setActive("org-id");
window.location.reload(); // Refresh to apply changes
```

## Get Full Organization Data

```tsx
const result = await organization.getFullOrganization("org-id");
const fullOrg = result.data; // Includes members
```

## Update Organization

```tsx
await organization.update({
  organizationId: "org-id",
  data: {
    name: "New Name",
    slug: "new-slug",
    logo: "new-logo-url"
  }
});
```

## Delete Organization

```tsx
await organization.delete("org-id");
```

## Invite Member

```tsx
await organization.inviteMember({
  email: "user@example.com",
  role: "member", // or "admin", "owner"
  organizationId: "org-id" // optional, uses active org
});
```

## Accept Invitation

```tsx
await organization.acceptInvitation("invitation-id");
```

## Reject Invitation

```tsx
await organization.rejectInvitation("invitation-id");
```

## Cancel Invitation

```tsx
await organization.cancelInvitation("invitation-id");
```

## List Invitations

```tsx
// For specific organization
const result = await organization.listInvitations("org-id");

// For active organization
const result = await organization.listInvitations();

const invitations = result.data;
```

## List User Invitations

```tsx
const result = await organization.listUserInvitations();
const invitations = result.data; // Invitations for current user
```

## List Members

```tsx
const result = await organization.listMembers({
  organizationId: "org-id",
  limit: 100,
  offset: 0,
  sortBy: "createdAt",
  sortDirection: "desc"
});

const members = result.data.members;
```

## Remove Member

```tsx
await organization.removeMember(
  "member-id-or-email",
  "org-id" // optional
);
```

## Update Member Role

```tsx
await organization.updateMemberRole({
  memberId: "member-id",
  role: "admin", // or ["admin", "moderator"]
  organizationId: "org-id" // optional
});
```

## Leave Organization

```tsx
await organization.leave("org-id");
```

## Get Active Member

```tsx
const result = await organization.getActiveMember();
const member = result.data; // Current user's member record
```

## Components

### Organization Switcher

```tsx
import { OrganizationSwitcher } from "@/components/common/organization/organization-switcher";

<OrganizationSwitcher
  onCreateNew={() => {
    // Handle create new organization
  }}
/>
```

### Create Organization Form

```tsx
import { CreateOrganizationForm } from "@/components/common/organization/create-organization-form";

<CreateOrganizationForm
  onSuccess={() => {
    // Handle success
  }}
  onCancel={() => {
    // Handle cancel
  }}
/>
```

### Organization Members

```tsx
import { OrganizationMembers } from "@/components/common/organization/organization-members";

<OrganizationMembers />
```

## Role Checking

```tsx
import { useOrganizationRole } from "@/hooks/use-organization";

const { getRole, isOwner, isAdmin, isMember } = useOrganizationRole();

// Check role
const role = await getRole();

// Check if owner
const owner = await isOwner();

// Check if admin or owner
const admin = await isAdmin();

// Check if member
const member = await isMember();
```

## Default Roles

- `owner` - Full control over organization
- `admin` - Can manage members and settings (except delete org)
- `member` - Read-only access

## Common Patterns

### Protect Organization Routes

```tsx
export default function OrganizationPage() {
  const { hasActiveOrganization } = useOrganization();

  if (!hasActiveOrganization) {
    return <div>Please select an organization</div>;
  }

  return <OrganizationContent />;
}
```

### Display Active Organization

```tsx
const { activeOrganization } = useOrganization();

<div>
  <h1>{activeOrganization?.name}</h1>
  <p>{activeOrganization?.slug}</p>
  {activeOrganization?.logo && (
    <img src={activeOrganization.logo} alt={activeOrganization.name} />
  )}
</div>
```

### Member Management Flow

```tsx
function MemberManagement() {
  const { organization, organizationId } = useOrganization();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  const loadMembers = async () => {
    const result = await organization.listMembers({ organizationId });
    setMembers(result.data.members);
  };

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          {member.user.name} - {member.role}
        </div>
      ))}
    </div>
  );
}
```

## Invitation Flow

1. **Send Invitation**
```tsx
await organization.inviteMember({
  email: "user@example.com",
  role: "member"
});
```

2. **User receives email with link**: `/accept-invitation/[invitationId]`

3. **User accepts invitation**
```tsx
await organization.acceptInvitation(invitationId);
```

4. **User is now a member!**

## Configuration (Backend)

- `allowUserToCreateOrganization`: true (default)
- `organizationLimit`: 5 organizations per user
- `membershipLimit`: 100 members per organization
- `invitationExpiresIn`: 7 days
- `requireEmailVerificationOnInvitation`: false

## Notes

- MongoDB creates schema automatically - no migration needed
- Active organization is stored in session
- Multiple roles stored as comma-separated: "admin,member"
- Organization slug must be unique and URL-safe
- Invitations expire after 7 days by default
- Owner role cannot be removed or changed
