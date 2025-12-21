# Better Auth Admin Plugin Implementation

## Overview

Successfully implemented the Better Auth Admin plugin for comprehensive user management functionality. This implementation provides administrators with full control over user accounts, roles, permissions, and sessions.

## What Was Implemented

### 1. Backend Configuration (`apps/backend/src/api/v1/modules/auth/betterAuth.ts`)

Added the admin plugin to the auth server configuration:

```typescript
import { admin, emailOTP, oneTap } from "better-auth/plugins";

plugins: [
  admin({
    defaultRole: "user",
    adminRoles: ["admin", "super_admin"],
    impersonationSessionDuration: 60 * 60, // 1 hour
    defaultBanReason: "Violated terms of service",
    bannedUserMessage: "Your account has been suspended. Please contact support if you believe this is an error.",
    allowImpersonatingAdmins: false,
  }),
  // ... other plugins
]
```

**Configuration Options:**
- `defaultRole`: Default role assigned to new users ("user")
- `adminRoles`: Roles that have admin privileges (["admin", "super_admin"])
- `impersonationSessionDuration`: How long impersonation sessions last (1 hour)
- `defaultBanReason`: Default reason when banning users
- `bannedUserMessage`: Message shown to banned users
- `allowImpersonatingAdmins`: Whether admins can impersonate other admins (false)

### 2. Frontend Client Configuration (`apps/frontend/lib/config/auth-client.ts`)

Added the admin client plugin:

```typescript
import { adminClient, oneTapClient, emailOTPClient } from "better-auth/client/plugins";

plugins: [
  adminClient(),
  // ... other plugins
]
```

### 3. Extended Type Definitions (`apps/frontend/lib/types/auth.ts`)

**Extended User Type:**
```typescript
export interface User extends BetterAuthUser {
  // ... existing fields
  banned?: boolean;
  banReason?: string;
  banExpires?: number;
}
```

**Extended Session Type:**
```typescript
export interface Session extends BetterAuthSession {
  impersonatedBy?: string;
}
```

**Admin Method Types:**
- `CreateUserData`: Data for creating new users
- `ListUsersQuery`: Query parameters for listing users
- `ListUsersResponse`: Response format for user lists
- `BanUserData`: Data for banning users
- `UpdateUserData`: Data for updating users
- `SetRoleData`: Data for setting user roles
- `SetPasswordData`: Data for setting user passwords

### 4. Auth Context Updates (`apps/frontend/lib/contexts/auth-context.tsx`)

Added admin methods to the auth context:

```typescript
admin: {
  createUser: (data: CreateUserData) => Promise<any>;
  listUsers: (query?: ListUsersQuery) => Promise<ListUsersResponse>;
  setRole: (data: SetRoleData) => Promise<any>;
  setUserPassword: (data: SetPasswordData) => Promise<any>;
  updateUser: (data: UpdateUserData) => Promise<any>;
  banUser: (data: BanUserData) => Promise<any>;
  unbanUser: (userId: string) => Promise<any>;
  listUserSessions: (userId: string) => Promise<any>;
  revokeUserSession: (sessionToken: string) => Promise<any>;
  revokeUserSessions: (userId: string) => Promise<any>;
  impersonateUser: (userId: string) => Promise<any>;
  stopImpersonating: () => Promise<any>;
  removeUser: (userId: string) => Promise<any>;
}
```

### 5. Auth Provider Implementation (`apps/frontend/components/providers/auth-provider.tsx`)

Implemented all admin methods with proper error handling:
- All methods wrapped in try/catch blocks
- Error state management
- Type-safe method signatures
- Memoized with `useCallback` for performance

### 6. Admin Hook (`apps/frontend/hooks/use-admin.ts`)

Created a utility hook for admin functionality:

```typescript
const { isAdmin, isImpersonated, isBanned, impersonatorId, admin } = useAdmin();
```

