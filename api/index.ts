import type { Request, Response } from 'express';
import app from '../server.ts';

// Expose Express application to Vercel Serverless runtime
export default function handler(req: Request, res: Response) {
  return app(req, res);
}

export { app };
