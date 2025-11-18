const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands and bot information'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📚 Bot Commands Help')
      .setDescription('Select a category from the menu below to view commands')
      .addFields(
        {
          name: '👤 User Commands',
          value: 'Commands available to all users',
          inline: true
        },
        {
          name: '⚙️ Admin Commands',
          value: 'Commands for administrators only',
          inline: true
        },
        {
          name: '🔧 Utility Commands',
          value: 'Helpful utility commands',
          inline: true
        }
      )
      .setFooter({ text: 'Use the dropdown menu below to view specific command categories' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_menu')
          .setPlaceholder('Select a command category')
          .addOptions([
            {
              label: 'User Commands',
              description: 'View commands available to all users',
              value: 'user_commands',
              emoji: '👤'
            },
            {
              label: 'Admin Commands',
              description: 'View administrator commands',
              value: 'admin_commands',
              emoji: '⚙️'
            },
            {
              label: 'Utility Commands',
              description: 'View utility and info commands',
              value: 'utility_commands',
              emoji: '🔧'
            },
            {
              label: 'Bot Information',
              description: 'Learn more about the bot',
              value: 'bot_info',
              emoji: '🤖'
            }
          ])
      );

    const message = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true 
    });

    // Create collector for menu interactions
    const collector = message.createMessageComponentCollector({ 
      time: 300000 // 5 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return await i.reply({ 
          content: '❌ This menu is not for you!', 
          ephemeral: true 
        });
      }

      let newEmbed;

      if (i.values[0] === 'user_commands') {
        newEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('👤 User Commands')
          .setDescription('Commands available to all users:')
          .addFields(
            { 
              name: '/rank [user]', 
              value: 'View your or another user\'s rank card with level and XP', 
              inline: false 
            },
            { 
              name: '/leaderboard [page]', 
              value: 'View the server leaderboard (top 10 per page)', 
              inline: false 
            },
            { 
              name: '/stats [user]', 
              value: 'View detailed statistics and progress for a user', 
              inline: false 
            },
            { 
              name: '/rewards', 
              value: 'View all available role rewards and required levels', 
              inline: false 
            },
            { 
              name: '/milestone [user]', 
              value: 'View your next goals and milestones', 
              inline: false 
            },
            { 
              name: '/compare <user>', 
              value: 'Compare your stats with another user', 
              inline: false 
            },
            { 
              name: '/top <category> [amount]', 
              value: 'View top users by XP, level, or messages', 
              inline: false 
            },
            { 
              name: '/server', 
              value: 'View server-wide leveling statistics', 
              inline: false 
            }
          )
          .setFooter({ text: 'Select another category from the menu' });
      }
      else if (i.values[0] === 'admin_commands') {
        newEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('⚙️ Admin Commands')
          .setDescription('Commands available to administrators:')
          .addFields(
            { 
              name: '/config <setting>', 
              value: 'Configure bot settings (xprate, levelchannel, announcement, stackroles, message, view)', 
              inline: false 
            },
            { 
              name: '/addxp <user> <amount>', 
              value: 'Add XP to a user', 
              inline: false 
            },
            { 
              name: '/removexp <user> <amount>', 
              value: 'Remove XP from a user', 
              inline: false 
            },
            { 
              name: '/setxp <user> <xp>', 
              value: 'Set a user\'s total XP to a specific amount', 
              inline: false 
            },
            { 
              name: '/resetxp [user]', 
              value: 'Reset XP for a user or entire server', 
              inline: false 
            },
            { 
              name: '/rolereward <add|remove|list>', 
              value: 'Manage role rewards for levels', 
              inline: false 
            },
            { 
              name: '/ignored <add|remove|list>', 
              value: 'Manage channels where XP gain is disabled', 
              inline: false 
            },
            { 
              name: '/backup <create|export>', 
              value: 'Backup or export server data', 
              inline: false 
            },
            { 
              name: '/test', 
              value: 'Test all bot features and display system status', 
              inline: false 
            }
          )
          .setFooter({ text: '⚠️ These commands require Administrator permission' });
      }
      else if (i.values[0] === 'utility_commands') {
        newEmbed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('🔧 Utility Commands')
          .setDescription('Helpful utility and information commands:')
          .addFields(
            { 
              name: '/help', 
              value: 'Display this help menu', 
              inline: false 
            },
            { 
              name: '/test', 
              value: 'Run comprehensive bot diagnostics (Admin only)', 
              inline: false 
            },
            { 
              name: '/server', 
              value: 'View server statistics and configuration', 
              inline: false 
            },
            { 
              name: '/config view', 
              value: 'View current server configuration (Admin only)', 
              inline: false 
            }
          )
          .setFooter({ text: 'These commands provide helpful information' });
      }
      else if (i.values[0] === 'bot_info') {
        newEmbed = new EmbedBuilder()
          .setColor('#f39c12')
          .setTitle('🤖 Bot Information')
          .setDescription('**Leveling ** - A comprehensive Discord leveling system')
          .addFields(
            { 
              name: '✨ Nexus Features', 
              value: '• Nexus-style XP system\n• Role rewards for leveling\n• Customizable settings\n• Advanced statistics\n• Leaderboards & rankings\n• Backup & export tools', 
              inline: false 
            },
            { 
              name: '🎮 How It Works', 
              value: 'Users gain 15-25 XP per message (60 second cooldown). As you level up, you earn role rewards and climb the leaderboard!', 
              inline: false 
            },
            { 
              name: '📊 XP Formula', 
              value: 'XP needed = 5 × (level²) + 50 × level + 100', 
              inline: false 
            },
            { 
              name: '🔗 Commands', 
              value: 'Use `/help` to view all available commands', 
              inline: true 
            },
            { 
              name: '💡 Tips', 
              value: 'Stay active, chat regularly, and watch your rank rise!', 
              inline: true 
            }
          )
          .setFooter({ text: 'Thank you for using Leveling NexusBot!' });
      }

      await i.update({ embeds: [newEmbed] });
    });

    collector.on('end', () => {
      row.components[0].setDisabled(true);
      interaction.editReply({ components: [row] }).catch(() => {});
    });
  },
};
