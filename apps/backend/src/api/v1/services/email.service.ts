import logger from "../config/logger";

interface SendOTPEmailParams {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

/**
 * Email service for sending OTP codes
 * TODO: Replace console.log with actual email service (SendGrid, Resend, NodeMailer, etc.)
 */
export class EmailService {
  /**
   * Send OTP verification email
   * @param params - Email parameters including recipient, OTP, and type
   */
  static async sendVerificationOTP(params: SendOTPEmailParams): Promise<void> {
    const { email, otp, type } = params;

    // Log the OTP for development (REMOVE IN PRODUCTION)
    logger.info(`[Email Service] Sending OTP to ${email}`, {
      type,
      otp: process.env.NODE_ENV === "development" ? otp : "***", // Hide in production
    });

    try {
      // TODO: Implement actual email sending logic here
      // Example with SendGrid, Resend, or NodeMailer:

      switch (type) {
        case "sign-in":
          await this.sendSignInOTP(email, otp);
          break;
        case "email-verification":
          await this.sendEmailVerificationOTP(email, otp);
          break;
        case "forget-password":
          await this.sendPasswordResetOTP(email, otp);
          break;
        default:
          throw new Error(`Unknown OTP type: ${type}`);
      }

      logger.info(`[Email Service] OTP sent successfully to ${email}`);
    } catch (error) {
      logger.error(`[Email Service] Failed to send OTP to ${email}`, {
        error: error instanceof Error ? error.message : String(error),
        type,
      });
      // Don't throw - we don't want to block the flow if email fails
      // In production, you might want to queue for retry
    }
  }

  private static async sendSignInOTP(
    email: string,
    otp: string,
  ): Promise<void> {
    // TODO: Replace with actual email sending
    console.log(`
╔════════════════════════════════════════╗
║      SIGN-IN OTP VERIFICATION          ║
╠════════════════════════════════════════╣
║ To: ${email.padEnd(38)}║
║ OTP Code: ${otp.padEnd(31)}║
║                                        ║
║ Use this code to sign in to your      ║
║ RRD10 SAS account.                     ║
║                                        ║
║ This code expires in 5 minutes.       ║
╚════════════════════════════════════════╝
    `);
  }

  private static async sendEmailVerificationOTP(
    email: string,
    otp: string,
  ): Promise<void> {
    // TODO: Replace with actual email sending
    console.log(`
╔════════════════════════════════════════╗
║    EMAIL VERIFICATION CODE             ║
╠════════════════════════════════════════╣
║ To: ${email.padEnd(38)}║
║ Verification Code: ${otp.padEnd(23)}║
║                                        ║
║ Please verify your email address      ║
║ to complete your RRD10 SAS account     ║
║ registration.                          ║
║                                        ║
║ This code expires in 5 minutes.       ║
╚════════════════════════════════════════╝
    `);
  }

  private static async sendPasswordResetOTP(
    email: string,
    otp: string,
  ): Promise<void> {
    // TODO: Replace with actual email sending
    console.log(`
╔════════════════════════════════════════╗
║      PASSWORD RESET CODE               ║
╠════════════════════════════════════════╣
║ To: ${email.padEnd(38)}║
║ Reset Code: ${otp.padEnd(28)}║
║                                        ║
║ Use this code to reset your password  ║
║ for your RRD10 SAS account.            ║
║                                        ║
║ If you didn't request this, please    ║
║ ignore this email.                     ║
║                                        ║
║ This code expires in 5 minutes.       ║
╚════════════════════════════════════════╝
    `);
  }
}
