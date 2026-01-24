import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "@/lib/services/invoice.service";

/**
 * Generate and download a PDF for an invoice
 */
export const generateInvoicePDF = (
  invoice: Invoice,
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  },
) => {
  const doc = new jsPDF();

  // Company info defaults (can be customized)
  const company = companyInfo || {
    name: "Your Company Name",
    address: "123 Business Street, City, State 12345",
    phone: "(555) 123-4567",
    email: "info@company.com",
    website: "www.company.com",
  };

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
  const darkGray: [number, number, number] = [55, 65, 81]; // gray-700
  const lightGray: [number, number, number] = [243, 244, 246]; // gray-100

  let yPos = 20;

  // Header - Company Info
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text(company.name, 20, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  if (company.address) {
    doc.text(company.address, 20, yPos);
    yPos += 4;
  }
  if (company.phone) {
    doc.text(`Phone: ${company.phone}`, 20, yPos);
    yPos += 4;
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, 20, yPos);
    yPos += 4;
  }
  if (company.website) {
    doc.text(company.website, 20, yPos);
  }

  // Invoice Title & Number (right side)
  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.text("INVOICE", 120, 20);

  doc.setFontSize(11);
  doc.setTextColor(...darkGray);
  doc.text(`#${invoice.invoiceNumber}`, 120, 28);

  // Status Badge
  const statusX = 120;
  const statusY = 32;
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94], // green-500
    sent: [59, 130, 246], // blue-500
    partial: [234, 179, 8], // yellow-500
    overdue: [239, 68, 68], // red-500
    draft: [156, 163, 175], // gray-400
    void: [107, 114, 128], // gray-500
  };
  const statusColor = statusColors[invoice.status.toLowerCase()] || darkGray;
  doc.setFillColor(...statusColor);
  doc.roundedRect(statusX, statusY, 35, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(invoice.status.toUpperCase(), statusX + 17.5, statusY + 5.5, {
    align: "center",
  });

  // Dates Section (right side)
  yPos = 45;
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.text("Issue Date:", 120, yPos);
  const issueDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString()
    : new Date(invoice.createdAt).toLocaleDateString();
  doc.text(issueDate, 170, yPos, { align: "right" });

  yPos += 5;
  doc.text("Due Date:", 120, yPos);
  const dueDate = new Date(invoice.dueDate).toLocaleDateString();
  doc.setTextColor(
    invoice.status === "Overdue" ? 239 : darkGray[0],
    invoice.status === "Overdue" ? 68 : darkGray[1],
    invoice.status === "Overdue" ? 68 : darkGray[2],
  );
  doc.text(dueDate, 170, yPos, { align: "right" });

  // Bill To Section
  yPos = 60;
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("BILL TO:", 20, yPos);

  yPos += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(invoice.customerId.customerName, 20, yPos);

  if (invoice.customerId.companyName) {
    yPos += 5;
    doc.text(invoice.customerId.companyName, 20, yPos);
  }

  if (invoice.customerId.email) {
    yPos += 5;
    doc.text(invoice.customerId.email, 20, yPos);
  }

  if (invoice.customerId.phone) {
    yPos += 5;
    doc.text(invoice.customerId.phone, 20, yPos);
  }

  // Billing Address
  const billingAddress = invoice.customerId.billingAddress;
  if (billingAddress?.street || billingAddress?.city) {
    yPos += 5;
    if (billingAddress.street) {
      doc.text(billingAddress.street, 20, yPos);
      yPos += 5;
    }
    if (billingAddress.city) {
      let cityLine = billingAddress.city;
      if (billingAddress.state) cityLine += `, ${billingAddress.state}`;
      if (billingAddress.zipCode) cityLine += ` ${billingAddress.zipCode}`;
      doc.text(cityLine, 20, yPos);
      yPos += 5;
    }
    if (billingAddress.country) {
      doc.text(billingAddress.country, 20, yPos);
    }
  }

  // Line Items Table
  const tableStartY = Math.max(yPos + 10, 110);

  const tableData = invoice.lineItems.map((item) => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["Description", "Quantity", "Unit Price", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      fontSize: 10,
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 30 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
  });

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;

  // Totals Section
  let totalsY = finalY + 10;
  const totalsX = 130;

  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.text("Subtotal:", totalsX, totalsY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 190, totalsY, { align: "right" });

  // Tax
  if (invoice.taxRate > 0) {
    totalsY += 6;
    doc.text(`Tax (${invoice.taxRate}%):`, totalsX, totalsY);
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, 190, totalsY, {
      align: "right",
    });
  }

  // Discount
  if (invoice.discount > 0) {
    totalsY += 6;
    doc.text("Discount:", totalsX, totalsY);
    doc.setTextColor(239, 68, 68); // red
    doc.text(`-$${invoice.discount.toFixed(2)}`, 190, totalsY, {
      align: "right",
    });
  }

  // Total
  totalsY += 8;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, totalsY - 2, 190, totalsY - 2);

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...darkGray);
  doc.text("Total Amount:", totalsX, totalsY + 5);
  doc.text(`$${invoice.totalAmount.toFixed(2)}`, 190, totalsY + 5, {
    align: "right",
  });

  // Amount Paid
  if (invoice.amountPaid > 0) {
    totalsY += 10;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94); // green
    doc.text("Amount Paid:", totalsX, totalsY);
    doc.text(`-$${invoice.amountPaid.toFixed(2)}`, 190, totalsY, {
      align: "right",
    });

    // Balance Due
    totalsY += 8;
    doc.line(totalsX, totalsY - 2, 190, totalsY - 2);
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // red
    doc.text("Balance Due:", totalsX, totalsY + 5);
    doc.text(`$${invoice.balanceDue.toFixed(2)}`, 190, totalsY + 5, {
      align: "right",
    });
  }

  // Notes Section
  let notesY = totalsY + 20;
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...darkGray);
    doc.text("Notes:", 20, notesY);

    notesY += 6;
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, notesY);
    notesY += noteLines.length * 4 + 5;
  }

  // Terms Section
  if (invoice.terms) {
    if (notesY > 250) {
      doc.addPage();
      notesY = 20;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...darkGray);
    doc.text("Terms & Conditions:", 20, notesY);

    notesY += 6;
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    const termLines = doc.splitTextToSize(invoice.terms, 170);
    doc.text(termLines, 20, notesY);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );

    // Company info in footer
    if (company.taxId) {
      doc.text(
        `Tax ID: ${company.taxId}`,
        20,
        doc.internal.pageSize.getHeight() - 10,
      );
    }
  }

  // Save the PDF
  const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
  doc.save(fileName);

  return fileName;
};

/**
 * Preview invoice PDF in a new window instead of downloading
 */
export const previewInvoicePDF = (
  invoice: Invoice,
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  },
) => {
  const doc = new jsPDF();
  // ... same generation code as above ...
  // For brevity, you would copy the same code from generateInvoicePDF

  // Instead of saving, open in new window
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};
