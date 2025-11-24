# EverLink Monitoring Bot

## Overview
A Discord bot that monitors EverLink's heartbeat messages and reports its status. Built with discord.js v14.

## Purpose
This bot monitors a specific Discord channel for EverLink heartbeat messages (sent every 8 minutes) and tracks whether EverLink is online or offline. If no heartbeat is received for 15+ minutes, the bot considers EverLink offline.

## Current State
✅ **ACTIVE** - Bot is deployed and monitoring

## Recent Changes
- **2024-11-24**: Initial bot implementation
  - Created Discord bot with message monitoring
  - Implemented /status slash command
  - Added heartbeat detection and tracking
  - Set up online/offline status reporting
  - Added automatic status change notifications to status channel (1442640832325746728)
  - Bot now posts embeds when EverLink goes online/offline

## Bot Configuration

### Monitored Server & Channels
- **Support Server ID**: `1441548471906734173`
- **Heartbeat Channel ID**: `1442653565427646495` (where EverLink sends heartbeats)
- **Status Channel ID**: `1442640832325746728` (where bot posts status updates)

### Detection Parameters
- **Heartbeat Interval**: Every 8 minutes
- **Offline Threshold**: 15+ minutes without heartbeat
- **Heartbeat Format**: Discord embed with title containing "EverLink Heartbeat"

### Commands
- `/status` - Shows EverLink's current online/offline status, last heartbeat time, and next expected heartbeat

### Automatic Status Updates
The bot automatically posts status change notifications to the status channel when:
- **EverLink goes OFFLINE**: Posts a red embed when no heartbeat is received for 15+ minutes
- **EverLink comes back ONLINE**: Posts a green embed when heartbeat is restored

## Project Architecture

### File Structure
```
server/
├── discord-bot.ts      # Main Discord bot logic
├── index-dev.ts        # Development server startup (includes bot)
├── index-prod.ts       # Production server startup
└── app.ts              # Express server configuration

design_guidelines.md    # Discord message formatting guidelines
```

### Key Components

#### Discord Bot (`server/discord-bot.ts`)
- **Client Setup**: Uses Gateway Intents for Guilds, GuildMessages, and MessageContent
- **Heartbeat Tracking**: In-memory storage for last heartbeat timestamp and online status
- **Message Monitoring**: Listens to all messages in the heartbeat channel, detects embeds with "EverLink Heartbeat" title
- **Status Updates**: Periodic checks (every 30 seconds) to update online/offline status
- **Slash Commands**: Registered globally, returns formatted embeds with status information

#### Helper Functions
- `formatTimeDifference()`: Converts milliseconds to human-readable format (e.g., "3 minutes ago")
- `getNextExpectedTime()`: Calculates when the next heartbeat is expected
- `updateStatus()`: Updates online/offline status based on last heartbeat time

## Environment Variables

### Required Secrets
- `DISCORD_BOT_TOKEN`: Discord bot authentication token (stored as secret)
- `SESSION_SECRET`: Session secret for Express server

### Bot Permissions Required
- Read Messages/View Channels
- Send Messages  
- Use Slash Commands

### Gateway Intents Required
- MESSAGE CONTENT INTENT (must be enabled in Discord Developer Portal)
- GUILD MEMBERS INTENT

## User Preferences

### Design Philosophy
- Clean, Discord-native embed formatting
- Color-coded status (green for online, red for offline)
- Human-readable timestamps (e.g., "3 minutes ago" instead of "180 seconds")
- Ephemeral responses (only visible to command user)
- Professional footer with bot version

### Status Display Format
```
✅ EverLink Status: Online
Last heartbeat: 3 minutes ago
Next expected: in 5 minutes
```

## Running the Bot

The bot starts automatically with the application:
```bash
npm run dev
```

The bot will:
1. Connect to Discord
2. Register slash commands globally
3. Start monitoring the heartbeat channel
4. Begin periodic status checks

## Monitoring & Logs

Console output shows:
- Bot login confirmation with username
- Slash command registration status
- Heartbeat detection events with timestamps
- Channel monitoring status

## Technical Details

### Data Structure
```typescript
interface HeartbeatStatus {
  lastHeartbeatTimestamp: number | null;
  isOnline: boolean;
}
```

### Constants
- `HEARTBEAT_INTERVAL_MS`: 8 minutes (480,000ms)
- `OFFLINE_THRESHOLD_MS`: 15 minutes (900,000ms)
- `STATUS_CHECK_INTERVAL`: 30 seconds

### Embed Colors
- **Online**: `0x57F287` (Green - Discord success color)
- **Offline**: `0xED4245` (Red - Discord danger color)

## Future Enhancements (Next Phase)
- Persistent storage for heartbeat history
- Uptime statistics and trends
- Alert notifications when EverLink goes offline
- `/history` command for historical uptime data
- Web dashboard for real-time monitoring
- Configurable alert channels
- Multiple service monitoring
