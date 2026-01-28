import { Router, Request, Response, NextFunction } from "express";
import { paymentService } from "./paymentService.js";
import logger from "../../config/logger.js";

/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 */

/**
 * Record a payment received from a customer
 * POST /api/v1/payments/received
 */
export const recordPaymentReceived = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = req.body.companyId || (req as any).user?.companyId;
    const userId = (req as any).user?._id;

    if (!companyId || !userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await paymentService.recordPaymentReceived(
      companyId,
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: result,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "recordPaymentReceived" });
    next(error);
  }
};

/**
 * Get all payments received for a company
 * GET /api/v1/payments/received
 */
export const getPaymentsReceived = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = req.query.companyId as string || (req as any).user?.companyId;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payments = await paymentService.getPaymentsReceived(companyId);

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "getPaymentsReceived" });
    next(error);
  }
};

/**
 * Get payments for a specific customer
 * GET /api/v1/payments/customer/:customerId
 */
export const getCustomerPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = req.query.companyId as string || (req as any).user?.companyId;
    const { customerId } = req.params;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payments = await paymentService.getCustomerPayments(
      companyId,
      customerId,
    );

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "getCustomerPayments" });
    next(error);
  }
};

/**
 * Get payment by ID
 * GET /api/v1/payments/:paymentId
 */
export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = req.query.companyId as string || (req as any).user?.companyId;
    const { paymentId } = req.params;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payment = await paymentService.getPaymentById(companyId, paymentId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.logError(error as Error, { operation: "getPaymentById" });
    next(error);
  }
};

/**
 * Get suggested payment allocations
 * POST /api/v1/payments/suggest-allocations
 * Useful for UI to auto-suggest how to allocate payment across invoices
 */
export const suggestPaymentAllocations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = req.body.companyId || (req as any).user?.companyId;
    const { customerId, paymentAmount } = req.body;

    if (!companyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!customerId || !paymentAmount) {
      return res.status(400).json({
        success: false,
        message: "customerId and paymentAmount are required",
      });
    }

    const result = await paymentService.suggestPaymentAllocations(
      companyId,
      customerId,
      paymentAmount,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.logError(error as Error, {
      operation: "suggestPaymentAllocations",
    });
    next(error);
  }
};
