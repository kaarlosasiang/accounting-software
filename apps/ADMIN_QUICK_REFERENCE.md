# Admin Plugin Quick Reference

## Import

```tsx
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/lib/contexts/auth-context";
```

## Check Admin Status

```tsx
const { isAdmin, isImpersonated, isBanned, impersonatorId } = useAdmin();

if (!isAdmin) {
  return <div>Access Denied</div>;
}
```

## List Users

```tsx
const { admin } = useAdmin();

const result = await admin.listUsers({
  searchValue: "john",
  searchField: "name",
  searchOperator: "contains",
  limit: 10,
  offset: 0,
  sortBy: "createdAt",
  sortDirection: "desc"
});

const users = result.data.users;
const total = result.data.total;
```

## Create User

```tsx
await admin.createUser({
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
  role: "user"
});
```

## Ban User

```tsx
await admin.banUser({
  userId: "user-id",
  banReason: "Spam",
  banExpiresIn: 60 * 60 * 24 * 7 // 7 days in seconds
});
```

## Unban User

```tsx
await admin.unbanUser("user-id");
```

## Set User Role

```tsx
await admin.setRole({
  userId: "user-id",
  role: "admin" // or ["admin", "moderator"]
});
```

## Update User

```tsx
await admin.updateUser({
  userId: "user-id",
  data: {
    name: "New Name",
    phone_number: "+1234567890"
  }
});
```

## Set User Password

```tsx
await admin.setUserPassword({
  userId: "user-id",
  newPassword: "new-password"
});
```

## List User Sessions

```tsx
const result = await admin.listUserSessions("user-id");
const sessions = result.data;
```

## Revoke Session

```tsx
// Single session
await admin.revokeUserSession("session-token");

// All user sessions
await admin.revokeUserSessions("user-id");
```

## Impersonate User

```tsx
// Start impersonation
await admin.impersonateUser("user-id");
window.location.reload(); // Refresh to activate

// Stop impersonation
await admin.stopImpersonating();
window.location.reload();
```

## Remove User

```tsx
await admin.removeUser("user-id");
```

## Display Impersonation Banner

```tsx
const { isImpersonated, impersonatorId, admin } = useAdmin();

{isImpersonated && (
  <Alert>
    Impersonated by: {impersonatorId}
    <Button onClick={async () => {
      await admin.stopImpersonating();
      window.location.reload();
    }}>
      Stop Impersonating
    </Button>
  </Alert>
)}
```

## Protect Admin Routes

```tsx
export default function AdminPage() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return <AdminDashboard />;
}
```

## Admin Context Access

```tsx
// Via useAuth hook
const { admin } = useAuth();
await admin.listUsers();

// Via useAdmin hook (recommended for admin features)
const { admin } = useAdmin();
await admin.listUsers();
```

## Error Handling

```tsx
try {
  await admin.banUser({ userId: "user-id", banReason: "Spam" });
} catch (error) {
  console.error("Failed to ban user:", error);
  // Handle error
}
```

## Common Patterns

### Check if User is Banned

```tsx
const { user } = useAuth();

if (user?.banned) {
  return <div>You are banned: {user.banReason}</div>;
}
```

### Admin Dashboard with User List

```tsx
function AdminDashboard() {
  const { admin } = useAdmin();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    admin.listUsers({ limit: 50 }).then(result => {
      setUsers(result.data.users);
    });
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          {user.name} - {user.email}
          {user.banned && <Badge>Banned</Badge>}
        </div>
      ))}
    </div>
  );
}
```

## Available Roles

- `user` - Default role, no admin permissions
- `admin` - Full admin permissions
- `super_admin` - Full admin permissions

## Notes

- MongoDB schema is created automatically - no migration needed
- Impersonation sessions last 1 hour by default
- Admins cannot impersonate other admins by default
- Banned users cannot sign in and all sessions are revoked
- Multiple roles stored as comma-separated: `"user,admin"`
