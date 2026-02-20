import PDFDocument from "pdfkit";
import { IInvoiceDocument } from "../shared/interface/IInvoice.js";
import logger from "../config/logger.js";

/**
 * Company information for PDF generation
 */
interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

/**
 * Customer information for PDF generation
 */
interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * PDF Service for generating documents
 */
export class PDFService {
  /**
   * Generate invoice PDF as a Buffer
   * @param invoice - The invoice document with populated customer data
   * @param companyInfo - Company information to display on invoice
   * @param currency - Currency symbol (default: PHP)
   * @returns Promise<Buffer> - The PDF as a buffer
   */
  static async generateInvoicePDF(
    invoice: IInvoiceDocument,
    companyInfo: CompanyInfo,
    currency: string = "PHP",
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        logger.info(
          `[PDF Service] Generating PDF for invoice ${invoice.invoiceNumber}`,
        );

        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
        });

        // Collect PDF data in chunks
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          logger.info(
            `[PDF Service] PDF generated successfully for invoice ${invoice.invoiceNumber}`,
            {
              size: pdfBuffer.length,
            },
          );
          resolve(pdfBuffer);
        });
        doc.on("error", (error) => {
          logger.error(
            `[PDF Service] Error generating PDF for invoice ${invoice.invoiceNumber}`,
            {
              error: error.message,
            },
          );
          reject(error);
        });

        // Extract customer info
        const customer = invoice.customerId as any;
        const customerInfo: CustomerInfo = {
          name: customer.displayName || customer.customerName || "N/A",
          email: customer.email,
          phone: customer.phone,
          address: customer.billingAddress,
        };

        // Generate PDF content
        this.generateInvoiceContent(
          doc,
          invoice,
          companyInfo,
          customerInfo,
          currency,
        );

        // Finalize PDF
        doc.end();
      } catch (error) {
        logger.error(
          `[PDF Service] Failed to generate PDF for invoice ${invoice.invoiceNumber}`,
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
        reject(error);
      }
    });
  }

  /**
   * Generate the actual invoice content
   */
  private static generateInvoiceContent(
    doc: PDFKit.PDFDocument,
    invoice: IInvoiceDocument,
    company: CompanyInfo,
    customer: CustomerInfo,
    currency: string,
  ): void {
    const primaryColor = "#3B82F6"; // blue-500
    const darkGray = "#374151"; // gray-700
    const lightGray = "#F3F4F6"; // gray-100

    let yPos = 50;

    // Header - Company Info
    doc
      .fontSize(24)
      .fillColor(primaryColor)
      .text(company.name, 50, yPos, { continued: false });

    yPos += 30;
    doc.fontSize(9).fillColor(darkGray);

    if (company.address) {
      doc.text(company.address, 50, yPos, { continued: false });
      yPos += 12;
    }
    if (company.phone) {
      doc.text(`Phone: ${company.phone}`, 50, yPos, { continued: false });
      yPos += 12;
    }
    if (company.email) {
      doc.text(`Email: ${company.email}`, 50, yPos, { continued: false });
      yPos += 12;
    }
    if (company.website) {
      doc.text(company.website, 50, yPos, { continued: false });
      yPos += 12;
    }

    // Invoice Title and Number (Right side)
    doc.fontSize(28).fillColor(primaryColor).text("INVOICE", 400, 50, {
      align: "right",
      continued: false,
    });

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .text(`#${invoice.invoiceNumber}`, 400, 85, {
        align: "right",
        continued: false,
      });

    // Invoice status badge
    const statusColors: Record<string, string> = {
      Draft: "#6B7280",
      Sent: "#3B82F6",
      Partial: "#F59E0B",
      Paid: "#10B981",
      Overdue: "#EF4444",
      Void: "#6B7280",
    };
    const statusColor = statusColors[invoice.status] || "#6B7280";

    doc
      .fontSize(9)
      .fillColor(statusColor)
      .text(invoice.status.toUpperCase(), 400, 100, {
        align: "right",
        continued: false,
      });

    // Reset position for next section
    yPos = Math.max(yPos, 140);

    // Divider line
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .stroke();

    yPos += 20;

    // Bill To Section (Left side)
    const billToStartY = yPos;
    doc
      .fontSize(10)
      .fillColor(darkGray)
      .text("BILL TO:", 50, billToStartY, { continued: false });
    yPos = billToStartY + 18;

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(customer.name, 50, yPos, { continued: false });
    yPos += 18;

    doc.fontSize(9).fillColor(darkGray);
    if (customer.email) {
      doc.text(customer.email, 50, yPos, { continued: false });
      yPos += 14;
    }
    if (customer.phone) {
      doc.text(customer.phone, 50, yPos, { continued: false });
      yPos += 14;
    }
    if (customer.address) {
      // Format address - handle both string and object formats
      let addressText = "";
      if (typeof customer.address === "string") {
        addressText = customer.address;
      } else if (customer.address && typeof customer.address === "object") {
        const addr = customer.address as any;
        const parts = [
          addr.street,
          [addr.city, addr.state].filter(Boolean).join(", "),
          addr.country,
        ].filter(Boolean);
        addressText = parts.join("\n");
      }
      if (addressText) {
        doc.text(addressText, 50, yPos, { width: 250, continued: false });
        yPos += 14 + (addressText.split("\n").length - 1) * 12;
      }
    }

    // Invoice Details (Right side) - align with bill-to section
    let detailsY = billToStartY;
    doc.fontSize(9).fillColor(darkGray);

    doc.text("Invoice Date:", 350, detailsY, { width: 100, continued: false });
    doc.text(
      invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toLocaleDateString()
        : "N/A",
      460,
      detailsY,
      { align: "right", width: 85, continued: false },
    );
    detailsY += 18;

    doc.text("Due Date:", 350, detailsY, { width: 100, continued: false });
    doc.text(new Date(invoice.dueDate).toLocaleDateString(), 460, detailsY, {
      align: "right",
      width: 85,
      continued: false,
    });
    detailsY += 18;

    if (invoice.amountPaid > 0) {
      doc.text("Amount Paid:", 350, detailsY, { width: 100, continued: false });
      doc.text(
        this.formatCurrency(invoice.amountPaid, currency),
        460,
        detailsY,
        { align: "right", width: 85, continued: false },
      );
      detailsY += 18;
    }

    yPos = Math.max(yPos, detailsY) + 10;

    // Line Items Table
    yPos += 15;

    // Table header background
    doc.save();
    doc.rect(50, yPos, 495, 28).fill(primaryColor);
    doc.restore();

    // Table header text (white text on blue background)
    doc.fontSize(10).fillColor("#FFFFFF");
    const headerY = yPos + 10;
    doc.text("Description", 55, headerY, { width: 260, continued: false });
    doc.text("Qty", 320, headerY, {
      width: 40,
      align: "center",
      continued: false,
    });
    doc.text("Unit Price", 370, headerY, {
      width: 80,
      align: "right",
      continued: false,
    });
    doc.text("Amount", 460, headerY, {
      width: 80,
      align: "right",
      continued: false,
    });

    yPos += 28;

    // Table rows
    let rowIndex = 0;

    for (const item of invoice.lineItems) {
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      const rowHeight = 25;

      // Alternate row background (light gray for even rows)
      if (rowIndex % 2 === 0) {
        doc.save();
        doc.rect(50, yPos, 495, rowHeight).fill(lightGray);
        doc.restore();
      }

      // Row text (always dark gray)
      doc.fontSize(9).fillColor(darkGray);
      const rowY = yPos + 8;
      doc.text(item.description, 55, rowY, { width: 260, continued: false });
      doc.text(item.quantity.toString(), 320, rowY, {
        width: 40,
        align: "center",
        continued: false,
      });
      doc.text(this.formatCurrency(item.unitPrice, currency), 370, rowY, {
        width: 80,
        align: "right",
        continued: false,
      });
      doc.text(this.formatCurrency(item.amount, currency), 460, rowY, {
        width: 80,
        align: "right",
        continued: false,
      });

      yPos += rowHeight;
      rowIndex++;
    }

    // Totals section
    yPos += 10;
    const totalsX = 350;
    const totalsAmountX = 460;

    doc.fontSize(9).fillColor(darkGray);

    // Subtotal
    doc.text("Subtotal:", totalsX, yPos, { continued: false });
    doc.text(
      this.formatCurrency(invoice.subtotal, currency),
      totalsAmountX,
      yPos,
      {
        width: 85,
        align: "right",
        continued: false,
      },
    );
    yPos += 18;

    // Discount
    if (invoice.discount > 0) {
      doc.text("Discount:", totalsX, yPos, { continued: false });
      doc.text(
        `-${this.formatCurrency(invoice.discount, currency)}`,
        totalsAmountX,
        yPos,
        {
          width: 85,
          align: "right",
          continued: false,
        },
      );
      yPos += 18;
    }

    // Tax
    if (invoice.taxAmount > 0) {
      doc.text(`Tax (${invoice.taxRate}%):`, totalsX, yPos, {
        continued: false,
      });
      doc.text(
        this.formatCurrency(invoice.taxAmount, currency),
        totalsAmountX,
        yPos,
        {
          width: 85,
          align: "right",
          continued: false,
        },
      );
      yPos += 18;
    }

    // Total line
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(totalsX, yPos)
      .lineTo(545, yPos)
      .stroke();
    yPos += 12;

    // Total amount
    doc.fontSize(11).fillColor("#000000").font("Helvetica-Bold");
    doc.text("Total:", totalsX, yPos, { continued: false });
    doc.text(
      this.formatCurrency(invoice.totalAmount, currency),
      totalsAmountX,
      yPos,
      {
        width: 85,
        align: "right",
        continued: false,
      },
    );
    yPos += 22;

    // Balance Due
    if (invoice.balanceDue > 0) {
      doc.fontSize(10).fillColor(primaryColor);
      doc.text("Balance Due:", totalsX, yPos, { continued: false });
      doc.text(
        this.formatCurrency(invoice.balanceDue, currency),
        totalsAmountX,
        yPos,
        {
          width: 85,
          align: "right",
          continued: false,
        },
      );
      yPos += 20;
    }

    // Reset font
    doc.font("Helvetica");

    // Notes section
    if (invoice.notes) {
      yPos += 20;
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc
        .fontSize(10)
        .fillColor(darkGray)
        .text("Notes:", 50, yPos, { continued: false });
      yPos += 15;
      doc
        .fontSize(9)
        .fillColor(darkGray)
        .text(invoice.notes, 50, yPos, { width: 495, continued: false });
    }

    // Terms section
    if (invoice.terms) {
      yPos += invoice.notes ? 20 : 40;
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc
        .fontSize(10)
        .fillColor(darkGray)
        .text("Terms & Conditions:", 50, yPos, { continued: false });
      yPos += 15;
      doc
        .fontSize(9)
        .fillColor(darkGray)
        .text(invoice.terms, 50, yPos, { width: 495, continued: false });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Page numbers
      doc
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, {
          align: "center",
          width: doc.page.width - 100,
          continued: false,
        });

      // Company tax ID
      if (company.taxId) {
        doc.text(`Tax ID: ${company.taxId}`, 50, doc.page.height - 50, {
          continued: false,
        });
      }

      // Thank you message
      doc.text("Thank you for your business!", 0, doc.page.height - 35, {
        align: "center",
        width: doc.page.width,
        continued: false,
      });
    }
  }

  /**
   * Format currency amount
   */
  private static formatCurrency(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}
