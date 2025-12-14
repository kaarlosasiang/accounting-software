# Auth Context & Provider Usage Guide

## Overview

The auth context provides a centralized way to manage authentication state and operations throughout the application using Better Auth.

## Setup

The `AuthProvider` is already configured in the root layout (`app/layout.tsx`), wrapping the entire application:

```tsx
<AuthProvider>
  {children}
</AuthProvider>
```

## Using the Auth Context

### Import the Hook

```tsx
import { useAuth } from "@/lib/contexts/auth-context";
```

### Access Auth State and Methods

```tsx
export default function MyComponent() {
  const {
    // State
    user,         // Current user object or null
    session,      // Current session object or null
    isLoading,    // Loading state (true during initial session check)
    error,        // Error object if any auth operation failed
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    updateUser,
    emailVerification,
  } = useAuth();

  // Your component logic
}
```

## Common Use Cases

### 1. Display User Information

```tsx
export default function UserProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <p>Email Verified: {user.emailVerified ? "Yes" : "No"}</p>
      {user.first_name && <p>First Name: {user.first_name}</p>}
      {user.phone_number && <p>Phone: {user.phone_number}</p>}
    </div>
  );
}
```

### 2. Sign In with Email/Password

```tsx
export default function LoginForm() {
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn.email(email, password);
      // Redirect to dashboard or show success message
      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.message}</div>}
      {/* Form fields */}
    </form>
  );
}
```

### 3. Sign In with Google (Social)

```tsx
export default function GoogleSignIn() {
  const { signIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signIn.social("google", {
        callbackURL: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign in failed:", err);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
}
```

### 4. Sign In with Email OTP

```tsx
export default function EmailOTPLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn.emailOtp(email, otp);
      router.push("/dashboard");
    } catch (err) {
      console.error("OTP login failed:", err);
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### 5. Sign Up New User

```tsx
export default function SignUpForm() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      });
      // User will be redirected to /dashboard (set in callbackURL)
    } catch (err) {
      console.error("Sign up failed:", err);
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### 6. Sign Out

```tsx
export default function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

### 7. Update User Profile

```tsx
export default function UpdateProfile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");

  const handleUpdate = async () => {
    try {
      await updateUser({ name });
      toast.success("Profile updated!");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleUpdate}>Update Name</button>
    </div>
  );
}
```

### 8. Email Verification

```tsx
export default function EmailVerification() {
  const { emailVerification, user } = useAuth();
  const [otp, setOtp] = useState("");

  const sendOTP = async () => {
    if (!user?.email) return;
    try {
      await emailVerification.sendOtp(user.email);
      toast.success("OTP sent to your email!");
    } catch (err) {
      console.error("Failed to send OTP:", err);
    }
  };

  const verifyEmail = async () => {
    if (!user?.email) return;
    try {
      await emailVerification.verifyEmail(user.email, otp);
      toast.success("Email verified!");
    } catch (err) {
      console.error("Verification failed:", err);
    }
  };

  return (
    <div>
      <button onClick={sendOTP}>Send Verification Code</button>
      <input value={otp} onChange={(e) => setOtp(e.target.value)} />
      <button onClick={verifyEmail}>Verify Email</button>
    </div>
  );
}
```

## Protected Routes

### Using the HOC (Higher-Order Component)

Wrap your page component with `withAuth`:

```tsx
import { withAuth } from "@/lib/auth/protected-route";

function DashboardPage() {
  return <div>Protected Dashboard Content</div>;
}

export default withAuth(DashboardPage);
```

With options:

```tsx
export default withAuth(DashboardPage, {
  redirectTo: "/login",        // Where to redirect if not authenticated
  allowUnverified: false,      // Require email verification
});
```

### Using the Hook

Use `useProtectedRoute` hook in your component:

```tsx
import { useProtectedRoute } from "@/lib/auth/protected-route";

export default function DashboardPage() {
  const { user, isLoading } = useProtectedRoute();

  if (isLoading) return <div>Loading...</div>;

  return <div>Welcome, {user?.name}!</div>;
}
```

### Guest Routes (Redirect if Logged In)

For login/signup pages that should redirect authenticated users:

```tsx
import { useGuestRoute } from "@/lib/auth/protected-route";

export default function LoginPage() {
  const { isLoading } = useGuestRoute({ redirectTo: "/dashboard" });

  if (isLoading) return <div>Loading...</div>;

  return <div>Login Form</div>;
}
```

## Checking Authentication State

### Conditionally Render Based on Auth

```tsx
export default function Navbar() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <nav>Loading...</nav>;
  }

  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          <SignOutButton />
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

### Check Specific User Properties

```tsx
const { user } = useAuth();

// Check if email is verified
if (user?.emailVerified) {
  // Show verified content
}

// Check user role (if you have roles implemented)
if (user?.role === "admin") {
  // Show admin content
}

// Check company/organization
if (user?.companyId) {
  // Show company-specific content
}
```

## Error Handling

The auth context automatically manages errors. Access them via the `error` property:

```tsx
const { error } = useAuth();

{error && (
  <Alert variant="destructive">
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

## Loading States

Use the `isLoading` property to show loading indicators:

```tsx
const { isLoading, user } = useAuth();

if (isLoading) {
  return <Skeleton />;
}
```

## TypeScript Types

All types are properly typed from Better Auth:

- `User` - User object type
- `Session` - Session object type
- `AuthContextValue` - Full context type

Import types:

```tsx
import type { User, Session } from "better-auth/types";
import type { AuthContextValue } from "@/lib/contexts/auth-context";
```

## Future: Organization Support

The auth context is ready for Better Auth's Organization plugin. Once implemented, you'll be able to:

```tsx
const { activeOrganization, setActiveOrganization } = useAuth();

// Switch organizations
await setActiveOrganization("org-id");
```

## Notes

- The auth context uses Better Auth's `useSession` hook under the hood
- Session data is automatically synced with the backend
- All auth methods return promises that you should handle with try/catch
- The provider is already configured in the root layout - no need to wrap it again
- Loading states are managed automatically during session checks
