# Auth Context Quick Reference

## Import Statement
```tsx
import { useAuth } from "@/lib/contexts/auth-context";
```

## Get Current User & Session
```tsx
const { user, session, isLoading, error } = useAuth();
```

## Check Authentication Status
```tsx
if (!user) {
  // User is not authenticated
}

if (user?.emailVerified) {
  // Email is verified
}

if (user?.role === "admin") {
  // User is admin
}
```

## Sign In Methods

### Email/Password
```tsx
const { signIn } = useAuth();
await signIn.email("user@example.com", "password123");
```

### Google OAuth
```tsx
await signIn.social("google", { callbackURL: "/dashboard" });
```

### Email OTP
```tsx
await signIn.emailOtp("user@example.com", "123456");
```

## Sign Up
```tsx
const { signUp } = useAuth();
await signUp.email({
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+639123456789",
});
```

## Sign Out
```tsx
const { signOut } = useAuth();
await signOut();
router.push("/login");
```

## Update User Profile
```tsx
const { updateUser } = useAuth();
await updateUser({ name: "New Name" });
```

## Email Verification
```tsx
const { emailVerification } = useAuth();

// Send OTP
await emailVerification.sendOtp(user.email);

// Verify email
await emailVerification.verifyEmail(user.email, "123456");
```

## Protect Routes

### HOC (Recommended for full pages)
```tsx
import { withAuth } from "@/lib/auth/protected-route";

function MyPage() {
  return <div>Protected content</div>;
}

export default withAuth(MyPage, {
  redirectTo: "/login",
  allowUnverified: false, // Require email verification
});
```

### Hook (Recommended for inline protection)
```tsx
import { useProtectedRoute } from "@/lib/auth/protected-route";

export default function MyPage() {
  const { user, isLoading } = useProtectedRoute();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>Hello, {user?.name}</div>;
}
```

### Guest Route (Redirect if logged in)
```tsx
import { useGuestRoute } from "@/lib/auth/protected-route";

export default function LoginPage() {
  useGuestRoute({ redirectTo: "/dashboard" });
  
  return <div>Login form</div>;
}
```

## Loading States
```tsx
const { isLoading } = useAuth();

if (isLoading) {
  return <Skeleton />;
}
```

## Error Handling
```tsx
const { error, signIn } = useAuth();

try {
  await signIn.email(email, password);
} catch (err) {
  console.error(err);
}

// Or access context error
{error && <Alert>{error.message}</Alert>}
```

## Conditional Rendering
```tsx
const { user } = useAuth();

return (
  <>
    {user ? (
      <div>Welcome, {user.name}!</div>
    ) : (
      <Link href="/login">Sign In</Link>
    )}
  </>
);
```

## Access Additional User Fields
```tsx
const { user } = useAuth();

console.log(user?.first_name);
console.log(user?.middle_name);
console.log(user?.last_name);
console.log(user?.phone_number);
console.log(user?.username);
console.log(user?.companyId);
console.log(user?.role);
```

## Role-Based Access
```tsx
const { user } = useAuth();

const isAdmin = user?.role === "admin";
const isAccountant = user?.role === "accountant";
const isOwner = user?.role === "owner";

{isAdmin && <AdminPanel />}
```

## Session Information
```tsx
const { session } = useAuth();

if (session) {
  console.log("Session ID:", session.id);
  console.log("Created:", new Date(session.createdAt));
  console.log("Expires:", new Date(session.expiresAt));
}
```

## Common Patterns

### Profile Page
```tsx
export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  
  if (isLoading) return <Skeleton />;
  if (!user) return <Redirect to="/login" />;
  
  return (
    <div>
      <Avatar src={user.image} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <Button onClick={() => updateUser({ name: "New Name" })}>
        Update Profile
      </Button>
    </div>
  );
}
```

### Navbar with Auth
```tsx
export function Navbar() {
  const { user, signOut } = useAuth();
  
  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          <Button onClick={() => signOut()}>Sign Out</Button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

### Protected Component
```tsx
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.role !== "admin") {
    return <div>Access denied</div>;
  }
  
  return <>{children}</>;
}
```

## TypeScript Types
```tsx
import type { User, Session } from "@/lib/types/auth";
import type { AuthContextValue } from "@/lib/contexts/auth-context";
```

## Notes
- All auth methods are async - use `await` or `.then()`
- Session persists across page refreshes automatically
- Protected routes redirect automatically
- Loading states prevent flash of unauthenticated content
- Error states are managed in context
- TypeScript types ensure type safety
