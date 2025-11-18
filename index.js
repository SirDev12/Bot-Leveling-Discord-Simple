require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { addXP, handleRoleRewards } = require('./xpSystem');
const { getGuildConfig } = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`📊 Bot is in ${client.guilds.cache.size} servers`);

  // Rotate through multiple activities (at least 10 different ones)
  const activities = [
    { name: 'your messages 📊', type: ActivityType.Watching },
    { name: 'for commands ⚙️', type: ActivityType.Listening },
    { name: 'the leaderboard 🏆', type: ActivityType.Watching },
    { name: 'games with you 🎮', type: ActivityType.Playing },
    { name: 'music and chats 🎵', type: ActivityType.Listening },
    { name: 'server milestones ✨', type: ActivityType.Watching },
    { name: 'role rewards 🎁', type: ActivityType.Watching },
    { name: 'you reaching new levels 🔥', type: ActivityType.Competing },
    { name: 'tips & help 💡', type: ActivityType.Listening },
    { name: 'tracking messages ⏱️', type: ActivityType.Watching },
    { name: 'supporting the community 🤝', type: ActivityType.Watching }
  ];

  function setRandomActivity() {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    if (client.user) {
      client.user.setActivity(activity.name, { type: activity.type });
    }
  }

  // Set one immediately and rotate every 30 seconds
  setRandomActivity();
  setInterval(setRandomActivity, 30 * 1000);
});

// Message event - XP gain
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const result = await addXP(message);

    if (result && result.leveledUp) {
      const config = await getGuildConfig(message.guild.id);

      // Handle role rewards
      await handleRoleRewards(message.member, result.newLevel, message.guild.id);

      // Send level up message if enabled
      if (config.announcement_enabled === 1) {
        let levelUpMessage = config.level_up_message || 'GG {user}, you just advanced to level {level}!';
        levelUpMessage = levelUpMessage
          .replace('{user}', `<@${message.author.id}>`)
          .replace('{level}', result.newLevel)
          .replace('{oldLevel}', result.oldLevel)
          .replace('{xp}', result.totalXP);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎉 Level Up!')
          .setDescription(levelUpMessage)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'New Level', value: `${result.newLevel}`, inline: true },
            { name: 'Total XP', value: `${result.totalXP.toLocaleString()}`, inline: true }
          )
          .setTimestamp();

        // Send to specific channel or current channel
        const targetChannel = config.level_up_channel 
          ? message.guild.channels.cache.get(config.level_up_channel) 
          : message.channel;

        if (targetChannel) {
          await targetChannel.send({ embeds: [embed] });
        }
      }
    }
  } catch (error) {
    console.error('Error processing XP:', error);
  }
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const reply = { content: '❌ There was an error executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// Voice state tracking (for future voice XP)
const voiceUsers = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;
  const guildId = newState.guild.id;

  // User joined a voice channel
  if (!oldState.channelId && newState.channelId) {
    voiceUsers.set(`${userId}-${guildId}`, Date.now());
  }
  
  // User left a voice channel
  if (oldState.channelId && !newState.channelId) {
    voiceUsers.delete(`${userId}-${guildId}`);
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(process.env.DISCORD_TOKEN);
