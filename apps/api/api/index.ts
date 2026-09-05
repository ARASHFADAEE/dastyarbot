import 'reflect-metadata';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';

// Compiled Nest output (produced by `nest build` in Vercel buildCommand)
import { createNestApp } from '../dist/bootstrap-app';

let cachedExpress: Express | null = null;

async function getServer(): Promise<Express> {
  if (!cachedExpress) {
    const { express } = await createNestApp();
    cachedExpress = express;
  }
  return cachedExpress;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await getServer();
  return server(req as never, res as never);
}
