const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getRoleRewards } = require('../database');
const { getXPForLevel, getTotalXPForLevel } = require('../xpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('milestone')
    .setDescription('View your next milestones and goals')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view milestones for (leave empty for yourself)')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    if (target.bot) {
      return await interaction.reply({
        content: '❌ Bots do not have leveling milestones!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const userData = await getUser(target.id, interaction.guild.id);
    const roleRewards = await getRoleRewards(interaction.guild.id);
    
    // Find next role rewards
    const nextRewards = roleRewards
      .filter(reward => reward.level > userData.level)
      .sort((a, b) => a.level - b.level)
      .slice(0, 3);

    // Calculate level milestones
    const milestones = [10, 25, 50, 75, 100].filter(lvl => lvl > userData.level);
    const nextMilestones = milestones.slice(0, 3);

    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(`🎯 Milestones for ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**Current Level:** ${userData.level}\n**Total XP:** ${userData.total_xp.toLocaleString()}`);

    // Next level
    const xpForNextLevel = getXPForLevel(userData.level);
    const xpNeeded = xpForNextLevel - userData.xp;
    embed.addFields({
      name: '⬆️ Next Level',
      value: `**Level ${userData.level + 1}**\n${xpNeeded.toLocaleString()} XP needed\n${userData.xp.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP`,
      inline: false
    });

    // Next role rewards
    if (nextRewards.length > 0) {
      const rewardsText = nextRewards.map(reward => {
        const role = interaction.guild.roles.cache.get(reward.role_id);
        const roleName = role ? `<@&${role.id}>` : 'Unknown Role';
        const totalXPNeeded = getTotalXPForLevel(reward.level);
        const xpToGo = totalXPNeeded - userData.total_xp;
        const levelsToGo = reward.level - userData.level;
        
        return `**Level ${reward.level}** → ${roleName}\n└ ${xpToGo.toLocaleString()} XP (${levelsToGo} levels away)`;
      }).join('\n\n');

      embed.addFields({
        name: '🎁 Next Role Rewards',
        value: rewardsText,
        inline: false
      });
    } else {
      embed.addFields({
        name: '🎁 Next Role Rewards',
        value: 'No upcoming role rewards available',
        inline: false
      });
    }

    // Level milestones
    if (nextMilestones.length > 0) {
      const milestonesText = nextMilestones.map(level => {
        const totalXPNeeded = getTotalXPForLevel(level);
        const xpToGo = totalXPNeeded - userData.total_xp;
        const levelsToGo = level - userData.level;
        
        const emoji = level === 100 ? '💯' : level === 75 ? '💎' : level === 50 ? '⭐' : level === 25 ? '🌟' : '✨';
        
        return `${emoji} **Level ${level}**\n└ ${xpToGo.toLocaleString()} XP (${levelsToGo} levels away)`;
      }).join('\n\n');

      embed.addFields({
        name: '🏆 Major Milestones',
        value: milestonesText,
        inline: false
      });
    }

    embed.setFooter({ text: 'Keep chatting to reach your goals!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
