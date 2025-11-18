const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure leveling system settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current server configuration'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('xprate')
        .setDescription('Set XP rate multiplier')
        .addNumberOption(option =>
          option
            .setName('rate')
            .setDescription('XP rate multiplier (e.g., 2 = 2x XP)')
            .setRequired(true)
            .setMinValue(0.1)
            .setMaxValue(10)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('levelchannel')
        .setDescription('Set channel for level up announcements')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel for level up messages (leave empty to use current channel)')
            .addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('announcement')
        .setDescription('Enable or disable level up announcements')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable announcements?')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stackroles')
        .setDescription('Enable or disable role stacking')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Stack roles? (if disabled, only highest role is given)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('message')
        .setDescription('Set custom level up message')
        .addStringOption(option =>
          option
            .setName('text')
            .setDescription('Message text ({user}, {level}, {oldLevel}, {xp})')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guild.id);

    if (subcommand === 'view') {
      const channel = config.level_up_channel 
        ? interaction.guild.channels.cache.get(config.level_up_channel)?.name || 'Unknown Channel'
        : 'Current Channel (Default)';

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('⚙️ Server Configuration')
        .setDescription(`Current leveling system settings for **${interaction.guild.name}**`)
        .addFields(
          { name: '📊 XP Rate', value: `${config.xp_rate}x`, inline: true },
          { name: '📢 Announcements', value: config.announcement_enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🎭 Stack Roles', value: config.stack_roles ? '✅ Yes' : '❌ No', inline: true },
          { name: '📺 Level Up Channel', value: channel, inline: false },
          { name: '💬 Level Up Message', value: `\`${config.level_up_message}\``, inline: false }
        )
        .setFooter({ text: 'Use /config <setting> to change values' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'xprate') {
      const rate = interaction.options.getNumber('rate');
      config.xp_rate = rate;
      await updateGuildConfig(interaction.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ XP Rate Updated')
        .setDescription(`XP rate multiplier set to **${rate}x**`)
        .addFields({ 
          name: 'Example', 
          value: `Users will now gain ${Math.floor(15 * rate)}-${Math.floor(25 * rate)} XP per message` 
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'levelchannel') {
      const channel = interaction.options.getChannel('channel');
      config.level_up_channel = channel ? channel.id : null;
      await updateGuildConfig(interaction.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Level Up Channel Updated')
        .setDescription(channel 
          ? `Level up messages will be sent to ${channel}`
          : 'Level up messages will be sent to the same channel where user leveled up')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'announcement') {
      const enabled = interaction.options.getBoolean('enabled');
      config.announcement_enabled = enabled ? 1 : 0;
      await updateGuildConfig(interaction.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor(enabled ? '#00FF00' : '#FF0000')
        .setTitle(enabled ? '✅ Announcements Enabled' : '❌ Announcements Disabled')
        .setDescription(enabled 
          ? 'Level up messages will now be displayed'
          : 'Level up messages will no longer be displayed')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'stackroles') {
      const enabled = interaction.options.getBoolean('enabled');
      config.stack_roles = enabled ? 1 : 0;
      await updateGuildConfig(interaction.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Role Stacking Updated')
        .setDescription(enabled 
          ? 'Users will keep all role rewards as they level up'
          : 'Users will only have their highest level role reward')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'message') {
      const message = interaction.options.getString('text');
      config.level_up_message = message;
      await updateGuildConfig(interaction.guild.id, config);

      const preview = message
        .replace('{user}', interaction.user.username)
        .replace('{level}', '10')
        .replace('{oldLevel}', '9')
        .replace('{xp}', '5000');

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Level Up Message Updated')
        .addFields(
          { name: 'New Message', value: `\`${message}\``, inline: false },
          { name: 'Preview', value: preview, inline: false },
          { name: 'Available Variables', value: '`{user}` `{level}` `{oldLevel}` `{xp}`', inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
