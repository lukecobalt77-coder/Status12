import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";
import { startDiscordBot } from "./discord-bot";

export async function serveStatic(app: Express, _server: Server) {
  // Serve simple health status page
  app.get("/", (_req, res) => {
    res.set("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EverLink Monitor Bot</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .status { padding: 10px; border-radius: 4px; margin: 10px 0; font-weight: bold; }
            .online { background: #d4edda; color: #155724; }
            .offline { background: #f8d7da; color: #721c24; }
            .starting { background: #fff3cd; color: #856404; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 EverLink Monitor Bot</h1>
            <p>Discord bot monitoring EverLink heartbeat status</p>
            <div id="status" class="status starting">
              Status: Loading...
            </div>
            <p><small>Updates every 5 seconds</small></p>
            <p><small>For health checks, visit <code>/health</code></small></p>
          </div>
          <script>
            async function updateStatus() {
              try {
                const response = await fetch('/health');
                const data = await response.json();
                const statusDiv = document.getElementById('status');
                
                if (data.bot === 'online') {
                  statusDiv.className = 'status online';
                  statusDiv.textContent = '✓ Bot: Online';
                } else if (data.bot === 'starting') {
                  statusDiv.className = 'status starting';
                  statusDiv.textContent = '⟳ Bot: Starting...';
                } else {
                  statusDiv.className = 'status offline';
                  statusDiv.textContent = '✗ Bot: Offline';
                }
              } catch (error) {
                const statusDiv = document.getElementById('status');
                statusDiv.className = 'status offline';
                statusDiv.textContent = '✗ Connection Error';
              }
            }
            
            // Update immediately and then every 5 seconds
            updateStatus();
            setInterval(updateStatus, 5000);
          </script>
        </body>
      </html>
    `);
  });

  // Start Discord bot in background (don't wait for it)
  startDiscordBot().catch(err => {
    console.error('❌ Discord bot failed to start:', err);
  });
}

(async () => {
  await runApp(serveStatic);
})();
