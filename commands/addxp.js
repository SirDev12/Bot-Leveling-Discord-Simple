const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, updateUser } = require('../database');
const { getLevelFromXP, getCurrentLevelXP } = require('../xpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('Add XP to a user (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give XP to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of XP to add')
        .setMinValue(1)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const xpAmount = interaction.options.getInteger('amount');

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Cannot modify bot XP!', ephemeral: true });
    }

    const userData = await getUser(targetUser.id, interaction.guild.id);
    const newTotalXP = userData.total_xp + xpAmount;
    const newLevel = getLevelFromXP(newTotalXP);
    const currentXP = getCurrentLevelXP(newTotalXP);

    await updateUser(
      targetUser.id,
      interaction.guild.id,
      currentXP,
      newLevel,
      newTotalXP,
      userData.messages,
      userData.last_message
    );

    await interaction.reply({
      content: `✅ Added **${xpAmount.toLocaleString()} XP** to **${targetUser.username}**!\nNew Total: **${newTotalXP.toLocaleString()} XP** (Level ${newLevel})`,
      ephemeral: true
    });
  },
};
