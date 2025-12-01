# Email OTP Verification Implementation

## Overview
Email OTP (One-Time Password) verification has been successfully implemented for user registration using the Better Auth `emailOTP` plugin.

## Backend Changes

### 1. Email Service (`apps/backend/src/api/v1/services/email.service.ts`)
- Created `EmailService` class to handle OTP email sending
- Supports three OTP types:
  - `sign-in`: OTP for signing in
  - `email-verification`: OTP for verifying email addresses
  - `forget-password`: OTP for password reset
- Currently logs OTP to console for development
- **TODO**: Replace console.log with actual email service (SendGrid, Resend, NodeMailer, etc.)

### 2. Better Auth Configuration (`apps/backend/src/api/v1/modules/auth/betterAuth.ts`)
- Added `emailOTP` plugin to Better Auth configuration
- Configuration:
  - `otpLength`: 6 digits
  - `expiresIn`: 300 seconds (5 minutes)
  - `sendVerificationOnSignUp`: true (auto-send on signup)
  - `disableSignUp`: false (allow OTP signup)
  - `allowedAttempts`: 3 (max verification attempts)

## Frontend Changes

### 1. Auth Client (`apps/frontend/lib/config/auth-client.ts`)
- Added `emailOTPClient` plugin to the auth client
- Enables email OTP methods on the frontend

### 2. OTP Verification Component (`apps/frontend/components/common/auth/email-otp-verification.tsx`)
- Reusable component for OTP verification
- Features:
  - 6-digit OTP input with visual feedback
  - Resend OTP functionality
  - Error handling with user-friendly messages
  - Support for all three OTP types
  - Loading states and disabled states

### 3. Registration Flow
- Created `SignupWithVerification` wrapper component
- Two-step registration process:
  1. User fills out registration form
  2. User verifies email with OTP code
- Updated signup page to use new verification flow

## Usage

### User Registration Flow
1. User fills out registration form at `/signup`
2. Upon successful registration, user is shown OTP verification screen
3. User receives 6-digit OTP via email (currently logged to backend console)
4. User enters OTP to verify email
5. Upon successful verification, user is redirected to dashboard

### Available OTP Methods (Frontend)

```typescript
// Send OTP
await authClient.emailOtp.sendVerificationOtp({
  email: "user@example.com",
  type: "email-verification" // or "sign-in" or "forget-password"
});

// Verify Email
await authClient.emailOtp.verifyEmail({
  email: "user@example.com",
  otp: "123456"
});

// Sign In with OTP
await authClient.signIn.emailOtp({
  email: "user@example.com",
  otp: "123456"
});

// Reset Password
await authClient.emailOtp.resetPassword({
  email: "user@example.com",
  otp: "123456",
  password: "new-password"
});

// Check if email is verified (from session)
const { data: session } = useSession();
const isVerified = session?.user?.emailVerified;
```

### Email Verification Status

Better Auth automatically manages the `emailVerified` field:
- **Frontend Hook**: `useEmailVerification()` - Check verification status
- **Verification Banner**: Shows in protected routes if email is unverified
- **Backend Middleware**: `requireEmailVerification` - Protect routes that require verified emails
- **Auto-verification**: When user completes OTP verification, `emailVerified` is set to `true`

## Next Steps

### Production Requirements
1. **Email Service Integration**
   - Replace console.log in `EmailService` with actual email provider
   - Recommended options:
     - [Resend](https://resend.com) - Modern, developer-friendly
     - [SendGrid](https://sendgrid.com) - Enterprise-grade
     - [NodeMailer](https://nodemailer.com) - Self-hosted SMTP
   - Add email templates with branding
   - Add environment variables for email service credentials

2. **Email Templates**
   - Create HTML email templates for each OTP type
   - Include company branding
   - Add security warnings
   - Make mobile-responsive

3. **Rate Limiting**
   - Add rate limiting for OTP requests
   - Prevent abuse and spam
   - Consider using Redis for rate limiting

4. **Analytics & Monitoring**
   - Track OTP success/failure rates
   - Monitor email delivery rates
   - Alert on high failure rates

5. **Testing**
   - Add unit tests for email service
   - Add integration tests for OTP flow
   - Test email delivery in staging

## Environment Variables

Add these to your `.env` file for production:

```env
# Email Service Configuration (example for Resend)
EMAIL_SERVICE_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=RRD10 SAS

# Or for SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Or for SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=your-password
```

## Security Considerations

1. ✅ OTP expires after 5 minutes
2. ✅ Maximum 3 verification attempts per OTP
3. ✅ Non-blocking email sending prevents timing attacks
4. ✅ OTP stored in database (can be encrypted/hashed via plugin options)
5. ⚠️ Consider implementing rate limiting per email address
6. ⚠️ Add CAPTCHA for OTP request endpoints in production

## Files Modified/Created

### Backend
- ✅ `apps/backend/src/api/v1/services/email.service.ts` (new)
- ✅ `apps/backend/src/api/v1/modules/auth/betterAuth.ts` (modified)
- ✅ `apps/backend/src/api/v1/shared/middleware/email-verification.middleware.ts` (new)

### Frontend
- ✅ `apps/frontend/lib/config/auth-client.ts` (modified)
- ✅ `apps/frontend/components/common/auth/email-otp-verification.tsx` (new)
- ✅ `apps/frontend/components/common/auth/email-verification-banner.tsx` (new)
- ✅ `apps/frontend/components/forms/register-form/index.tsx` (new)
- ✅ `apps/frontend/components/forms/register-form/form.tsx` (modified)
- ✅ `apps/frontend/app/(auth)/signup/page.tsx` (modified)
- ✅ `apps/frontend/app/(protected)/layout.tsx` (modified)
- ✅ `apps/frontend/hooks/use-email-verification.ts` (new)
