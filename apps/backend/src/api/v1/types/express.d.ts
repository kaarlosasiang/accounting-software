declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      name?: string;
      companyId?: string | null;
      role?: string | null;
      [key: string]: unknown;
    }

    interface Request {
      authSession?: Record<string, unknown>;
      authUser?: AuthUser;
      correlationId?: string;
    }
  }
}

export {};
