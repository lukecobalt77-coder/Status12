import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Store Discord bot status for health checks
let discordBotReady = false;

export function setBotReady(ready: boolean) {
  discordBotReady = ready;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Health check endpoint for UptimeRobot monitoring
  app.get('/health', (_req, res) => {
    if (discordBotReady) {
      res.status(200).json({ status: 'healthy', bot: 'online' });
    } else {
      res.status(503).json({ status: 'degraded', bot: 'starting' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
