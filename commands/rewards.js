const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRoleRewards } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rewards')
    .setDescription('View all available role rewards and required levels'),

  async execute(interaction) {
    const roleRewards = await getRoleRewards(interaction.guild.id);

    if (roleRewards.length === 0) {
      return await interaction.reply({
        content: '❌ No role rewards have been set up yet!\n\nAdministrators can add rewards using `/rolereward add`',
        ephemeral: true
      });
    }

    const rewardsList = roleRewards.map(reward => {
      const role = interaction.guild.roles.cache.get(reward.role_id);
      const roleName = role ? role.name : 'Unknown Role';
      const roleColor = role ? role.hexColor : '#99AAB5';
      const roleMention = role ? `<@&${role.id}>` : 'Unknown Role';
      
      return {
        level: reward.level,
        role: roleMention,
        name: roleName,
        color: roleColor
      };
    });

    // Group rewards by level ranges for better display
    const description = rewardsList.map((reward, index) => {
      const emoji = reward.level >= 50 ? '💎' : reward.level >= 30 ? '🥇' : reward.level >= 10 ? '🥈' : '🥉';
      return `${emoji} **Level ${reward.level}** → ${reward.role}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#f39c12')
      .setTitle('🎁 Role Rewards')
      .setDescription(`Level up to earn these exclusive roles!\n\n${description}`)
      .addFields({
        name: '📊 Summary',
        value: `**Total Rewards:** ${roleRewards.length}\n**Highest Level:** ${Math.max(...roleRewards.map(r => r.level))}\n**Lowest Level:** ${Math.min(...roleRewards.map(r => r.level))}`,
        inline: false
      })
      .setFooter({ text: 'Keep chatting to earn these roles! • Use /rank to see your progress' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
