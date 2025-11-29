declare global {
  namespace Express {
    interface Request {
      authSession?: Record<string, unknown>;
      authUser?: Record<string, unknown>;
    }
  }
}

export {};
