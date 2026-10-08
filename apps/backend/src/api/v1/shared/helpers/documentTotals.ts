import { MONEY_TOLERANCE, round2, sumMoney } from "./money.js";

/**
 * Shared amount/status logic for invoices and bills. Both documents use the
 * same status strings (Draft, Sent, Partial, Paid, Overdue, Void).
 */

interface TotalsLineItem {
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface TotalsDocument {
  lineItems: TotalsLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
}

/**
 * Recompute all derived amounts from the line items, rounded to cents.
 * Server-side totals are authoritative; client-supplied totals are ignored.
 */
export function applyDocumentTotals(doc: TotalsDocument): void {
  for (const item of doc.lineItems) {
    item.amount = round2((item.quantity || 0) * (item.unitPrice || 0));
  }

  doc.subtotal = sumMoney(doc.lineItems.map((item) => item.amount));
  doc.taxAmount = round2((doc.subtotal * (doc.taxRate || 0)) / 100);
  doc.discount = round2(doc.discount || 0);

  const total = round2(doc.subtotal + doc.taxAmount - doc.discount);
  if (total < 0) {
    throw new Error("Discount cannot exceed the subtotal plus tax");
  }

  doc.totalAmount = total;
  doc.amountPaid = round2(doc.amountPaid || 0);
  doc.balanceDue = round2(doc.totalAmount - doc.amountPaid);
}

interface StatusDocument {
  status: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: Date;
}

/**
 * Derive the payment status of a posted document. Draft and Void documents
 * are left untouched: a draft must never silently become "Overdue" (it would
 * then skip the Draft → posted transition and never reach the ledger).
 */
export function applyDocumentStatus(doc: StatusDocument): void {
  if (doc.status === "Draft" || doc.status === "Void") return;

  if (doc.balanceDue <= MONEY_TOLERANCE) {
    doc.status = "Paid";
  } else if (doc.amountPaid > 0) {
    doc.status = "Partial";
  } else if (doc.dueDate && doc.dueDate < new Date()) {
    doc.status = "Overdue";
  } else {
    doc.status = "Sent";
  }
}

/** Statuses of documents that have been posted and still carry a balance. */
export const OPEN_DOCUMENT_STATUSES = ["Sent", "Partial", "Overdue"];
