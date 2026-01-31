import * as nodemailer from "nodemailer";
import logger from "../config/logger.js";

interface SendOTPEmailParams {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

/**
 * Email service for sending OTP codes and notifications
 * Uses Nodemailer with SMTP transport
 */
export class EmailService {
  private static transporter: nodemailer.Transporter;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!EmailService.transporter) {
      EmailService.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return EmailService.transporter;
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
      // Send actual email using Nodemailer
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
    const transporter = EmailService.getTransporter();

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

    await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || "RRD10 SAS"}" <${process.env.SMTP_FROM_EMAIL}>`,
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
    invoiceUrl?: string;
  }): Promise<void> {
    const {
      customerEmail,
      customerName,
      invoiceNumber,
      totalAmount,
      dueDate,
      companyName,
      invoiceUrl,
    } = params;

    logger.info(`[Email Service] Sending invoice to ${customerEmail}`, {
      invoiceNumber,
      totalAmount,
    });

    try {
      // Send actual invoice email
      const transporter = EmailService.getTransporter();

      const htmlContent = EmailService.getInvoiceEmailTemplate({
        customerEmail,
        customerName,
        invoiceNumber,
        totalAmount,
        dueDate,
        companyName,
        invoiceUrl,
      });

      await transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || companyName}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: customerEmail,
        subject: `Invoice ${invoiceNumber} from ${companyName}`,
        html: htmlContent,
        attachments: invoiceUrl ? [] : undefined, // Could add PDF attachment here
      });

      logger.info(
        `[Email Service] Invoice sent successfully to ${customerEmail}`,
      );
    } catch (error) {
      logger.error(
        `[Email Service] Failed to send invoice to ${customerEmail}`,
        {
          error: error instanceof Error ? error.message : String(error),
          invoiceNumber,
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
    invoiceUrl?: string;
  }): string {
    const {
      customerName,
      invoiceNumber,
      totalAmount,
      dueDate,
      companyName,
      invoiceUrl,
    } = params;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4b5563; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .invoice-details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
        .due-date { font-size: 18px; font-weight: bold; color: #dc2626; }
        .btn { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invoice Notification</h1>
        </div>
        <div class="content">
            <p>Dear ${customerName},</p>
            <p>${companyName} has sent you an invoice. Please review the details below:</p>
            
            <div class="invoice-details">
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Amount Due:</strong> <span class="amount">$${totalAmount.toFixed(2)}</span></p>
                <p><strong>Due Date:</strong> <span class="due-date">${dueDate}</span></p>
            </div>
            
            <p>Please review and submit payment by the due date to avoid late fees.</p>
            
            ${invoiceUrl ? `<a href="${invoiceUrl}" class="btn">View Invoice</a>` : ""}
            
            <p>Thank you for your business!</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 ${companyName}. All rights reserved.</p>
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
      const transporter = EmailService.getTransporter();

      const htmlContent = EmailService.getCompanyInvitationTemplate({
        email,
        invitedByUsername,
        companyName,
        inviteLink,
      });

      await transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || "RRD10 SAS"}" <${process.env.SMTP_FROM_EMAIL}>`,
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