**Features:**
- `isAdmin`: Check if current user is an admin
- `isImpersonated`: Check if current session is impersonated
- `isBanned`: Check if current user is banned
- `impersonatorId`: Get ID of the user doing the impersonation
- `admin`: Access to all admin methods

### 7. Admin Dashboard Component (`apps/frontend/components/common/admin/admin-dashboard.tsx`)

Created a comprehensive example component demonstrating:
- User list with pagination
- Ban/unban functionality
- Role management
- User impersonation
- Session management
- Impersonation banner
- Permission checks
- Error handling
- Loading states

## Available Admin Methods

### User Management

#### Create User
```typescript
const { data, error } = await admin.createUser({
  email: "user@example.com",
  password: "secure-password",
  name: "John Doe",
  role: "user", // or ["user", "admin"]
  data: { customField: "value" }
});
```

#### List Users
```typescript
const { data, error } = await admin.listUsers({
  searchValue: "john",
  searchField: "name",
  searchOperator: "contains",
  limit: 10,
  offset: 0,
  sortBy: "createdAt",
  sortDirection: "desc",
  filterField: "role",
  filterValue: "admin",
  filterOperator: "eq"
});
```

#### Update User
```typescript
const { data, error } = await admin.updateUser({
  userId: "user-id",
  data: { name: "Jane Doe", phone_number: "+1234567890" }
});
```

#### Remove User
```typescript
const { data, error } = await admin.removeUser("user-id");
```

### Role Management

#### Set User Role
```typescript
const { data, error } = await admin.setRole({
  userId: "user-id",
  role: "admin" // or ["admin", "moderator"]
});
```

### Password Management

#### Set User Password
```typescript
const { data, error } = await admin.setUserPassword({
  userId: "user-id",
  newPassword: "new-secure-password"
});
```

### Ban Management

#### Ban User
```typescript
const { data, error } = await admin.banUser({
  userId: "user-id",
  banReason: "Spamming",
  banExpiresIn: 60 * 60 * 24 * 7 // 7 days in seconds
});
```

#### Unban User
```typescript
const { data, error } = await admin.unbanUser("user-id");
```

### Session Management

#### List User Sessions
```typescript
const { data, error } = await admin.listUserSessions("user-id");
```

#### Revoke User Session
```typescript
const { data, error } = await admin.revokeUserSession("session-token");
```

#### Revoke All User Sessions
```typescript
const { data, error } = await admin.revokeUserSessions("user-id");
```

### Impersonation

#### Impersonate User
```typescript
const { data, error } = await admin.impersonateUser("user-id");
// Session will be active for 1 hour (as configured)
```

#### Stop Impersonating
```typescript
await admin.stopImpersonating();
```

## Usage Examples

### Check if User is Admin

```tsx
import { useAdmin } from "@/hooks/use-admin";

export function MyComponent() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <p>Access denied</p>;
  }

  return <AdminContent />;
}
```

### Display Impersonation Banner

```tsx
import { useAdmin } from "@/hooks/use-admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { isImpersonated, impersonatorId, admin } = useAdmin();

  if (!isImpersonated) return null;

  return (
    <Alert>
      You are being impersonated by: {impersonatorId}
      <Button onClick={() => admin.stopImpersonating()}>
        Stop Impersonation
      </Button>
    </Alert>
  );
}
```

### Admin Users List

```tsx
import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/use-admin";

export function UsersList() {
  const { admin } = useAdmin();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      const { data } = await admin.listUsers({ limit: 50 });
      if (data) setUsers(data.users);
    }
    loadUsers();
  }, []);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.email}
          {user.banned && <span>(Banned)</span>}
        </li>
      ))}
    </ul>
  );
}
```

### Ban/Unban User

```tsx
const { admin } = useAdmin();

// Ban user
await admin.banUser({
  userId: "user-id",
  banReason: "Violated terms",
  banExpiresIn: 60 * 60 * 24 * 30 // 30 days
});

// Unban user
await admin.unbanUser("user-id");
```

