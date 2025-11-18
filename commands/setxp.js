const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, updateUser } = require('../database');
const { getLevelFromXP, getCurrentLevelXP } = require('../xpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('Set a user\'s XP (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to modify')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('xp')
        .setDescription('Amount of XP to set')
        .setMinValue(0)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const xpAmount = interaction.options.getInteger('xp');

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Cannot modify bot XP!', ephemeral: true });
    }

    const userData = await getUser(targetUser.id, interaction.guild.id);
    const newLevel = getLevelFromXP(xpAmount);
    const currentXP = getCurrentLevelXP(xpAmount);

    await updateUser(
      targetUser.id,
      interaction.guild.id,
      currentXP,
      newLevel,
      xpAmount,
      userData.messages,
      userData.last_message
    );

    await interaction.reply({
      content: `✅ Successfully set **${targetUser.username}**'s XP to **${xpAmount.toLocaleString()}** (Level ${newLevel})`,
      ephemeral: true
    });
  },
};
