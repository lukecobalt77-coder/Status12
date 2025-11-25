import { Client, GatewayIntentBits, Events, EmbedBuilder, SlashCommandBuilder, REST, Routes } from 'discord.js';
import { setBotReady } from './routes';

// Configuration constants
const SUPPORT_SERVER_ID = '1441548471906734173';
const HEARTBEAT_CHANNEL_ID = '1442653565427646495';
const STATUS_CHANNEL_ID = '1442640832325746728';
const HEARTBEAT_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes
const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// In-memory storage for heartbeat status
interface HeartbeatStatus {
  lastHeartbeatTimestamp: number | null;
  isOnline: boolean;
  statusMessageId: string | null;
}

const heartbeatStatus: HeartbeatStatus = {
  lastHeartbeatTimestamp: null,
  isOnline: false,
  statusMessageId: null,
};

// Helper function to format time difference in human-readable format
function formatTimeDifference(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
}

// Helper function to calculate next expected heartbeat
function getNextExpectedTime(lastHeartbeat: number): string {
  const nextExpected = lastHeartbeat + HEARTBEAT_INTERVAL_MS;
  const now = Date.now();
  const difference = nextExpected - now;

  if (difference <= 0) {
    return 'overdue';
  }

  const minutes = Math.floor(difference / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);

  if (minutes > 0) {
    return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `in ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

// Post/update status message in status channel
async function postStatusMessage(client: Client, isOnline: boolean) {
  try {
    const statusChannel = await client.channels.fetch(STATUS_CHANNEL_ID);
    
    if (statusChannel?.isTextBased() && 'send' in statusChannel) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      const embed = new EmbedBuilder()
        .setTitle('EverLink Status')
        .setTimestamp()
        .setFooter({ text: `EverLink | Today at ${timeString}` });
      
      if (isOnline) {
        embed
          .setColor(0x57F287) // Green
          .setDescription('System is operational');
      } else {
        embed
          .setColor(0xED4245) // Red
          .setDescription('System is offline');
      }
      
      // Try to edit existing message, or create a new one
      if (heartbeatStatus.statusMessageId) {
        try {
          const message = await statusChannel.messages.fetch(heartbeatStatus.statusMessageId);
          await message.edit({ embeds: [embed] });
          console.log(`📝 Updated status message: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        } catch (error) {
          // Message doesn't exist, post a new one
          const newMessage = await statusChannel.send({ embeds: [embed] });
          heartbeatStatus.statusMessageId = newMessage.id;
          console.log(`📢 Posted new status message: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        }
      } else {
        // First status message
        const newMessage = await statusChannel.send({ embeds: [embed] });
        heartbeatStatus.statusMessageId = newMessage.id;
        console.log(`📢 Posted initial status message: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating status channel:', error);
  }
}

// Update online/offline status based on last heartbeat
async function updateStatus(client: Client) {
  if (heartbeatStatus.lastHeartbeatTimestamp === null) {
    heartbeatStatus.isOnline = false;
    return;
  }

  const timeSinceLastHeartbeat = Date.now() - heartbeatStatus.lastHeartbeatTimestamp;
  const newOnlineState = timeSinceLastHeartbeat < OFFLINE_THRESHOLD_MS;
  
  // Detect status change
  if (heartbeatStatus.isOnline !== newOnlineState) {
    // Status changed! Update message
    await postStatusMessage(client, newOnlineState);
  }
  
  heartbeatStatus.isOnline = newOnlineState;
}

export async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  
  if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN not found in environment variables');
    process.exit(1);
  }

  // Create Discord client with necessary intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Register slash command
  const commands = [
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check EverLink\'s current status and last heartbeat'),
  ];

  // When bot is ready, register commands
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Discord bot logged in as ${readyClient.user.tag}`);
    
    try {
      // Clean up old messages in status channel on startup
      try {
        const statusChannel = await readyClient.channels.fetch(STATUS_CHANNEL_ID);
        if (statusChannel?.isTextBased() && 'messages' in statusChannel) {
          const messages = await statusChannel.messages.fetch({ limit: 100 });
          if (messages.size > 0) {
            console.log(`🧹 Cleaning up ${messages.size} old message(s) from status channel...`);
            const msgArray = Array.from(messages.values());
            for (const msg of msgArray) {
              try {
                await msg.delete();
              } catch (delError) {
                console.error(`⚠️ Failed to delete message:`, delError);
              }
            }
            console.log('✅ Status channel cleaned');
          }
        }
      } catch (error) {
        console.error('⚠️ Error cleaning status channel:', error);
      }
      
      const rest = new REST().setToken(token);
      
      console.log('🔄 Registering slash commands...');
      
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: commands.map(cmd => cmd.toJSON()) },
      );
      
      console.log('✅ Slash commands registered successfully');
      console.log(`👀 Monitoring channel ${HEARTBEAT_CHANNEL_ID} for EverLink heartbeats...`);
      
      // Mark bot as ready for health checks
      setBotReady(true);
    } catch (error) {
      console.error('❌ Error registering slash commands:', error);
    }

    // Start periodic status check
    setInterval(() => {
      updateStatus(client);
    }, 30000); // Check every 30 seconds
  });

  // Listen for messages to detect heartbeat
  client.on(Events.MessageCreate, async (message) => {
    // Only monitor the specific channel in the support server
    if (message.channelId !== HEARTBEAT_CHANNEL_ID || message.guildId !== SUPPORT_SERVER_ID) {
      return;
    }

    console.log(`📨 Message received in heartbeat channel from ${message.author.username}. Embeds: ${message.embeds.length}`);

    // Check if message has embeds
    if (message.embeds.length === 0) {
      return;
    }

    // Look for EverLink heartbeat embed
    for (const embed of message.embeds) {
      console.log(`📌 Checking embed title: "${embed.title}"`);
      if (embed.title && embed.title.includes('EverLink Status')) {
        const timestamp = Date.now();
        heartbeatStatus.lastHeartbeatTimestamp = timestamp;
        
        console.log(`💚 EverLink heartbeat detected at ${new Date(timestamp).toISOString()}`);
        await updateStatus(client);
        // Always update message to refresh timestamp
        await postStatusMessage(client, true);
        break;
      }
    }
  });

  // Handle slash commands
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'status') {
      await updateStatus(client);

      const embed = new EmbedBuilder()
        .setTitle('EverLink Monitor Status')
        .setTimestamp()
        .setFooter({ text: 'EverLink Monitoring Bot v1.0' });

      if (heartbeatStatus.lastHeartbeatTimestamp === null) {
        embed
          .setColor(0xED4245) // Red
          .addFields(
            { name: 'Current Status', value: '❌ **Offline** (No heartbeat detected yet)', inline: false },
            { name: 'Last Heartbeat', value: 'Never', inline: false },
          );
      } else {
        const timeSince = Date.now() - heartbeatStatus.lastHeartbeatTimestamp;
        const timeAgo = formatTimeDifference(timeSince);

        if (heartbeatStatus.isOnline) {
          const nextExpected = getNextExpectedTime(heartbeatStatus.lastHeartbeatTimestamp);
          
          embed
            .setColor(0x57F287) // Green
            .addFields(
              { name: 'Current Status', value: '✅ **Online**', inline: false },
              { name: 'Last Heartbeat', value: timeAgo, inline: true },
              { name: 'Next Expected', value: nextExpected, inline: true },
            );
        } else {
          embed
            .setColor(0xED4245) // Red
            .addFields(
              { name: 'Current Status', value: '❌ **Offline**', inline: false },
              { name: 'Last Heartbeat', value: timeAgo, inline: true },
              { name: 'Next Expected', value: 'overdue (15+ min)', inline: true },
            );
        }
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  });

  // Error handling
  client.on(Events.Error, (error) => {
    console.error('❌ Discord client error:', error);
  });

  // Login to Discord
  try {
    await client.login(token);
  } catch (error) {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
  }

  return client;
}
