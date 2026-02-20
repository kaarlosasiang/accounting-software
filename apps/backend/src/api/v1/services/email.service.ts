import { Resend } from "resend";
import logger from "../config/logger.js";

interface SendOTPEmailParams {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

/**
 * Email service for sending OTP codes and notifications
 * Uses Resend API for email delivery
 */
export class EmailService {
  private static resend: Resend;

  /**
   * Initialize Resend client
   */
  private static getResendClient(): Resend {
    if (!EmailService.resend) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error(
          "RESEND_API_KEY is not configured in environment variables",
        );
      }
      EmailService.resend = new Resend(apiKey);
    }
    return EmailService.resend;
  }

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
      // Send actual email using Resend
      await this.sendOTPEmail(email, otp, type);

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

  private static async sendOTPEmail(
    email: string,
    otp: string,
    type: string,
  ): Promise<void> {
    const resend = EmailService.getResendClient();

    let subject: string;
    let htmlContent: string;

    switch (type) {
      case "sign-in":
        subject = "Sign-In Verification Code - RRD10 SAS";
        htmlContent = EmailService.getSignInOTPTemplate(email, otp);
        break;
      case "email-verification":
        subject = "Email Verification Code - RRD10 SAS";
        htmlContent = EmailService.getEmailVerificationTemplate(email, otp);
        break;
      case "forget-password":
        subject = "Password Reset Code - RRD10 SAS";
        htmlContent = EmailService.getPasswordResetTemplate(email, otp);
        break;
      default:
        throw new Error(`Unknown OTP type: ${type}`);
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const companyName = process.env.COMPANY_NAME || "RRD10 SAS";

    await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: email,
      subject,
      html: htmlContent,
    });
  }

  /**
   * HTML Template for Sign-In OTP
   */
  private static getSignInOTPTemplate(email: string, otp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sign-In Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .otp { font-size: 24px; font-weight: bold; background: #e5e7eb; padding: 10px; text-align: center; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sign-In Verification</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You requested to sign in to your RRD10 SAS account. Use the verification code below:</p>
            <div class="otp">${otp}</div>
            <p>This code will expire in 5 minutes for your security.</p>
            <p>If you didn't request this sign-in, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 RRD10 SAS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * HTML Template for Email Verification OTP
   */
  private static getEmailVerificationTemplate(
    email: string,
    otp: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .otp { font-size: 24px; font-weight: bold; background: #e5e7eb; padding: 10px; text-align: center; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Please verify your email address to complete your RRD10 SAS account registration:</p>
            <div class="otp">${otp}</div>
            <p>This code will expire in 5 minutes for your security.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 RRD10 SAS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Send invoice to customer
   * @param params - Invoice email parameters
   */
  static async sendInvoice(params: {
    customerEmail: string;
    customerName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    companyName: string;
    currency?: string;
    invoiceUrl?: string;
    pdfAttachment?: Buffer; // PDF attachment as buffer
  }): Promise<void> {
    const {
      customerEmail,
      customerName,
      invoiceNumber,
      totalAmount,
      dueDate,
      companyName,
      currency = "PHP",
      invoiceUrl,
      pdfAttachment,
    } = params;

    logger.info(
      `[Email Service] Preparing to send invoice to ${customerEmail}`,
      {
        invoiceNumber,
        totalAmount,
        customerName,
        companyName,
        hasPdfAttachment: !!pdfAttachment,
      },
    );

    try {
      // Send actual invoice email
      const resend = EmailService.getResendClient();

      const htmlContent = EmailService.getInvoiceEmailTemplate({
        customerEmail,
        customerName,
        invoiceNumber,
        totalAmount,
        dueDate,
        companyName,
        currency,
        invoiceUrl,
      });

      const fromEmail =
        process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      logger.info(`[Email Service] Calling Resend API...`, {
        from: `${companyName} <${fromEmail}>`,
        to: customerEmail,
        subject: `Invoice ${invoiceNumber} from ${companyName}`,
        hasAttachment: !!pdfAttachment,
      });

      // Prepare email options
      const emailOptions: any = {
        from: `${companyName} <${fromEmail}>`,
        to: customerEmail,
        subject: `Invoice ${invoiceNumber} from ${companyName}`,
        html: htmlContent,
      };

      // Add PDF attachment if provided
      if (pdfAttachment) {
        emailOptions.attachments = [
          {
            filename: `Invoice-${invoiceNumber}.pdf`,
            content: pdfAttachment,
          },
        ];
      }

      const response = await resend.emails.send(emailOptions);

      logger.info(`[Email Service] Resend API response received`, {
        response: JSON.stringify(response),
        customerEmail,
        invoiceNumber,
      });

      if (response.error) {
        throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
      }

      logger.info(
        `[Email Service] Invoice email sent successfully to ${customerEmail}`,
        {
          emailId: response.data?.id,
          invoiceNumber,
        },
      );
    } catch (error) {
      logger.error(
        `[Email Service] Failed to send invoice to ${customerEmail}`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          invoiceNumber,
          customerEmail,
        },
      );
      throw error;
    }
  }

  /**
   * HTML Template for Password Reset OTP
   */
  private static getPasswordResetTemplate(email: string, otp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .otp { font-size: 24px; font-weight: bold; background: #e5e7eb; padding: 10px; text-align: center; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your RRD10 SAS account. Use the verification code below:</p>
            <div class="otp">${otp}</div>
            <p>This code will expire in 5 minutes for your security.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 RRD10 SAS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * HTML Template for Invoice Email
   */
  private static getInvoiceEmailTemplate(params: {
    customerEmail: string;
    customerName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    companyName: string;
    currency: string;
    invoiceUrl?: string;
  }): string {
    const {
      customerName,
      invoiceNumber,
      totalAmount,
      dueDate,
      companyName,
      currency,
      invoiceUrl,
    } = params;

    // Currency symbols mapping
    const currencySymbols: Record<string, string> = {
      PHP: "₱",
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CNY: "¥",
      AUD: "A$",
      CAD: "C$",
      INR: "₹",
    };

    const currencySymbol = currencySymbols[currency] || currency + " ";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber} from ${companyName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background-color: #f9fafb;
        }
        .email-wrapper { width: 100%; padding: 20px 0; background-color: #f9fafb; }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header { 
            background: linear-gradient(135deg, #2d7c4f 0%, #1e5a37 100%); 
            color: white; 
            padding: 40px;
            text-align: center;
            position: relative;
        }
        .logo-container {
            margin-bottom: 16px;
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .header p { 
            font-size: 14px; 
            opacity: 0.95;
            margin: 0;
        }
        .content { 
            padding: 40px 40px 32px;
        }
        .greeting { 
            font-size: 16px; 
            color: #374151; 
            margin-bottom: 24px;
        }
        .invoice-card { 
            background: linear-gradient(to bottom right, #ecfdf5, #d1fae5); 
            border: 2px solid #86efac;
            border-radius: 12px; 
            padding: 24px;
            margin: 24px 0;
        }
        .invoice-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 12px 0;
        }
        .invoice-row:not(:last-child) { 
            border-bottom: 1px solid #bbf7d0;
        }
        .invoice-label { 
            font-size: 14px; 
            font-weight: 600; 
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .invoice-value { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1f2937;
        }
        .amount-row { 
            background: white;
            border-radius: 8px;
            padding: 16px !important;
            margin-top: 8px;
            border: none !important;
        }
        .amount-label { 
            font-size: 16px; 
            color: #1f2937;
        }
        .amount-value { 
            font-size: 32px; 
            font-weight: 700; 
            color: #16a34a;
        }
        .due-date-value { 
            color: #dc2626;
            font-weight: 700;
        }
        .message { 
            font-size: 15px; 
            color: #4b5563; 
            margin: 24px 0;
            line-height: 1.7;
        }
        .btn-container { 
            text-align: center; 
            margin: 32px 0;
        }
        .btn { 
            display: inline-block;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); 
            color: white !important; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);
            transition: all 0.2s;
        }
        .btn:hover { 
            background: linear-gradient(135deg, #15803d 0%, #166534 100%);
            box-shadow: 0 6px 8px -1px rgba(22, 163, 74, 0.4);
        }
        .divider { 
            height: 1px; 
            background: linear-gradient(to right, transparent, #e5e7eb, transparent); 
            margin: 32px 0;
        }
        .footer { 
            background: #f9fafb; 
            padding: 32px 40px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
        }
        .footer-text { 
            font-size: 13px; 
            color: #6b7280; 
            margin: 8px 0;
        }
        .company-name { 
            font-weight: 700; 
            color: #16a34a;
        }
        .accent-gold {
            color: #b4975a;
        }
        @media only screen and (max-width: 600px) {
            .content { padding: 24px 20px; }
            .header { padding: 32px 20px; }
            .footer { padding: 24px 20px; }
            .invoice-card { padding: 16px; }
            .amount-value { font-size: 28px; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <div class="logo-container">
                    <svg width="60" height="60" viewBox="0 0 100 100" style="display: inline-block;">
                        <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="2"/>
                        <path d="M35 65 L50 35 L65 65" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="40" y1="55" x2="60" y2="55" stroke="white" stroke-width="4" stroke-linecap="round"/>
                        <path d="M30 45 Q30 35 40 35 L40 50" fill="none" stroke="#b4975a" stroke-width="3" stroke-linecap="round"/>
                        <path d="M70 45 Q70 35 60 35 L60 50" fill="none" stroke="#b4975a" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                </div>
                <h1>📧 New Invoice</h1>
                <p>You have received an invoice from <strong>${companyName}</strong></p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <strong>Dear ${customerName},</strong>
                </div>
                
                <p class="message">
                    <span class="company-name">${companyName}</span> has sent you an invoice. 
                    Please review the details below and submit payment by the due date.
                </p>
                
                <div class="invoice-card">
                    <div class="invoice-row">
                        <span class="invoice-label">Invoice Number</span>
                        <span class="invoice-value">${invoiceNumber}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="invoice-label">Due Date</span>
                        <span class="invoice-value due-date-value">${dueDate}</span>
                    </div>
                    <div class="invoice-row amount-row">
                        <span class="amount-label">Amount Due</span>
                        <span class="amount-value">${currencySymbol}${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                
                ${
                  invoiceUrl
                    ? `
                <div class="btn-container">
                    <a href="${invoiceUrl}" class="btn">View Full Invoice</a>
                </div>
                `
                    : ""
                }
                
                <div class="divider"></div>
                
                <p class="message">
                    Thank you for your business! If you have any questions about this invoice, 
                    please don't hesitate to contact us.
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    <strong class="company-name">${companyName}</strong>
                </p>
                <p class="footer-text">
                    &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
                </p>
                <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Send company invitation email
   */
  static async sendCompanyInvitation(params: {
    email: string;
    invitedByUsername: string;
    invitedByEmail: string;
    companyName: string;
    inviteLink: string;
  }): Promise<void> {
    const { email, invitedByUsername, companyName, inviteLink } = params;

    logger.info(`[Email Service] Sending company invitation to ${email}`);

    try {
      // Send actual company invitation email
      const resend = EmailService.getResendClient();

      const htmlContent = EmailService.getCompanyInvitationTemplate({
        email,
        invitedByUsername,
        companyName,
        inviteLink,
      });

      const fromEmail =
        process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const senderName = process.env.COMPANY_NAME || "RRD10 SAS";

      await resend.emails.send({
        from: `${senderName} <${fromEmail}>`,
        to: email,
        subject: `Company Invitation - ${companyName}`,
        html: htmlContent,
      });

      logger.info(`[Email Service] Company invitation sent to ${email}`);
    } catch (error) {
      logger.error(
        `[Email Service] Failed to send company invitation to ${email}`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * HTML Template for Company Invitation
   */
  private static getCompanyInvitationTemplate(params: {
    email: string;
    invitedByUsername: string;
    companyName: string;
    inviteLink: string;
  }): string {
    const { invitedByUsername, companyName, inviteLink } = params;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Company Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .invitation-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #7c3aed; }
        .btn { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Company Invitation</h1>
        </div>
        <div class="content">
            <p>Hello!</p>
            <p><strong>${invitedByUsername}</strong> has invited you to join:</p>
            
            <div class="invitation-box">
                <h2>${companyName}</h2>
                <p>You've been invited to collaborate on this company's accounting system.</p>
            </div>
            
            <a href="${inviteLink}" class="btn">Accept Invitation</a>
            
            <p>This invitation will expire in 7 days for security reasons.</p>
            <p>If you don't recognize this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 RRD10 SAS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }
}
