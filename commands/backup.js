const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { db } = require('../database');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Backup or restore server leveling data')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a backup of current server data'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Export server data as JSON file')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (subcommand === 'create') {
      try {
        const users = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM users WHERE guild_id = ?', [interaction.guild.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        const roleRewards = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM role_rewards WHERE guild_id = ?', [interaction.guild.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        const config = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM guild_config WHERE guild_id = ?', [interaction.guild.id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        const ignoredChannels = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM ignored_channels WHERE guild_id = ?', [interaction.guild.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        const backupData = {
          version: '1.0',
          guild_id: interaction.guild.id,
          guild_name: interaction.guild.name,
          backup_date: new Date().toISOString(),
          users,
          role_rewards: roleRewards,
          config,
          ignored_channels: ignoredChannels,
          stats: {
            total_users: users.length,
            total_xp: users.reduce((sum, u) => sum + u.total_xp, 0),
            total_messages: users.reduce((sum, u) => sum + u.messages, 0)
          }
        };

        const fileName = `backup_${interaction.guild.id}_${Date.now()}.json`;
        const filePath = path.join(__dirname, '..', fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

        const attachment = new AttachmentBuilder(filePath, { name: fileName });

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Backup Created Successfully')
          .setDescription('Your server leveling data has been backed up!')
          .addFields(
            { name: '👥 Users Backed Up', value: users.length.toString(), inline: true },
            { name: '🎁 Role Rewards', value: roleRewards.length.toString(), inline: true },
            { name: '🚫 Ignored Channels', value: ignoredChannels.length.toString(), inline: true },
            { name: '💬 Total Messages', value: backupData.stats.total_messages.toLocaleString(), inline: true },
            { name: '⭐ Total XP', value: backupData.stats.total_xp.toLocaleString(), inline: true },
            { name: '📅 Backup Date', value: new Date().toLocaleString(), inline: true }
          )
          .setFooter({ text: 'Keep this file safe! You can use it to restore data if needed.' })
          .setTimestamp();

        await interaction.editReply({ 
          embeds: [embed],
          files: [attachment]
        });
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);

      } catch (error) {
        console.error('Backup error:', error);
        await interaction.editReply({
          content: '❌ Failed to create backup. Please check bot permissions and try again.'
        });
      }
    }

    else if (subcommand === 'export') {
      try {
        const users = await new Promise((resolve, reject) => {
          db.all(
            'SELECT user_id, level, total_xp, xp, messages FROM users WHERE guild_id = ? ORDER BY total_xp DESC',
            [interaction.guild.id],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });
        const exportData = await Promise.all(users.map(async (user, index) => {
          try {
            const discordUser = await interaction.client.users.fetch(user.user_id);
            return {
              rank: index + 1,
              username: discordUser.username,
              user_id: user.user_id,
              level: user.level,
              current_xp: user.xp,
              total_xp: user.total_xp,
              messages: user.messages
            };
          } catch {
            return {
              rank: index + 1,
              username: 'Unknown User',
              user_id: user.user_id,
              level: user.level,
              current_xp: user.xp,
              total_xp: user.total_xp,
              messages: user.messages
            };
          }
        }));

        const fileName = `export_${interaction.guild.id}_${Date.now()}.json`;
        const filePath = path.join(__dirname, '..', fileName);
        
        fs.writeFileSync(filePath, JSON.stringify({
          guild_name: interaction.guild.name,
          guild_id: interaction.guild.id,
          export_date: new Date().toISOString(),
          total_users: exportData.length,
          users: exportData
        }, null, 2));

        const attachment = new AttachmentBuilder(filePath, { name: fileName });

        const embed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📊 Data Exported Successfully')
          .setDescription(`Exported data for **${exportData.length}** users`)
          .addFields(
            { name: 'Format', value: 'JSON', inline: true },
            { name: 'Total Users', value: exportData.length.toString(), inline: true },
            { name: 'Export Date', value: new Date().toLocaleString(), inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ 
          embeds: [embed],
          files: [attachment]
        });
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);

      } catch (error) {
        console.error('Export error:', error);
        await interaction.editReply({
          content: '❌ Failed to export data. Please try again.'
        });
      }
    }
  },
};
