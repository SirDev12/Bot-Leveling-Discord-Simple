const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getIgnoredChannels, addIgnoredChannel, removeIgnoredChannel } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ignored')
    .setDescription('Manage channels where XP gain is disabled')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Ignore a channel (disable XP gain)')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to ignore')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Unignore a channel (enable XP gain)')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to unignore')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all ignored channels')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const channel = interaction.options.getChannel('channel');
      
      const ignored = await getIgnoredChannels(interaction.guild.id);
      if (ignored.some(ch => ch.channel_id === channel.id)) {
        return await interaction.reply({
          content: `❌ ${channel} is already ignored!`,
          ephemeral: true
        });
      }

      await addIgnoredChannel(interaction.guild.id, channel.id);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚫 Channel Ignored')
        .setDescription(`${channel} has been added to the ignore list.\n\nUsers will **not** gain XP from messages in this channel.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'remove') {
      const channel = interaction.options.getChannel('channel');
      
      const ignored = await getIgnoredChannels(interaction.guild.id);
      if (!ignored.some(ch => ch.channel_id === channel.id)) {
        return await interaction.reply({
          content: `❌ ${channel} is not in the ignore list!`,
          ephemeral: true
        });
      }

      await removeIgnoredChannel(interaction.guild.id, channel.id);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Channel Unignored')
        .setDescription(`${channel} has been removed from the ignore list.\n\nUsers will now gain XP from messages in this channel.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'list') {
      const ignored = await getIgnoredChannels(interaction.guild.id);

      if (ignored.length === 0) {
        return await interaction.reply({
          content: '✅ No channels are currently ignored. Users can gain XP in all channels.',
          ephemeral: true
        });
      }

      const channelList = ignored.map(ch => {
        const channel = interaction.guild.channels.cache.get(ch.channel_id);
        return channel ? `• ${channel}` : `• Unknown Channel (${ch.channel_id})`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🚫 Ignored Channels')
        .setDescription(`**${ignored.length}** channel(s) are currently ignored:\n\n${channelList}`)
        .setFooter({ text: 'Users cannot gain XP in these channels' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
