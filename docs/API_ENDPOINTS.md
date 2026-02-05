# API Endpoints Documentation

This document provides a comprehensive overview of all API endpoints implemented and their functionality.

## 📋 **Table of Contents**
- [Invoice Endpoints](#invoice-endpoints)
- [Bill Endpoints](#bill-endpoints)  
- [Payment Endpoints](#payment-endpoints)
- [Customer Endpoints](#customer-endpoints)
- [Supplier Endpoints](#supplier-endpoints)
- [Account Endpoints](#account-endpoints)

---

## 🧾 **Invoice Endpoints**

### Core CRUD Operations
```
GET    /api/v1/invoices                    # Get all invoices for company
POST   /api/v1/invoices                    # Create new invoice
GET    /api/v1/invoices/:id                # Get invoice by ID
PUT    /api/v1/invoices/:id                # Update invoice
DELETE /api/v1/invoices/:id                # Delete invoice (draft only)
```

### Invoice Workflow Operations
```
POST   /api/v1/invoices/:id/send           # Send invoice to customer (creates journal entry)
POST   /api/v1/invoices/:id/void           # Void invoice (reverses journal entry)
POST   /api/v1/invoices/:id/payments       # Record payment for invoice
GET    /api/v1/invoices/:id/payments       # Get payment history for invoice
```

### Invoice Query Operations
```
GET    /api/v1/invoices/customer/:customerId     # Get invoices by customer
GET    /api/v1/invoices/status/:status         # Get invoices by status
GET    /api/v1/invoices/overdue               # Get overdue invoices
GET    /api/v1/invoices/search?q=term          # Search invoices
```

---

## 🧾 **Bill Endpoints**

### Core CRUD Operations
```
GET    /api/v1/bills                      # Get all bills for company
POST   /api/v1/bills                      # Create new bill
GET    /api/v1/bills/:id                  # Get bill by ID
PUT    /api/v1/bills/:id                  # Update bill
DELETE /api/v1/bills/:id                  # Delete bill (draft only)
```

### Bill Workflow Operations
```
POST   /api/v1/bills/:id/approve          # Approve bill (creates journal entry)
POST   /api/v1/bills/:id/void             # Void bill (reverses journal entry)
POST   /api/v1/bills/:id/payments          # Record payment for bill
GET    /api/v1/bills/:id/payments          # Get payment history for bill
```

### Bill Query Operations
```
GET    /api/v1/bills/supplier/:supplierId  # Get bills by supplier
GET    /api/v1/bills/status/:status        # Get bills by status
GET    /api/v1/bills/overdue              # Get overdue bills
GET    /api/v1/bills/search?q=term         # Search bills
```

---

## 💳 **Payment Endpoints**

### Payment Recording
```
POST   /api/v1/payments/received            # Record payment from customer
POST   /api/v1/payments/made               # Record payment to supplier
```

### Payment Utilities
```
POST   /api/v1/payments/suggest-allocations # Get suggested payment allocations
GET    /api/v1/payments                     # Get all payments
GET    /api/v1/payments/:id                 # Get payment by ID
```

---

## 👥 **Customer Endpoints**

```
GET    /api/v1/customers                   # Get all customers
POST   /api/v1/customers                   # Create customer
GET    /api/v1/customers/:id               # Get customer by ID
PUT    /api/v1/customers/:id               # Update customer
DELETE /api/v1/customers/:id               # Delete customer
GET    /api/v1/customers/search?q=term      # Search customers
```

---

## 🏢 **Supplier Endpoints**

```
GET    /api/v1/suppliers                   # Get all suppliers
POST   /api/v1/suppliers                   # Create supplier
GET    /api/v1/suppliers/:id               # Get supplier by ID
PUT    /api/v1/suppliers/:id               # Update supplier
DELETE /api/v1/suppliers/:id               # Delete supplier
GET    /api/v1/suppliers/search?q=term      # Search suppliers
```

---

## 🏦 **Account Endpoints**

```
GET    /api/v1/accounts                    # Get all accounts
GET    /api/v1/accounts?type=Asset         # Get accounts by type
GET    /api/v1/accounts/:id               # Get account by ID
POST   /api/v1/accounts                    # Create account
PUT    /api/v1/accounts/:id               # Update account
DELETE /api/v1/accounts/:id               # Delete account
```

---

## 🔄 **Workflow Sequences**

### Invoice Lifecycle
```
1. POST /api/v1/invoices                 # Create DRAFT invoice
2. PUT  /api/v1/invoices/:id              # Update invoice details
3. POST /api/v1/invoices/:id/send           # Send to customer (DRAFT→SENT)
4. POST /api/v1/invoices/:id/payments       # Record payment
5. Invoice status auto-updates to PARTIAL/PAID
6. Journal entries created automatically at each step
```

### Bill Lifecycle
```
1. POST /api/v1/bills                   # Create DRAFT bill
2. PUT  /api/v1/bills/:id                # Update bill details  
3. POST /api/v1/bills/:id/approve         # Approve bill (DRAFT→SENT)
4. POST /api/v1/bills/:id/payments         # Record payment
5. Bill status auto-updates to PARTIAL/PAID
6. Journal entries created automatically at each step
```

### Payment Processing
```
1. POST /api/v1/payments/suggest-allocations # Get suggested allocations
2. POST /api/v1/payments/received           # Record customer payment
   OR POST /api/v1/payments/made              # Record supplier payment
3. Document balances auto-update
4. Customer/Supplier balances adjust
5. Journal entries created automatically
```

---

## 📊 **Response Formats**

### Success Response
```json
{
  "success": true,
  "data": { /* Document or list data */ },
  "message": "Operation completed successfully",
  "count": 10 // For list responses
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": { /* Additional error context */ }
}
```

---

## 🔐 **Authentication**

All endpoints require:
- **Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Company Context**: Extracted from JWT token
- **User Permissions**: Validated per endpoint

---

## 📝 **Request/Response Examples**

### Create Invoice
```bash
POST /api/v1/invoices
Content-Type: application/json

{
  "customerId": "64f8a2b3c1e4d001a1b2c3",
  "lineItems": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 100,
      "accountId": "64f8a2b3c1e4d001a1b2c4"
    }
  ],
  "dueDate": "2024-02-15T00:00:00.000Z",
  "taxRate": 10,
  "notes": "Monthly consulting retainer"
}
```

### Record Payment
```bash
POST /api/v1/payments/received
Content-Type: application/json

{
  "customerId": "64f8a2b3c1e4d001a1b2c3",
  "paymentDate": "2024-01-30",
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "TXN-12345",
  "amount": 15000,
  "bankAccountId": "64f8a2b3c1e4d001a1b2c5",
  "allocations": [
    {
      "documentId": "64f8a2b3c1e4d001a1b2c6",
      "documentNumber": "INV-2024-001",
      "allocatedAmount": 15000,
      "documentType": "INVOICE"
    }
  ],
  "notes": "Payment for January invoice"
}
```

---

## 🚀 **New Features Added**

### Automatic Journal Entry Creation
- **Invoice Send**: Creates AR debit and Revenue credit entries
- **Bill Approve**: Creates Expense debit and AP credit entries  
- **Payment Record**: Creates cash flow entries with proper balancing
- **Transaction Safety**: All journal entries in database transactions

### Enhanced Payment System
- **Multi-Document Allocation**: Single payment can cover multiple invoices/bills
- **Smart Suggestions**: AI-powered payment allocation suggestions
- **Balance Calculations**: Automatic balance updates and status changes
- **Historical Tracking**: Complete payment history per document

### Improved Workflow Management
- **Document Status Management**: Automatic status transitions
- **Void/Reversal Support**: Proper journal entry reversals
- **Audit Trail**: Complete change history
- **Email Notifications**: Real-time email delivery

---

**This API documentation provides a comprehensive reference for all implemented endpoints and their usage patterns.**