## Database Schema

The admin plugin adds these fields to MongoDB:

### User Collection
- `role`: string (default: "user")
- `banned`: boolean
- `banReason`: string
- `banExpires`: date

### Session Collection
- `impersonatedBy`: string (user ID of impersonator)

**Note:** With MongoDB, these fields are created automatically when first used. No migration needed.

## Access Control

### Default Roles
- **admin**: Full control over all users
- **super_admin**: Full control over all users
- **user**: No admin permissions

### Checking Admin Status

Users are considered admins if:
1. Their `role` field contains "admin" or "super_admin"
2. Their user ID is in the `adminUserIds` list (if configured)

Multiple roles are stored comma-separated: `"user,admin"`

## Security Considerations

1. **Impersonation**: Disabled for admin-to-admin impersonation by default
2. **Ban Duration**: Always specify `banExpiresIn` for temporary bans
3. **Session Limits**: Impersonation sessions expire after 1 hour
4. **Banned Users**: Cannot sign in and all sessions are revoked when banned
5. **Role Validation**: Always validate admin status before performing admin operations

## Integration with Existing Auth

The admin plugin seamlessly integrates with your existing authentication:
- Works with email/password authentication
- Compatible with Google OAuth
- Works with email OTP verification
- Respects all existing user fields (companyId, first_name, etc.)

## Testing the Implementation

### Create an Admin User

You'll need to manually set a user's role to "admin" in MongoDB:

```javascript
db.user.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Or create one via the backend:

```typescript
await authServer.api.createUser({
  body: {
    email: "admin@example.com",
    password: "secure-password",
    name: "Admin User",
    role: "admin"
  }
});
```

### Test Admin Dashboard

1. Sign in as an admin user
2. Navigate to the admin dashboard page
3. View user list
4. Test ban/unban functionality
5. Test role changes
6. Test user impersonation

## Next Steps

### Recommended Implementations

1. **Admin Pages**
   - Create `/app/(protected)/admin/page.tsx` with the AdminDashboard component
   - Add admin navigation to app sidebar
   - Create separate pages for user management, roles, sessions

2. **Permission Middleware**
   - Create a `withAdmin` HOC for protecting admin routes
   - Add server-side permission checks for API routes

3. **Custom Access Control**
   - Implement fine-grained permissions beyond admin/user
   - Use Better Auth's `createAccessControl` for resource-level permissions

4. **Audit Logging**
   - Log all admin actions
   - Track impersonation sessions
   - Monitor ban/unban actions

5. **UI Enhancements**
   - Add search and filtering to user list
   - Implement pagination controls
   - Add bulk actions (ban multiple users, etc.)
   - Create user detail modals

## Files Created/Modified

### Created
1. `/apps/frontend/hooks/use-admin.ts` - Admin utility hook
2. `/apps/frontend/components/common/admin/admin-dashboard.tsx` - Example admin dashboard
3. `/apps/frontend/ADMIN_PLUGIN_IMPLEMENTATION.md` - This documentation

### Modified
1. `/apps/backend/src/api/v1/modules/auth/betterAuth.ts` - Added admin plugin
2. `/apps/frontend/lib/config/auth-client.ts` - Added adminClient plugin
3. `/apps/frontend/lib/types/auth.ts` - Added admin types and extended User/Session
4. `/apps/frontend/lib/contexts/auth-context.tsx` - Added admin methods to context
5. `/apps/frontend/components/providers/auth-provider.tsx` - Implemented admin methods

## Summary

The Better Auth Admin plugin is now fully integrated into your application. Administrators can:
- ✅ Create and manage users
- ✅ Assign and modify roles
- ✅ Ban and unban users
- ✅ Manage user sessions
- ✅ Impersonate users for support purposes
- ✅ Set user passwords
- ✅ List and filter users with pagination
- ✅ Remove users from the system

All admin functionality is type-safe, properly error-handled, and ready for production use.
